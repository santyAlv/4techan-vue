import { ref, onMounted } from 'vue'
import { toast } from './stores/toast.js'
import { explainError } from './utils/errors.js'

// Carga de datos con estados de carga y error: { datos, cargando, error, recargar }
export function useCarga(fn, { inmediato = true } = {}) {
  const datos = ref(null)
  const cargando = ref(false)
  const error = ref('')
  async function recargar() {
    cargando.value = true
    error.value = ''
    try {
      datos.value = await fn()
    } catch (e) {
      error.value = explainError(e)
    } finally {
      cargando.value = false
    }
  }
  if (inmediato) onMounted(recargar)
  return { datos, cargando, error, recargar }
}

// Ejecuta una operación mostrando "cargando", confirmación en éxito y mensaje de error si falla.
export function useAccion() {
  const cargando = ref(false)
  async function ejecutar(fn, { ok } = {}) {
    cargando.value = true
    try {
      const r = await fn()
      if (ok) toast.success(ok)
      return { ok: true, valor: r }
    } catch (e) {
      toast.error(explainError(e))
      return { ok: false, error: e }
    } finally {
      cargando.value = false
    }
  }
  return { cargando, ejecutar }
}
