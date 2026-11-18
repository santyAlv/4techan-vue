<script setup>
import { ref, reactive, computed } from 'vue'
import { api } from '../services/index.js'
import { confirmar } from '../stores/confirm.js'
import { MOTIVOS, RESULTADOS, LIMITES, resolutionSchema, validate, hasErrors } from '../utils/validators.js'
import { fmtFecha, hace } from '../utils/format.js'
import { useCarga, useAccion } from '../composables.js'
import StateBlock from '../components/StateBlock.vue'
import FormField from '../components/FormField.vue'
import TestBadge from '../components/TestBadge.vue'

const tab = ref('reportes')
const motivo = ref('')
const q = ref('')
const reportes = useCarga(() => api.listReports({ estado: 'pendiente' }))
const apelaciones = useCarga(() => api.listAppeals({ estado: 'pendiente' }))
const accion = useAccion()

const filtrados = computed(() =>
  (reportes.datos.value ?? [])
    .filter((r) => !motivo.value || r.motivo === motivo.value)
    .filter((r) => !q.value.trim() || `${r.post.titulo} ${r.post.autor_alias} ${r.detalle ?? ''}`.toLowerCase().includes(q.value.trim().toLowerCase()))
)

const abierto = ref(null)
const form = reactive({ resultado: '', nota: '' })
const errores = ref({})
function abrir(r) { abierto.value = r.id; Object.assign(form, { resultado: '', nota: '' }); errores.value = {} }

async function resolver(r) {
  errores.value = validate(form, resolutionSchema)
  if (hasErrors(errores.value)) return
  const grave = ['post_borrado', 'borrado_ban_3d'].includes(form.resultado)
  const ok = await confirmar({
    titulo: `¿Resolver como «${RESULTADOS[form.resultado]}»?`,
    mensaje: grave ? 'La publicación deja de verse (se conserva en el historial) y el autor podrá apelar.' : 'Queda registrado en el historial de moderación.',
    confirmar: 'Resolver', peligro: grave
  })
  if (!ok) return
  const res = await accion.ejecutar(() => api.resolveReport(r.id, form), { ok: 'Reporte resuelto y registrado en el historial.' })
  if (res.ok) { abierto.value = null; reportes.recargar() }
}
async function decidir(a, decision) {
  const ok = await confirmar({
    titulo: decision === 'revertida' ? '¿Revertir la resolución?' : '¿Mantener la resolución?',
    mensaje: decision === 'revertida' ? 'La publicación vuelve a mostrarse y se levanta la suspensión, si la había.' : 'La publicación sigue eliminada.',
    confirmar: decision === 'revertida' ? 'Revertir' : 'Mantener'
  })
  if (!ok) return
  const res = await accion.ejecutar(() => api.resolveAppeal(a.id, decision), { ok: decision === 'revertida' ? 'Resolución revertida.' : 'Resolución mantenida.' })
  if (res.ok) apelaciones.recargar()
}
</script>

