<script setup>
import { ref, watch } from 'vue'
import { api } from '../services/index.js'
import { sesion } from '../stores/session.js'
import { confirmar } from '../stores/confirm.js'
import { ROLES, ROL_NOMBRE } from '../utils/permissions.js'
import { fmtFecha } from '../utils/format.js'
import { useCarga, useAccion } from '../composables.js'
import StateBlock from '../components/StateBlock.vue'
import TestBadge from '../components/TestBadge.vue'

const q = ref('')
const lista = useCarga(() => api.listUsers({ q: q.value }))
const accion = useAccion()
let t
watch(q, () => { clearTimeout(t); t = setTimeout(lista.recargar, 250) })
const ROLES_ASIGNABLES = ROLES.filter((r) => r !== 'invitado')

async function cambiar(u, rol) {
  const ok = await confirmar({
    titulo: `¿Cambiar el rol de ${u.alias}?`,
    mensaje: `Pasa de «${ROL_NOMBRE[u.rol]}» a «${ROL_NOMBRE[rol]}».${u.id === sesion.state.perfil?.id ? ' Es tu propia cuenta: podrías perder acceso a esta pantalla.' : ''}`,
    confirmar: 'Cambiar rol', peligro: rol === 'admin'
  })
  if (!ok) return lista.recargar()
  const r = await accion.ejecutar(() => api.setUserRole(u.id, rol), { ok: 'Rol actualizado.' })
  lista.recargar()
  if (r.ok && u.id === sesion.state.perfil?.id) sesion.refrescar()
}
</script>

<template>
  <h1>Cuentas y roles</h1>
  <p class="lead">Solo el administrador cambia roles. El permiso se aplica en la base de datos, no solo en esta pantalla.</p>
  <form class="filtros" role="search" @submit.prevent>
    <label>Buscar por alias <input v-model="q" type="search" maxlength="20" /></label>
  </form>
  <StateBlock :cargando="lista.cargando.value" :error="lista.error.value" :vacio="lista.datos.value?.length === 0" texto-vacio="No hay cuentas con ese alias." @reintentar="lista.recargar">
    <ul class="lista sin-vineta">
      <li v-for="u in lista.datos.value" :key="u.id" class="tarjeta fila">
        <div>
          <strong>{{ u.alias }}</strong> <TestBadge :item="u" />
          <p class="meta">{{ u.anio }}° año{{ u.especialidad ? ' · ' + u.especialidad : '' }} · alta {{ fmtFecha(u.created_at) }}
            <span v-if="u.ban_hasta && new Date(u.ban_hasta) > new Date()" class="insignia insignia-borrado">Suspendida hasta {{ fmtFecha(u.ban_hasta) }}</span></p>
        </div>
        <label class="rol-sel">Rol
          <select :value="u.rol" :disabled="accion.cargando.value" @change="cambiar(u, $event.target.value)">
            <option v-for="r in ROLES_ASIGNABLES" :key="r" :value="r">{{ ROL_NOMBRE[r] }}</option>
          </select>
        </label>
      </li>
    </ul>
  </StateBlock>
</template>
