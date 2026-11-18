<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/index.js'
import { sesion } from '../stores/session.js'
import { fmtFecha } from '../utils/format.js'
import { useCarga, useAccion } from '../composables.js'
import { postSchema, LIMITES, validate, hasErrors } from '../utils/validators.js'
import StateBlock from '../components/StateBlock.vue'
import FormField from '../components/FormField.vue'

const props = defineProps({ id: String })
const router = useRouter()
const editando = computed(() => Boolean(props.id))
const form = reactive({ board_id: '', titulo: '', cuerpo: '' })
const errores = ref({})
const accion = useAccion()

const tablones = useCarga(() => api.listBoards())
const original = useCarga(async () => {
  if (!editando.value) return null
  const p = await api.getPost(props.id)
  if (!p) throw Object.assign(new Error('La publicación no existe.'), { code: 'P0002' })
  if (p.author_id !== sesion.state.perfil?.id || p.estado !== 'publicado') {
    throw Object.assign(new Error('Solo podés modificar tus publicaciones activas.'), { code: 'P0001' })
  }
  Object.assign(form, { board_id: p.board.id, titulo: p.titulo, cuerpo: p.cuerpo })
  return p
})

async function enviar() {
  errores.value = validate(form, editando.value ? { titulo: postSchema.titulo, cuerpo: postSchema.cuerpo } : postSchema)
  if (hasErrors(errores.value)) return
  const r = await accion.ejecutar(
    () => (editando.value ? api.updatePost(props.id, form).then(() => ({ id: props.id })) : api.createPost(form)),
    { ok: editando.value ? 'Cambios guardados.' : 'Publicación creada.' }
  )
  if (r.ok) router.push(`/p/${r.valor.id}`)
}
</script>

<template>
  <section>
    <h1>{{ editando ? 'Modificar publicación' : 'Nueva publicación' }}</h1>
    <p v-if="sesion.suspendidoHasta.value" class="aviso aviso-borrado" role="alert">
      Tu cuenta está suspendida hasta el {{ fmtFecha(sesion.suspendidoHasta.value) }}. No podés publicar hasta entonces.
    </p>
    <StateBlock :cargando="tablones.cargando.value || original.cargando.value" :error="tablones.error.value || original.error.value"
      @reintentar="() => { tablones.recargar(); original.recargar() }">
      <form novalidate class="formulario" @submit.prevent="enviar">
        <FormField v-if="!editando" label="Tablón" :error="errores.board_id" v-slot="{ id, describe, invalido }">
          <select :id="id" v-model="form.board_id" :aria-invalid="invalido" :aria-describedby="describe">
            <option value="" disabled>Elegí un tablón…</option>
            <option v-for="b in tablones.datos.value" :key="b.id" :value="b.id">{{ b.nombre }} — {{ b.descripcion }}</option>
          </select>
        </FormField>
        <FormField label="Título" :error="errores.titulo" :contador="`${form.titulo.length}/${LIMITES.titulo.max}`" v-slot="{ id, describe, invalido }">
          <input :id="id" v-model="form.titulo" type="text" :maxlength="LIMITES.titulo.max" :aria-invalid="invalido" :aria-describedby="describe" autocomplete="off" />
        </FormField>
        <FormField label="Mensaje" :error="errores.cuerpo" :contador="`${form.cuerpo.length}/${LIMITES.cuerpo.max}`"
          ayuda="Es un foro anónimo: no incluyas nombres, teléfonos ni datos personales." v-slot="{ id, describe, invalido }">
          <textarea :id="id" v-model="form.cuerpo" rows="8" :maxlength="LIMITES.cuerpo.max" :aria-invalid="invalido" :aria-describedby="describe" />
        </FormField>
        <div class="acciones">
          <button class="btn" type="button" :disabled="accion.cargando.value" @click="router.back()">Cancelar</button>
          <button class="btn btn-primario" type="submit" :disabled="accion.cargando.value || Boolean(sesion.suspendidoHasta.value)">
            {{ accion.cargando.value ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar' }}
          </button>
        </div>
      </form>
    </StateBlock>
  </section>
</template>
