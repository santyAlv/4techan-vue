<script setup>
import { sesion } from '../stores/session.js'
import { ROL_NOMBRE } from '../utils/permissions.js'
defineProps({ noEncontrada: Boolean })
</script>

<template>
  <section class="angosto">
    <h1>{{ noEncontrada ? 'Página no encontrada' : 'No tenés acceso a esta página' }}</h1>
    <p v-if="!noEncontrada">Tu rol actual es <strong>{{ ROL_NOMBRE[sesion.rol.value] }}</strong> y esta sección es de otro rol.
      <span v-if="sesion.state.modo === 'demo'">Cambiá el rol simulado con el selector del encabezado.</span></p>
    <p v-else>La dirección no existe.</p>
    <RouterLink class="btn btn-primario" to="/">Volver al inicio</RouterLink>
  </section>
</template>
