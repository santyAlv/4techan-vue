<script setup>
import { useId } from 'vue'
// Etiqueta + control + error accesible. El control recibe el id por el slot.
defineProps({ label: String, error: { type: String, default: '' }, ayuda: { type: String, default: '' }, contador: { type: String, default: '' } })
const id = useId()
</script>

<template>
  <div class="campo" :class="{ 'campo-error': error }">
    <label :for="id">{{ label }}</label>
    <slot :id="id" :describe="`${id}-d`" :invalido="Boolean(error)" />
    <p v-if="ayuda && !error" :id="`${id}-d`" class="ayuda">{{ ayuda }}</p>
    <p v-if="error" :id="`${id}-d`" class="error-texto" role="alert">{{ error }}</p>
    <p v-if="contador" class="contador">{{ contador }}</p>
  </div>
</template>
