// Roles de 4TEChan y qué puede hacer cada uno. La interfaz usa esto para mostrar u ocultar
// opciones; el permiso real lo aplican las políticas RLS y las funciones de la base (db/).
export const ROLES = ['invitado', 'estudiante', 'moderador', 'admin']
export const ROL_NOMBRE = {
  invitado: 'Invitado (sin sesión)',
  estudiante: 'Estudiante',
  moderador: 'Comisión de Normas y Convivencia',
  admin: 'Administrador'
}

const LOGUEADOS = ['estudiante', 'moderador', 'admin']
const PERMISOS = {
  'foro:leer': ROLES,
  'post:crear': LOGUEADOS,
  'comentario:crear': LOGUEADOS,
  'reporte:crear': LOGUEADOS,
  'mi-actividad': LOGUEADOS,
  'moderacion:ver': ['moderador', 'admin'],
  'estadisticas:ver': ['moderador', 'admin'],
  'usuarios:administrar': ['admin']
}
export const can = (rol, permiso) => (PERMISOS[permiso] || []).includes(rol)
