<script setup>
// Texto de un post o comentario: las líneas que empiezan con ">" se muestran como greentext.
import { computed } from 'vue'
const props = defineProps({ texto: { type: String, default: '' }, recortar: Number })
const lineas = computed(() => {
  const t = props.recortar && props.texto.length > props.recortar ? props.texto.slice(0, props.recortar) + '…' : props.texto
  return t.split('\n')
})
</script>

<template>
  <p class="cuerpo"><template v-for="(l, i) in lineas" :key="i"><span v-if="l.trimStart().startsWith('>')" class="greentext">{{ l }}</span><template v-else>{{ l }}</template><br v-if="i < lineas.length - 1" /></template></p>
</template>
