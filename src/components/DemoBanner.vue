<script setup>
import { sesion } from '../stores/session.js'
import { ROL_NOMBRE } from '../utils/permissions.js'
</script>

<template>
  <div v-if="sesion.state.modo === 'demo'" class="banner-demo" role="note">
    <div class="contenedor">
      <strong>Modo demostración.</strong>
      Los datos son de prueba y se guardan solo en este navegador. Los roles están <strong>simulados</strong>:
      ahora estás como <em>{{ ROL_NOMBRE[sesion.rol.value] }}</em>. Cambiá de rol con el selector de arriba.
    </div>
  </div>
</template>
