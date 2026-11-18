<script setup>
import AppHeader from './components/AppHeader.vue'
import DemoBanner from './components/DemoBanner.vue'
import ToastHost from './components/ToastHost.vue'
import ConfirmHost from './components/ConfirmHost.vue'
</script>

<template>
  <a class="saltar" href="#contenido">Saltar al contenido</a>
  <AppHeader />
  <DemoBanner />
  <main id="contenido" class="contenedor">
    <RouterView />
  </main>
  <footer class="pie contenedor">
    <p>4TEChan · foro anónimo de la comunidad de la E.E.S.T. N°1 · Primera versión.
      <RouterLink to="/acerca">Qué incluye y qué está simulado</RouterLink></p>
  </footer>
  <ToastHost />
  <ConfirmHost />
</template>
