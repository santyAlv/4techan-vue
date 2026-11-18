import { reactive, computed } from 'vue'
import { api, modo } from '../services/index.js'
import { getDemoRole, setDemoRole, resetDemo } from '../services/mockApi.js'

const state = reactive({ listo: false, usuario: null, perfil: null, modo })

async function cargar() {
  state.usuario = await api.getSession()
  state.perfil = state.usuario ? await api.getMyProfile() : null
}

let iniciando
export function iniciarSesion() {
  iniciando ??= (async () => {
    try {
      await cargar()
    } catch {
      state.usuario = null
      state.perfil = null
    } finally {
      state.listo = true
    }
    api.onAuthChange(async () => {
      try { await cargar() } catch { /* se mantiene el estado anterior */ }
    })
  })()
  return iniciando
}

export const sesion = {
  state,
  rol: computed(() => state.perfil?.rol ?? 'invitado'),
  logueado: computed(() => Boolean(state.perfil)),
  suspendidoHasta: computed(() => {
    const h = state.perfil?.ban_hasta
    return h && new Date(h) > new Date() ? h : null
  }),
  async ingresar(datos) {
    await api.signIn(datos)
    await cargar()
  },
  async registrar(datos) {
    const r = await api.signUp(datos)
    if (!r.needsConfirmation) await cargar()
    return r
  },
  async salir() {
    await api.signOut()
    await cargar()
  },
  // Solo modo demostración: cambia el rol SIMULADO.
  async simularRol(rol) {
    setDemoRole(rol)
    await cargar()
  },
  async reiniciarDemo() {
    resetDemo()
    setDemoRole('invitado')
    await cargar()
  },
  refrescar: cargar
}
export { getDemoRole }
