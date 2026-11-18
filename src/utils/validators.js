// Validaciones de formularios: campos obligatorios, formatos y valores permitidos.
// Cada regla devuelve '' si está bien o el mensaje de error. Los límites replican los CHECK de la base.

export const LIMITES = {
  alias: { min: 3, max: 20 },
  password: { min: 8, max: 72 },
  titulo: { min: 5, max: 120 },
  cuerpo: { min: 5, max: 4000 },
  comentario: { min: 2, max: 1000 },
  detalle: { max: 500 },
  nota: { max: 500 },
  apelacion: { min: 10, max: 500 }
}

export const ESPECIALIDADES = ['Programación', 'Electrónica', 'Electromecánica']
export const MOTIVOS = {
  spam: 'Spam',
  acoso: 'Acoso o burlas',
  contenido_inapropiado: 'Contenido inapropiado',
  compraventa_prohibida: 'Compraventa no permitida',
  otro: 'Otro motivo'
}
export const RESULTADOS = {
  descartado: 'Reporte descartado',
  post_borrado: 'Publicación borrada',
  borrado_ban_3d: 'Borrada con suspensión de 3 días',
  derivado_asesor: 'Derivado al docente asesor'
}
export const APELACION_ESTADOS = { sin_apelar: 'Sin apelar', pendiente: 'Apelación pendiente', mantenida: 'Se mantuvo', revertida: 'Se revirtió' }

const txt = (v) => (v ?? '').toString().trim()

export const required = (msg = 'Este campo es obligatorio.') => (v) => (txt(v) ? '' : msg)
export const minLen = (n) => (v) => (txt(v).length < n ? `Escribí al menos ${n} caracteres.` : '')
export const maxLen = (n) => (v) => (txt(v).length > n ? `No puede superar los ${n} caracteres.` : '')
export const pattern = (re, msg) => (v) => (!txt(v) || re.test(txt(v)) ? '' : msg)
export const email = () => (v) =>
  !txt(v) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(txt(v)) ? '' : 'Escribí un correo válido, por ejemplo nombre@dominio.com.'
export const oneOf = (list, msg = 'Elegí una opción de la lista.') => (v) =>
  !txt(v) || list.map(String).includes(txt(v)) ? '' : msg
export const intRange = (min, max, msg) => (v) => {
  if (!txt(v)) return ''
  const n = Number(v)
  return Number.isInteger(n) && n >= min && n <= max ? '' : msg || `Ingresá un número entero entre ${min} y ${max}.`
}

// Ejecuta las reglas de cada campo en orden y se queda con el primer error.
export function validate(values, schema) {
  const errors = {}
  for (const [field, rules] of Object.entries(schema)) {
    for (const rule of rules) {
      const msg = rule(values[field], values)
      if (msg) {
        errors[field] = msg
        break
      }
    }
  }
  return errors
}
export const hasErrors = (errors) => Object.keys(errors).length > 0


export const loginSchema = {
  email: [required('Ingresá tu correo.'), email()],
  password: [required('Ingresá tu contraseña.')]
}

export const registerSchema = {
  email: [required('Ingresá tu correo.'), email()],
  alias: [
    required('Elegí un alias.'),
    minLen(LIMITES.alias.min),
    maxLen(LIMITES.alias.max),
    pattern(/^[A-Za-z0-9_]+$/, 'Solo letras sin tilde, números y guion bajo.')
  ],
  password: [
    required('Elegí una contraseña.'),
    minLen(LIMITES.password.min),
    maxLen(LIMITES.password.max),
    pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Tiene que incluir al menos una letra y un número.')
  ],
  password2: [required('Repetí la contraseña.'), (v, all) => (v !== all.password ? 'Las contraseñas no coinciden.' : '')],
  anio: [required('Elegí el año que cursás.'), intRange(1, 7, 'El año tiene que ser de 1° a 7°.')],
  especialidad: [
    (v, all) => (Number(all.anio) >= 4 && !txt(v) ? 'Elegí tu especialidad (de 4° a 7° es obligatoria).' : ''),
    (v, all) => (Number(all.anio) >= 4 ? oneOf(ESPECIALIDADES)(v) : '')
  ]
}

export const postSchema = {
  board_id: [required('Elegí un tablón.')],
  titulo: [required('Escribí un título.'), minLen(LIMITES.titulo.min), maxLen(LIMITES.titulo.max)],
  cuerpo: [required('Escribí el mensaje.'), minLen(LIMITES.cuerpo.min), maxLen(LIMITES.cuerpo.max)]
}
export const commentSchema = {
  cuerpo: [required('Escribí un comentario.'), minLen(LIMITES.comentario.min), maxLen(LIMITES.comentario.max)]
}
export const reportSchema = {
  motivo: [required('Elegí un motivo.'), oneOf(Object.keys(MOTIVOS))],
  detalle: [
    (v, all) => (all.motivo === 'otro' && txt(v).length < 10 ? 'Si el motivo es «Otro», explicalo en al menos 10 caracteres.' : ''),
    maxLen(LIMITES.detalle.max)
  ]
}
export const resolutionSchema = {
  resultado: [required('Elegí qué resolvés.'), oneOf(Object.keys(RESULTADOS))],
  nota: [
    (v, all) => (all.resultado === 'borrado_ban_3d' && !txt(v) ? 'Con suspensión hay que dejar una nota con el motivo.' : ''),
    maxLen(LIMITES.nota.max)
  ]
}
export const appealSchema = {
  texto: [required('Explicá por qué apelás.'), minLen(LIMITES.apelacion.min), maxLen(LIMITES.apelacion.max)]
}
