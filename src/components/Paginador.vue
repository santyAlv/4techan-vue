<script setup>
import { computed } from 'vue'
const props = defineProps({ pagina: Number, total: Number, porPagina: { type: Number, default: 10 } })
defineEmits(['cambiar'])
const paginas = computed(() => Math.max(1, Math.ceil(props.total / props.porPagina)))
</script>

<template>
  <nav v-if="paginas > 1" class="paginador" aria-label="Paginación">
    <button class="btn" type="button" :disabled="pagina <= 1" @click="$emit('cambiar', pagina - 1)">← Anterior</button>
    <span>Página {{ pagina }} de {{ paginas }}</span>
    <button class="btn" type="button" :disabled="pagina >= paginas" @click="$emit('cambiar', pagina + 1)">Siguiente →</button>
  </nav>
</template>
