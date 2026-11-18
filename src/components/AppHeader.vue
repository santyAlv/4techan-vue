<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { sesion } from '../stores/session.js'
import { can, ROLES, ROL_NOMBRE } from '../utils/permissions.js'
import { confirmar } from '../stores/confirm.js'
import { toast } from '../stores/toast.js'
import { explainError } from '../utils/errors.js'
import { api } from '../services/index.js'
import { useCarga } from '../composables.js'

const tablones = useCarga(() => api.listBoards())

const router = useRouter()
const abierto = ref(false)
const rol = sesion.rol
const demo = computed(() => sesion.state.modo === 'demo')

const enlaces = computed(() =>
  [
    { to: '/', texto: 'Tablones', permiso: 'foro:leer' },
    { to: '/nueva', texto: 'Publicar', permiso: 'post:crear' },
    { to: '/mi-actividad', texto: 'Mi actividad', permiso: 'mi-actividad' },
    { to: '/moderacion', texto: 'Moderación', permiso: 'moderacion:ver' },
    { to: '/estadisticas', texto: 'Estadísticas', permiso: 'estadisticas:ver' },
    { to: '/usuarios', texto: 'Cuentas', permiso: 'usuarios:administrar' }
  ].filter((l) => can(rol.value, l.permiso))
)

async function cambiarRol(e) {
  try {
    await sesion.simularRol(e.target.value)
    toast.info(`Ahora usás la app como: ${ROL_NOMBRE[e.target.value]} (rol simulado).`)
    router.replace('/')
  } catch (err) {
    toast.error(explainError(err))
  }
}
async function salir() {
  if (!(await confirmar({ titulo: '¿Cerrar sesión?', confirmar: 'Cerrar sesión' }))) return
  try {
    await sesion.salir()
    toast.success('Cerraste la sesión.')
    router.replace('/')
  } catch (err) {
    toast.error(explainError(err))
  }
}
</script>

<template>
  <header class="cabecera">
    <nav class="lista-tablones contenedor" aria-label="Tablones">
      [ <template v-for="(b, i) in tablones.datos.value" :key="b.id"><RouterLink :to="`/t/${b.slug}`" :title="b.descripcion">{{ b.slug }}</RouterLink><template v-if="i < tablones.datos.value.length - 1"> / </template></template> ]
    </nav>
    <div class="contenedor barra">
      <RouterLink to="/" class="marca" @click="abierto = false">4TEC<span>han</span></RouterLink>
      <button class="btn menu-btn" type="button" :aria-expanded="abierto" aria-controls="nav-principal" @click="abierto = !abierto">
        {{ abierto ? 'Cerrar' : 'Menú' }}
      </button>
      <nav id="nav-principal" class="nav" :class="{ abierto }" aria-label="Principal" @click="abierto = false">
        <RouterLink v-for="l in enlaces" :key="l.to" :to="l.to">{{ l.texto }}</RouterLink>
      </nav>
      <div class="usuario" :class="{ abierto }">
        <label v-if="demo" class="selector-rol">
          <span>Rol simulado</span>
          <select :value="rol" @change="cambiarRol">
            <option v-for="r in ROLES" :key="r" :value="r">{{ ROL_NOMBRE[r] }}</option>
          </select>
        </label>
        <template v-else>
          <template v-if="sesion.logueado.value">
            <span class="alias">{{ sesion.state.perfil.alias }} · {{ ROL_NOMBRE[rol] }}</span>
            <button class="btn" type="button" @click="salir">Salir</button>
          </template>
          <template v-else>
            <RouterLink class="btn" to="/ingresar">Ingresar</RouterLink>
            <RouterLink class="btn btn-primario" to="/registro">Crear cuenta</RouterLink>
          </template>
        </template>
      </div>
    </div>
  </header>
</template>
