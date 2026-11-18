// Traduce errores técnicos (Supabase/Postgres/red) a mensajes claros para la persona.
export function explainError(e) {
  const msg = e?.message || ''
  const code = e?.code || ''
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo.'
  if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.'
  if (/already registered|already been registered/i.test(msg)) return 'Ya existe una cuenta con ese correo.'
  if (/Email not confirmed/i.test(msg)) return 'Falta confirmar tu correo. Revisá tu bandeja de entrada.'
  if (/rate limit/i.test(msg)) return 'Demasiados intentos. Esperá un momento y probá de nuevo.'
  if (/row-level security|permission denied/i.test(msg)) return 'No tenés permiso para hacer esto (o tu cuenta está suspendida).'
  if (code === '23505') return 'Ese registro ya existe.'
  if (code === '23514') return 'Algún valor no está permitido. Revisá los campos.'
  if (['P0001', 'P0002', '22023', '42501', 'DEMO'].includes(code) && msg) return msg
  if (e?.userMessage) return e.userMessage
  return 'Ocurrió un error inesperado. Probá de nuevo en unos minutos.'
}
export const demoError = (message) => Object.assign(new Error(message), { code: 'DEMO' })
