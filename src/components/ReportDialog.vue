<script setup>
import { reactive, ref, watch, nextTick } from 'vue'
import FormField from './FormField.vue'
import { api } from '../services/index.js'
import { useAccion } from '../composables.js'
import { MOTIVOS, LIMITES, reportSchema, validate, hasErrors } from '../utils/validators.js'

const props = defineProps({ postId: Number, abierto: Boolean })
const emit = defineEmits(['cerrar', 'enviado'])
const el = ref(null)
const form = reactive({ motivo: '', detalle: '' })
const errores = ref({})
const { cargando, ejecutar } = useAccion()

watch(() => props.abierto, async (a) => {
  await nextTick()
  if (a) {
    Object.assign(form, { motivo: '', detalle: '' })
    errores.value = {}
    el.value.showModal()
  } else if (el.value.open) el.value.close()
})

async function enviar() {
  errores.value = validate(form, reportSchema)
  if (hasErrors(errores.value)) return
  const r = await ejecutar(() => api.createReport({ post_id: props.postId, ...form }), { ok: 'Reporte enviado. La Comisión lo va a revisar.' })
  if (r.ok) emit('enviado')
}
</script>

<template>
  <dialog ref="el" class="dialogo" aria-labelledby="rep-titulo" @cancel.prevent="emit('cerrar')">
    <h2 id="rep-titulo">Reportar publicación</h2>
    <form novalidate @submit.prevent="enviar">
      <FormField label="Motivo" :error="errores.motivo" v-slot="{ id, describe, invalido }">
        <select :id="id" v-model="form.motivo" :aria-invalid="invalido" :aria-describedby="describe">
          <option value="" disabled>Elegí un motivo…</option>
          <option v-for="(txt, k) in MOTIVOS" :key="k" :value="k">{{ txt }}</option>
        </select>
      </FormField>
      <FormField label="Detalle (opcional, obligatorio si el motivo es «Otro»)" :error="errores.detalle"
        :contador="`${form.detalle.length}/${LIMITES.detalle.max}`" v-slot="{ id, describe, invalido }">
        <textarea :id="id" v-model="form.detalle" rows="4" :maxlength="LIMITES.detalle.max" :aria-invalid="invalido" :aria-describedby="describe" />
      </FormField>
      <div class="acciones">
        <button type="button" class="btn" :disabled="cargando" @click="emit('cerrar')">Cancelar</button>
        <button type="submit" class="btn btn-primario" :disabled="cargando">{{ cargando ? 'Enviando…' : 'Enviar reporte' }}</button>
      </div>
    </form>
  </dialog>
</template>
