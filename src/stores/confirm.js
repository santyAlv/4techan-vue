import { reactive } from 'vue'

// Diálogo de confirmación global: const ok = await confirmar({ titulo, mensaje, confirmar, peligro })
export const dialogo = reactive({ abierto: false, titulo: '', mensaje: '', confirmar: 'Confirmar', peligro: false })
let resolver

export function confirmar({ titulo, mensaje = '', confirmar = 'Confirmar', peligro = false }) {
  Object.assign(dialogo, { abierto: true, titulo, mensaje, confirmar, peligro })
  return new Promise((res) => (resolver = res))
}
export function responder(valor) {
  dialogo.abierto = false
  resolver?.(valor)
}
