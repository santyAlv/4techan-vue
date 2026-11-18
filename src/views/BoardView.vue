<script setup>
import { ref, watch, computed } from 'vue'
import { api } from '../services/index.js'
import { sesion } from '../stores/session.js'
import { can } from '../utils/permissions.js'
import { useCarga } from '../composables.js'
import StateBlock from '../components/StateBlock.vue'
import PostCard from '../components/PostCard.vue'
import Paginador from '../components/Paginador.vue'

const props = defineProps({ slug: String })
const POR_PAGINA = 8
const q = ref('')
const orden = ref('recientes')
const pagina = ref(1)

const tablones = useCarga(() => api.listBoards())
const tablon = computed(() => tablones.datos.value?.find((b) => b.slug === props.slug))
const lista = useCarga(() => api.listPosts({ board_slug: props.slug, q: q.value, orden: orden.value, page: pagina.value, pageSize: POR_PAGINA }))

let timer
watch(q, () => { clearTimeout(timer); timer = setTimeout(() => { pagina.value = 1; lista.recargar() }, 300) })
watch([orden], () => { pagina.value = 1; lista.recargar() })
watch(() => props.slug, () => { q.value = ''; pagina.value = 1; lista.recargar() })
const irA = (p) => { pagina.value = p; lista.recargar() }
</script>

<template>
  <section>
    <p class="migas"><RouterLink to="/">Tablones</RouterLink> › {{ tablon?.nombre ?? slug }}</p>
    <div class="cabeza-tablon">
      <h1>{{ tablon?.nombre ?? `/${slug}/` }}</h1>
      <p v-if="tablon" class="lead">{{ tablon.descripcion }}</p>
      <p v-if="can(sesion.rol.value, 'post:crear')">[<RouterLink to="/nueva">Iniciar un hilo</RouterLink>]</p>
    </div>
    <hr />

    <form class="filtros" role="search" @submit.prevent>
      <label>Buscar
        <input v-model="q" type="search" placeholder="Palabras del título o del mensaje" maxlength="80" />
      </label>
      <label>Ordenar
        <select v-model="orden">
          <option value="recientes">Más recientes primero</option>
          <option value="antiguas">Más antiguas primero</option>
        </select>
      </label>
    </form>

    <StateBlock :cargando="lista.cargando.value" :error="lista.error.value"
      :vacio="lista.datos.value?.data.length === 0" :texto-vacio="q ? 'No se encontraron publicaciones con esa búsqueda.' : 'Todavía no hay publicaciones en este tablón.'"
      @reintentar="lista.recargar">
      <p class="meta" aria-live="polite">{{ lista.datos.value?.count }} resultado(s)</p>
      <div class="lista">
        <PostCard v-for="p in lista.datos.value?.data" :key="p.id" :post="p" :mostrar-tablon="false" />
      </div>
      <Paginador :pagina="pagina" :total="lista.datos.value?.count ?? 0" :por-pagina="POR_PAGINA" @cambiar="irA" />
    </StateBlock>
  </section>
</template>
