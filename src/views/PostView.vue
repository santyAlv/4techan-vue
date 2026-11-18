<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/index.js'
import { sesion } from '../stores/session.js'
import { can } from '../utils/permissions.js'
import { confirmar } from '../stores/confirm.js'
import { fmtFecha, hace } from '../utils/format.js'
import { useCarga, useAccion } from '../composables.js'
import { commentSchema, LIMITES, validate, hasErrors } from '../utils/validators.js'
import StateBlock from '../components/StateBlock.vue'
import FormField from '../components/FormField.vue'
import TestBadge from '../components/TestBadge.vue'
import ReportDialog from '../components/ReportDialog.vue'
import Cuerpo from '../components/Cuerpo.vue'

const props = defineProps({ id: String })
const router = useRouter()
const { datos: post, cargando, error, recargar } = useCarga(() => api.getPost(props.id))
const accion = useAccion()
const rol = sesion.rol

const yo = computed(() => sesion.state.perfil?.id)
const esAutor = computed(() => post.value && post.value.author_id === yo.value)
const activa = computed(() => post.value?.estado === 'publicado')
const puedeReportar = computed(() => activa.value && !esAutor.value && can(rol.value, 'reporte:crear') && !sesion.suspendidoHasta.value)
const puedeComentar = computed(() => activa.value && can(rol.value, 'comentario:crear') && !sesion.suspendidoHasta.value)
const ESTADO = { autor: 'La cancelaste vos (solo la ves vos y la Comisión).', moderacion: 'Fue eliminada por la Comisión de Normas y Convivencia.' }

const reportando = ref(false)
const form = reactive({ cuerpo: '' })
const errores = ref({})

async function cancelar() {
  const ok = await confirmar({
    titulo: '¿Cancelar la publicación?',
    mensaje: 'Deja de verse en el tablón, pero se conserva en el historial. Esta acción no se puede deshacer desde acá.',
    confirmar: 'Cancelar publicación', peligro: true
  })
  if (!ok) return
  const r = await accion.ejecutar(() => api.cancelPost(post.value.id), { ok: 'Publicación cancelada.' })
  if (r.ok) router.push('/mi-actividad')
}
async function comentar() {
  errores.value = validate(form, commentSchema)
  if (hasErrors(errores.value)) return
  const r = await accion.ejecutar(() => api.createComment({ post_id: post.value.id, cuerpo: form.cuerpo }), { ok: 'Comentario publicado.' })
  if (r.ok) { form.cuerpo = ''; recargar() }
}
async function cancelarComentario(c) {
  if (!(await confirmar({ titulo: '¿Borrar tu comentario?', confirmar: 'Borrar', peligro: true }))) return
  const r = await accion.ejecutar(() => api.cancelComment(c.id), { ok: 'Comentario borrado.' })
  if (r.ok) recargar()
}
</script>

<template>
  <StateBlock :cargando="cargando" :error="error" :vacio="!cargando && !error && !post" texto-vacio="La publicación no existe o ya no está disponible." @reintentar="recargar">
    <article v-if="post" class="detalle">
      <p class="migas"><RouterLink to="/">Tablones</RouterLink> › <RouterLink :to="`/t/${post.board.slug}`">{{ post.board.nombre }}</RouterLink></p>
      <header class="post-cab op-cab">
        <h1 class="asunto">{{ post.titulo }}</h1>
        <span class="nombre">{{ post.autor_alias }}</span>
        <time :datetime="post.created_at" :title="fmtFecha(post.created_at)" class="fecha">{{ hace(post.created_at) }}</time>
        <span class="numero">No.{{ post.id }}</span>
        <TestBadge :item="post" />
      </header>
      <p v-if="post.estado === 'borrado'" class="aviso aviso-borrado" role="note">{{ ESTADO[post.borrado_por] }}</p>
      <Cuerpo :texto="post.cuerpo" />

      <div class="acciones">
        <template v-if="esAutor && activa">
          <RouterLink class="btn" :to="`/p/${post.id}/editar`">Modificar</RouterLink>
          <button class="btn btn-peligro" type="button" :disabled="accion.cargando.value" @click="cancelar">Cancelar publicación</button>
        </template>
        <button v-if="puedeReportar" class="btn" type="button" @click="reportando = true">Reportar</button>
      </div>
    </article>

    <section v-if="post" aria-labelledby="h-coment">
      <h2 id="h-coment">Respuestas ({{ post.comments.filter((c) => c.estado === 'publicado').length }})</h2>
      <p v-if="!post.comments.length" class="estado">Todavía no hay respuestas.</p>
      <ul class="comentarios">
        <li v-for="c in post.comments" :key="c.id" class="respuesta" :class="{ 'post-borrado': c.estado === 'borrado' }">
          <p class="post-cab"><span class="nombre">{{ c.autor_alias }}</span>
            <time :datetime="c.created_at" :title="fmtFecha(c.created_at)" class="fecha">{{ hace(c.created_at) }}</time>
            <span class="numero">No.{{ c.id }}</span>
            <TestBadge :item="c" />
            <span v-if="c.estado === 'borrado'" class="insignia insignia-borrado">Borrado</span></p>
          <Cuerpo :texto="c.cuerpo" />
          <button v-if="c.author_id === yo && c.estado === 'publicado'" class="btn btn-chico" type="button" @click="cancelarComentario(c)">Borrar</button>
        </li>
      </ul>

      <form v-if="puedeComentar" novalidate @submit.prevent="comentar">
        <FormField label="Tu comentario" :error="errores.cuerpo" :contador="`${form.cuerpo.length}/${LIMITES.comentario.max}`" v-slot="{ id, describe, invalido }">
          <textarea :id="id" v-model="form.cuerpo" rows="3" :maxlength="LIMITES.comentario.max" :aria-invalid="invalido" :aria-describedby="describe" />
        </FormField>
        <button class="btn btn-primario" type="submit" :disabled="accion.cargando.value">{{ accion.cargando.value ? 'Publicando…' : 'Comentar' }}</button>
      </form>
      <p v-else-if="sesion.suspendidoHasta.value" class="aviso aviso-borrado">Tu cuenta está suspendida hasta el {{ fmtFecha(sesion.suspendidoHasta.value) }}: podés leer pero no comentar.</p>
      <p v-else-if="activa && !sesion.logueado.value" class="aviso">
        <RouterLink :to="{ name: 'ingresar', query: { volver: `/p/${post.id}` } }">Ingresá</RouterLink> para comentar.
      </p>
    </section>

    <ReportDialog v-if="post" :post-id="post.id" :abierto="reportando" @cerrar="reportando = false" @enviado="reportando = false" />
  </StateBlock>
</template>
