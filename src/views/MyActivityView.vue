<script setup>
import { ref, reactive, watch } from 'vue'
import { api } from '../services/index.js'
import { sesion } from '../stores/session.js'
import { RESULTADOS, APELACION_ESTADOS, LIMITES, appealSchema, validate, hasErrors } from '../utils/validators.js'
import { fmtFecha } from '../utils/format.js'
import { useCarga, useAccion } from '../composables.js'
import StateBlock from '../components/StateBlock.vue'
import PostCard from '../components/PostCard.vue'
import FormField from '../components/FormField.vue'

const filtro = ref('')
const posts = useCarga(() => api.listPosts({ autor_id: sesion.state.perfil.id, estado: filtro.value || undefined, pageSize: 50 }))
const resoluciones = useCarga(() => api.myResolutions())
watch(filtro, () => posts.recargar())

const abierta = ref(null)
const form = reactive({ texto: '' })
const errores = ref({})
const accion = useAccion()

function abrir(r) { abierta.value = r.resolution_id; form.texto = ''; errores.value = {} }
async function apelar(r) {
  errores.value = validate(form, appealSchema)
  if (hasErrors(errores.value)) return
  const res = await accion.ejecutar(() => api.appeal(r.resolution_id, form.texto), { ok: 'Apelación enviada. La Comisión la va a revisar.' })
  if (res.ok) { abierta.value = null; resoluciones.recargar() }
}
const estadoAp = (r) => (r.apelacion_estado ? APELACION_ESTADOS[r.apelacion_estado] : APELACION_ESTADOS.sin_apelar)
</script>

<template>
  <h1>Mi actividad</h1>

  <section aria-labelledby="h-mis-posts">
    <h2 id="h-mis-posts">Mis publicaciones</h2>
    <form class="filtros" @submit.prevent>
      <label>Estado
        <select v-model="filtro">
          <option value="">Todas</option>
          <option value="publicado">Publicadas</option>
          <option value="borrado">Canceladas o eliminadas</option>
        </select>
      </label>
    </form>
    <StateBlock :cargando="posts.cargando.value" :error="posts.error.value" :vacio="posts.datos.value?.data.length === 0"
      texto-vacio="No tenés publicaciones con ese estado." @reintentar="posts.recargar">
      <div class="lista"><PostCard v-for="p in posts.datos.value?.data" :key="p.id" :post="p" /></div>
    </StateBlock>
  </section>

  <section aria-labelledby="h-mod">
    <h2 id="h-mod">Moderación de mis publicaciones</h2>
    <p class="lead">Acá ves qué resolvió la Comisión sobre tus publicaciones reportadas. Si te parece injusto, podés apelar una vez.</p>
    <StateBlock :cargando="resoluciones.cargando.value" :error="resoluciones.error.value" :vacio="resoluciones.datos.value?.length === 0"
      texto-vacio="La Comisión no resolvió reportes sobre tus publicaciones." @reintentar="resoluciones.recargar">
      <ul class="lista sin-vineta">
        <li v-for="r in resoluciones.datos.value" :key="r.resolution_id" class="tarjeta">
          <h3><RouterLink :to="`/p/${r.post_id}`">{{ r.post_titulo }}</RouterLink></h3>
          <p><strong>{{ RESULTADOS[r.resultado] }}</strong> · {{ fmtFecha(r.created_at) }}</p>
          <p v-if="r.nota" class="meta">Nota de la Comisión: {{ r.nota }}</p>
          <p><span class="insignia" :class="`ap-${r.apelacion_estado ?? 'sin_apelar'}`">{{ estadoAp(r) }}</span></p>
          <p v-if="r.apelacion_texto" class="meta">Tu apelación: {{ r.apelacion_texto }}</p>
          <template v-if="!r.apelacion_estado && r.resultado !== 'descartado'">
            <button v-if="abierta !== r.resolution_id" class="btn" type="button" @click="abrir(r)">Apelar</button>
            <form v-else novalidate @submit.prevent="apelar(r)">
              <FormField label="¿Por qué apelás?" :error="errores.texto" :contador="`${form.texto.length}/${LIMITES.apelacion.max}`" v-slot="{ id, describe, invalido }">
                <textarea :id="id" v-model="form.texto" rows="3" :maxlength="LIMITES.apelacion.max" :aria-invalid="invalido" :aria-describedby="describe" />
              </FormField>
              <div class="acciones">
                <button class="btn" type="button" :disabled="accion.cargando.value" @click="abierta = null">Cancelar</button>
                <button class="btn btn-primario" type="submit" :disabled="accion.cargando.value">{{ accion.cargando.value ? 'Enviando…' : 'Enviar apelación' }}</button>
              </div>
            </form>
          </template>
        </li>
      </ul>
    </StateBlock>
  </section>
</template>