<template>
  <h1>Moderación</h1>
  <p class="lead">Panel de la Comisión de Normas y Convivencia. <RouterLink to="/moderacion/historial">Ver historial completo</RouterLink></p>

  <div class="pestanas" role="tablist" aria-label="Secciones de moderación">
    <button role="tab" type="button" :aria-selected="tab === 'reportes'" class="btn" :class="{ activo: tab === 'reportes' }" @click="tab = 'reportes'">
      Reportes pendientes <span v-if="reportes.datos.value">({{ reportes.datos.value.length }})</span>
    </button>
    <button role="tab" type="button" :aria-selected="tab === 'apelaciones'" class="btn" :class="{ activo: tab === 'apelaciones' }" @click="tab = 'apelaciones'">
      Apelaciones pendientes <span v-if="apelaciones.datos.value">({{ apelaciones.datos.value.length }})</span>
    </button>
  </div>

  <section v-if="tab === 'reportes'" role="tabpanel">
    <form class="filtros" role="search" @submit.prevent>
      <label>Buscar <input v-model="q" type="search" placeholder="Título, alias o detalle" maxlength="80" /></label>
      <label>Motivo
        <select v-model="motivo">
          <option value="">Todos</option>
          <option v-for="(t, k) in MOTIVOS" :key="k" :value="k">{{ t }}</option>
        </select>
      </label>
    </form>
    <StateBlock :cargando="reportes.cargando.value" :error="reportes.error.value" :vacio="filtrados.length === 0"
      :texto-vacio="reportes.datos.value?.length ? 'Ningún reporte coincide con el filtro.' : 'No hay reportes pendientes. 🎉'" @reintentar="reportes.recargar">
      <ul class="lista sin-vineta">
        <li v-for="r in filtrados" :key="r.id" class="tarjeta">
          <header class="tarjeta-cab">
            <span class="insignia insignia-alerta">{{ MOTIVOS[r.motivo] }}</span>
            <span class="meta">Reportado {{ hace(r.created_at) }} por {{ r.reporter?.alias }}</span>
            <TestBadge :item="r" />
          </header>
          <h3><RouterLink :to="`/p/${r.post.id}`">{{ r.post.titulo }}</RouterLink></h3>
          <p class="meta">Autor: {{ r.post.autor_alias }}</p>
          <p v-if="r.detalle">«{{ r.detalle }}»</p>
          <button v-if="abierto !== r.id" class="btn btn-primario" type="button" @click="abrir(r)">Resolver</button>
          <form v-else novalidate class="formulario" @submit.prevent="resolver(r)">
            <FormField label="Resolución" :error="errores.resultado" v-slot="{ id, describe, invalido }">
              <select :id="id" v-model="form.resultado" :aria-invalid="invalido" :aria-describedby="describe">
                <option value="" disabled>Elegí qué resolvés…</option>
                <option v-for="(t, k) in RESULTADOS" :key="k" :value="k">{{ t }}</option>
              </select>
            </FormField>
            <FormField label="Nota (obligatoria si hay suspensión)" :error="errores.nota" :contador="`${form.nota.length}/${LIMITES.nota.max}`" v-slot="{ id, describe, invalido }">
              <textarea :id="id" v-model="form.nota" rows="3" :maxlength="LIMITES.nota.max" :aria-invalid="invalido" :aria-describedby="describe" />
            </FormField>
            <div class="acciones">
              <button class="btn" type="button" :disabled="accion.cargando.value" @click="abierto = null">Cancelar</button>
              <button class="btn btn-primario" type="submit" :disabled="accion.cargando.value">{{ accion.cargando.value ? 'Guardando…' : 'Guardar resolución' }}</button>
            </div>
          </form>
        </li>
      </ul>
    </StateBlock>
  </section>

  <section v-else role="tabpanel">
    <StateBlock :cargando="apelaciones.cargando.value" :error="apelaciones.error.value" :vacio="apelaciones.datos.value?.length === 0"
      texto-vacio="No hay apelaciones pendientes." @reintentar="apelaciones.recargar">
      <ul class="lista sin-vineta">
        <li v-for="a in apelaciones.datos.value" :key="a.id" class="tarjeta">
          <header class="tarjeta-cab">
            <span class="insignia">{{ RESULTADOS[a.resolution.resultado] }}</span>
            <span class="meta">Apelada {{ fmtFecha(a.created_at) }}</span>
            <TestBadge :item="a" />
          </header>
          <h3><RouterLink :to="`/p/${a.resolution.report.post.id}`">{{ a.resolution.report.post.titulo }}</RouterLink></h3>
          <p class="meta">Autor: {{ a.resolution.report.post.autor_alias }}</p>
          <p v-if="a.resolution.nota" class="meta">Nota original: {{ a.resolution.nota }}</p>
          <p>Apelación: «{{ a.texto }}»</p>
          <div class="acciones">
            <button class="btn" type="button" :disabled="accion.cargando.value" @click="decidir(a, 'mantenida')">Mantener resolución</button>
            <button class="btn btn-primario" type="button" :disabled="accion.cargando.value" @click="decidir(a, 'revertida')">Revertir resolución</button>
          </div>
        </li>
      </ul>
    </StateBlock>
  </section>
</template>
