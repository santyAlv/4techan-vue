<script setup>
// Muestra "cargando", error (con reintento) o "vacío" según el estado; si no, el contenido.
defineProps({ cargando: Boolean, error: { type: String, default: '' }, vacio: Boolean, textoVacio: { type: String, default: 'No hay nada para mostrar.' } })
defineEmits(['reintentar'])
</script>

<template>
  <p v-if="cargando" class="estado" role="status"><span class="spinner" aria-hidden="true"></span> Cargando…</p>
  <div v-else-if="error" class="estado estado-error" role="alert">
    <p>{{ error }}</p>
    <button class="btn" type="button" @click="$emit('reintentar')">Reintentar</button>
  </div>
  <p v-else-if="vacio" class="estado">{{ textoVacio }}</p>
  <slot v-else />
</template>
