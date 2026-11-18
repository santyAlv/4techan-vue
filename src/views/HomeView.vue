<script setup>
import { api } from '../services/index.js'
import { useCarga } from '../composables.js'
import StateBlock from '../components/StateBlock.vue'
import PostCard from '../components/PostCard.vue'

const tablones = useCarga(() => api.listBoards())
const ultimas = useCarga(() => api.listPosts({ pageSize: 6 }))
</script>

<template>
  <section class="cabeza-tablon">
    <h1>4TEChan</h1>
    <p class="lead">Apuntes, avisos y materiales de la escuela en un solo lugar, en vez de perderlos entre grupos de WhatsApp e Instagram. Es anónimo: solo se ve el alias.</p>
  </section>
  <hr />

  <section aria-labelledby="h-tablones">
    <h2 id="h-tablones">Tablones</h2>
    <StateBlock :cargando="tablones.cargando.value" :error="tablones.error.value" @reintentar="tablones.recargar">
      <div class="grilla">
        <RouterLink v-for="b in tablones.datos.value" :key="b.id" :to="`/t/${b.slug}`" class="tarjeta tarjeta-enlace">
          <h3>{{ b.nombre }}</h3>
          <p>{{ b.descripcion }}</p>
          <span class="meta">{{ b.total }} {{ b.total === 1 ? 'publicación' : 'publicaciones' }}</span>
        </RouterLink>
      </div>
    </StateBlock>
  </section>

  <section aria-labelledby="h-ultimas">
    <h2 id="h-ultimas">Últimas publicaciones</h2>
    <StateBlock :cargando="ultimas.cargando.value" :error="ultimas.error.value" :vacio="ultimas.datos.value?.data.length === 0" @reintentar="ultimas.recargar">
      <div class="lista">
        <PostCard v-for="p in ultimas.datos.value?.data" :key="p.id" :post="p" />
      </div>
    </StateBlock>
  </section>
</template>
