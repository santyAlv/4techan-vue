import { reactive } from 'vue'

export const toasts = reactive([])
let seq = 0
function push(tipo, texto, ms) {
  const id = ++seq
  toasts.push({ id, tipo, texto })
  setTimeout(() => dismiss(id), ms)
}
export const dismiss = (id) => {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}
export const toast = {
  success: (t) => push('ok', t, 4000),
  error: (t) => push('error', t, 7000),
  info: (t) => push('info', t, 4000)
}
