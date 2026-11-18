<script setup>
import { watch, ref, nextTick } from 'vue'
import { dialogo, responder } from '../stores/confirm.js'

const el = ref(null)
watch(() => dialogo.abierto, async (a) => {
  await nextTick()
  if (a && !el.value.open) el.value.showModal()
  if (!a && el.value.open) el.value.close()
})
</script>

<template>
  <dialog ref="el" class="dialogo" aria-labelledby="dlg-titulo" @cancel.prevent="responder(false)">
    <h2 id="dlg-titulo">{{ dialogo.titulo }}</h2>
    <p v-if="dialogo.mensaje">{{ dialogo.mensaje }}</p>
    <div class="acciones">
      <button type="button" class="btn" @click="responder(false)">Cancelar</button>
      <button type="button" class="btn" :class="dialogo.peligro ? 'btn-peligro' : 'btn-primario'" @click="responder(true)">
        {{ dialogo.confirmar }}
      </button>
    </div>
  </dialog>
</template>
