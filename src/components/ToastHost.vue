<script setup>
import { toasts, dismiss } from '../stores/toast.js'
</script>

<template>
  <div class="toasts" aria-live="polite" aria-atomic="false">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast-${t.tipo}`" :role="t.tipo === 'error' ? 'alert' : 'status'">
      <span>{{ t.tipo === 'ok' ? '✔ ' : t.tipo === 'error' ? '✖ ' : 'ℹ ' }}{{ t.texto }}</span>
      <button class="btn-icono" type="button" aria-label="Cerrar aviso" @click="dismiss(t.id)">×</button>
    </div>
  </div>
</template>
