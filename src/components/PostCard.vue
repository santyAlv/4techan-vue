<script setup>
import { hace, fmtFecha } from '../utils/format.js'
import TestBadge from './TestBadge.vue'
import Cuerpo from './Cuerpo.vue'
defineProps({ post: Object, mostrarTablon: { type: Boolean, default: true } })
const ESTADOS = { autor: 'Cancelada por su autor', moderacion: 'Eliminada por la Comisión' }
</script>

<template>
  <article class="post" :class="{ 'post-borrado': post.estado === 'borrado' }">
    <header class="post-cab">
      <RouterLink v-if="mostrarTablon" :to="`/t/${post.board.slug}`" class="tablon-tag">{{ post.board.nombre }}</RouterLink>
      <RouterLink :to="`/p/${post.id}`" class="asunto">{{ post.titulo }}</RouterLink>
      <span class="nombre">{{ post.autor_alias }}</span>
      <time :datetime="post.created_at" :title="fmtFecha(post.created_at)" class="fecha">{{ hace(post.created_at) }}</time>
      <RouterLink :to="`/p/${post.id}`" class="numero">No.{{ post.id }}</RouterLink>
      <span v-if="post.estado === 'borrado'" class="insignia insignia-borrado">{{ ESTADOS[post.borrado_por] }}</span>
      <TestBadge :item="post" />
    </header>
    <Cuerpo :texto="post.cuerpo" :recortar="200" />
    <footer class="post-pie">
      <RouterLink :to="`/p/${post.id}`">{{ post.comentarios }} {{ post.comentarios === 1 ? 'respuesta' : 'respuestas' }}</RouterLink>
    </footer>
  </article>
</template>
