<script setup>
import { reactive, watch } from 'vue'
import { api } from '../services/index.js'
import { RESULTADOS, MOTIVOS, APELACION_ESTADOS } from '../utils/validators.js'
import { fmtFecha } from '../utils/format.js'
import { useCarga } from '../composables.js'
import StateBlock from '../components/StateBlock.vue'
import TestBadge from '../components/TestBadge.vue'

const f = reactive({ q: '', resultado: '', apelacion: '' })
const lista = useCarga(() => api.listHistory({ ...f }))
let t
watch(f, () => { clearTimeout(t); t = setTimeout(lista.recargar, 250) })
</script>

<template>
  <p class="migas"><RouterLink to="/moderacion">Moderación</RouterLink> › Historial</p>
  <h1>Historial de moderación</h1>
  <p class="lead">Registro de todas las resoluciones. No se borra: sirve para medir cuántas se apelan o se revierten.</p>

  <form class="filtros" role="search" @submit.prevent>
    <label>Buscar <input v-model="f.q" type="search" placeholder="Título, alias o nota" maxlength="80" /></label>
    <label>Resolución
      <select v-model="f.resultado">
        <option value="">Todas</option>
        <option v-for="(txt, k) in RESULTADOS" :key="k" :value="k">{{ txt }}</option>
      </select>
    </label>
    <label>Apelación
      <select v-model="f.apelacion">
        <option value="">Todas</option>
        <option v-for="(txt, k) in APELACION_ESTADOS" :key="k" :value="k">{{ txt }}</option>
      </select>
    </label>
  </form>

  <StateBlock :cargando="lista.cargando.value" :error="lista.error.value" :vacio="lista.datos.value?.length === 0"
    texto-vacio="No hay resoluciones con esos filtros." @reintentar="lista.recargar">
    <p class="meta" aria-live="polite">{{ lista.datos.value?.length }} resolución(es)</p>
    <ul class="lista sin-vineta">
      <li v-for="r in lista.datos.value" :key="r.id" class="tarjeta">
        <header class="tarjeta-cab">
          <span class="insignia">{{ RESULTADOS[r.resultado] }}</span>
          <span class="insignia" :class="`ap-${r.appeal?.estado ?? 'sin_apelar'}`">{{ APELACION_ESTADOS[r.appeal?.estado ?? 'sin_apelar'] }}</span>
          <TestBadge :item="r" />
        </header>
        <h3><RouterLink :to="`/p/${r.report.post.id}`">{{ r.report.post.titulo }}</RouterLink></h3>
        <p class="meta">Autor: {{ r.report.post.autor_alias }} · Motivo: {{ MOTIVOS[r.report.motivo] }} · Resuelta por {{ r.moderator?.alias }} el {{ fmtFecha(r.created_at) }}</p>
        <p v-if="r.nota" class="meta">Nota: {{ r.nota }}</p>
        <p v-if="r.appeal" class="meta">Apelación: «{{ r.appeal.texto }}»</p>
      </li>
    </ul>
  </StateBlock>
</template>
