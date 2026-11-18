<script setup>
defineProps({ item: Object })
</script>
<template>
  <span v-if="item?.es_simulado" class="insignia insignia-prueba" title="Dato de prueba, no corresponde a una persona ni a un hecho real">Dato de prueba</span>
</template>
