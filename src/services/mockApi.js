// Modo demostración: la misma interfaz que supabaseApi, pero sobre los datos de prueba de
// src/data/seed.json guardados en localStorage (solo en este navegador). Los roles están SIMULADOS:
// se eligen con el selector del encabezado, no hay cuentas ni contraseñas.
import seed from '../data/seed.json'
import { demoError } from '../utils/errors.js'
import { LIMITES } from '../utils/validators.js'

const KEY = '4techan-demo-v1'
const ROL_KEY = '4techan-demo-rol'
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
export const DEMO_USERS = { estudiante: uid(13), moderador: uid(20), admin: uid(25) }

const BOARDS = [
  { id: 1, slug: 'prog', nombre: '/prog/', descripcion: 'Programación: apuntes, dudas, proyectos y herramientas.' },
  { id: 2, slug: 'taller', nombre: '/taller/', descripcion: 'Taller: avisos, materiales, herramientas y guías.' },
  { id: 3, slug: 'compraventa', nombre: '/compraventa/', descripcion: 'Compra y venta de útiles, libros y componentes entre estudiantes.' },
  { id: 4, slug: 'eventos', nombre: '/eventos/', descripcion: 'Eventos, muestras, torneos y charlas de la escuela.' },
  { id: 5, slug: 'consultas', nombre: '/consultas/', descripcion: 'Consultas generales sobre la escuela, materias y trámites.' }
]
const boardOf = (slug) => BOARDS.find((b) => b.slug === slug)

const iso = (h) => new Date(Date.now() - h * 3600e3).toISOString()
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms))
const nowIso = () => new Date().toISOString()

function build() {
  const s = structuredClone(seed)
  return {
    profiles: s.profiles.map((p) => ({
      id: p.id, alias: p.alias, anio: p.anio, especialidad: p.especialidad, rol: p.rol, es_simulado: true,
      created_at: iso(p.created_h),
      ban_hasta: s.ban_in_h[p.id] ? new Date(Date.now() + s.ban_in_h[p.id] * 3600e3).toISOString() : null
    })),
    posts: s.posts.map((p) => ({
      id: p.id, board_id: boardOf(p.board).id, author_id: p.author_id, autor_alias: p.autor_alias, titulo: p.titulo, cuerpo: p.cuerpo,
      estado: p.estado, borrado_por: p.borrado_por, es_simulado: true, created_at: iso(p.created_h), updated_at: iso(p.created_h)
    })),
    comments: s.comments.map((c) => ({ ...c, es_simulado: true, created_at: iso(c.created_h) })),
    reports: s.reports.map((r) => ({ ...r, es_simulado: true, created_at: iso(r.created_h) })),
    resolutions: s.resolutions.map((r) => ({ ...r, es_simulado: true, created_at: iso(r.created_h) })),
    appeals: s.appeals.map((a) => ({
      ...a, es_simulado: true, created_at: iso(a.created_h), resolved_at: a.resolved_h != null ? iso(a.resolved_h) : null
    }))
  }
}

let db
function load() {
  if (db) return db
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return (db = JSON.parse(raw))
  } catch { /* sin almacenamiento: se trabaja en memoria */ }
  db = build()
  save()
  return db
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* memoria */ }
}
const nextId = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1

export const getDemoRole = () => {
  try { return localStorage.getItem(ROL_KEY) || 'invitado' } catch { return 'invitado' }
}
export function setDemoRole(rol) {
  try { localStorage.setItem(ROL_KEY, rol) } catch { /* memoria */ }
}
export function resetDemo() {
  db = build()
  save()
}

const meId = () => DEMO_USERS[getDemoRole()] || null
const me = () => load().profiles.find((p) => p.id === meId()) || null
const isMod = () => ['moderador', 'admin'].includes(me()?.rol)
const needLogin = () => {
  if (!me()) throw demoError('Tenés que elegir un rol (estudiante, moderador o administrador) para hacer esto.')
  return me()
}
const needMod = () => {
  if (!isMod()) throw demoError('Solo la Comisión de Normas y Convivencia puede hacer esto.')
}
const banned = () => {
  const p = needLogin()
  if (p.ban_hasta && new Date(p.ban_hasta) > new Date())
    throw demoError(`Tu cuenta está suspendida hasta el ${new Date(p.ban_hasta).toLocaleString('es-AR')}.`)
}
const visible = (p) => p.estado === 'publicado' || p.author_id === meId() || isMod()
const postView = (p) => ({
  ...p, board: BOARDS.find((b) => b.id === p.board_id),
  comentarios: load().comments.filter((c) => c.post_id === p.id && c.estado === 'publicado').length
})
const postRef = (id) => {
  const p = load().posts.find((x) => x.id === id)
  return { id: p.id, titulo: p.titulo, autor_alias: p.autor_alias, estado: p.estado }
}
const aliasOf = (id) => ({ alias: load().profiles.find((p) => p.id === id)?.alias })
const check = (v, L, nombre) => {
  const n = (v ?? '').trim().length
  if (n < (L.min ?? 0) || n > L.max) throw demoError(`${nombre}: debe tener entre ${L.min ?? 0} y ${L.max} caracteres.`)
}

export const mockApi = {
  // ----- "sesión" simulada -----
  async getSession() {
    const p = me()
    return p ? { id: p.id, email: `${p.alias}@demo.local` } : null
  },
  onAuthChange() { return () => {} },
  async signIn() { throw demoError('En modo demostración no hay cuentas: elegí un rol en el selector del encabezado.') },
  async signUp() { throw demoError('En modo demostración no hay registro: elegí un rol en el selector del encabezado.') },
  async signOut() { setDemoRole('invitado') },
  async getMyProfile() { await wait(60); return me() },
  async aliasDisponible(alias) { return !load().profiles.some((p) => p.alias.toLowerCase() === alias.toLowerCase()) },

  // ----- foro -----
  async listBoards() {
    await wait()
    return BOARDS.map((b) => ({ ...b, total: load().posts.filter((p) => p.board_id === b.id && p.estado === 'publicado').length }))
  },
  async listPosts({ board_slug, q, estado, orden = 'recientes', autor_id, page = 1, pageSize = 10 } = {}) {
    await wait()
    const t = q?.trim().toLowerCase()
    let rows = load().posts.filter(visible)
    if (board_slug) rows = rows.filter((p) => p.board_id === boardOf(board_slug)?.id)
    if (estado) rows = rows.filter((p) => p.estado === estado)
    if (autor_id) rows = rows.filter((p) => p.author_id === autor_id)
    if (t) rows = rows.filter((p) => `${p.titulo} ${p.cuerpo}`.toLowerCase().includes(t))
    rows.sort((a, b) => (orden === 'antiguas' ? 1 : -1) * (new Date(a.created_at) - new Date(b.created_at)))
    return { data: rows.slice((page - 1) * pageSize, page * pageSize).map(postView), count: rows.length }
  },
  async getPost(id) {
    await wait()
    const p = load().posts.find((x) => x.id === Number(id))
    if (!p || !visible(p)) return null
    const comments = load().comments.filter((c) => c.post_id === p.id && (c.estado === 'publicado' || c.author_id === meId() || isMod()))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    return { ...postView(p), comments }
  },
  async createPost({ board_id, titulo, cuerpo }) {
    await wait()
    banned()
    check(titulo, LIMITES.titulo, 'Título')
    check(cuerpo, LIMITES.cuerpo, 'Mensaje')
    const d = load()
    const p = needLogin()
    const post = {
      id: nextId(d.posts), board_id: Number(board_id), author_id: p.id, autor_alias: p.alias, titulo: titulo.trim(), cuerpo: cuerpo.trim(),
      estado: 'publicado', borrado_por: null, es_simulado: false, created_at: nowIso(), updated_at: nowIso()
    }
    d.posts.push(post)
    save()
    return { id: post.id }
  },
  async updatePost(id, { titulo, cuerpo }) {
    await wait()
    check(titulo, LIMITES.titulo, 'Título')
    check(cuerpo, LIMITES.cuerpo, 'Mensaje')
    const p = load().posts.find((x) => x.id === Number(id))
    if (!p || p.author_id !== meId() || p.estado !== 'publicado') throw demoError('Solo podés modificar tus publicaciones activas.')
    Object.assign(p, { titulo: titulo.trim(), cuerpo: cuerpo.trim(), updated_at: nowIso() })
    save()
  },
  async cancelPost(id) {
    await wait()
    const p = load().posts.find((x) => x.id === Number(id))
    if (!p || p.author_id !== meId() || p.estado !== 'publicado') throw demoError('Solo podés cancelar tus publicaciones activas.')
    Object.assign(p, { estado: 'borrado', borrado_por: 'autor', updated_at: nowIso() })
    save()
  },
  async createComment({ post_id, cuerpo }) {
    await wait()
    banned()
    check(cuerpo, LIMITES.comentario, 'Comentario')
    const d = load()
    const post = d.posts.find((x) => x.id === Number(post_id))
    if (!post || post.estado !== 'publicado') throw demoError('La publicación ya no admite comentarios.')
    d.comments.push({ id: nextId(d.comments), post_id: post.id, author_id: me().id, autor_alias: me().alias, cuerpo: cuerpo.trim(), estado: 'publicado', es_simulado: false, created_at: nowIso() })
    save()
  },
  async cancelComment(id) {
    await wait()
    const c = load().comments.find((x) => x.id === id)
    if (!c || c.author_id !== meId()) throw demoError('Solo podés cancelar tus comentarios.')
    c.estado = 'borrado'
    save()
  },

  // ----- reportes y moderación -----
  async createReport({ post_id, motivo, detalle }) {
    await wait()
    banned()
    const d = load()
    const post = d.posts.find((x) => x.id === Number(post_id))
    if (!post || post.estado !== 'publicado') throw demoError('La publicación ya no está disponible.')
    if (post.author_id === me().id) throw demoError('No podés reportar tu propia publicación.')
    if (d.reports.some((r) => r.post_id === post.id && r.reporter_id === me().id)) throw demoError('Ya reportaste esta publicación.')
    if (motivo === 'otro' && (detalle ?? '').trim().length < 10) throw demoError('Si el motivo es «Otro», explicalo en al menos 10 caracteres.')
    d.reports.push({ id: nextId(d.reports), post_id: post.id, reporter_id: me().id, motivo, detalle: detalle?.trim() || null, estado: 'pendiente', es_simulado: false, created_at: nowIso() })
    save()
  },
  async listReports({ estado = 'pendiente' } = {}) {
    await wait()
    needMod()
    return load().reports.filter((r) => r.estado === estado).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((r) => ({ ...r, reporter: aliasOf(r.reporter_id), post: postRef(r.post_id) }))
  },
  async resolveReport(id, { resultado, nota }) {
    await wait()
    needMod()
    const d = load()
    const r = d.reports.find((x) => x.id === id)
    if (!r) throw demoError('El reporte no existe.')
    if (r.estado !== 'pendiente') throw demoError('El reporte ya fue resuelto.')
    d.resolutions.push({ id: nextId(d.resolutions), report_id: id, moderator_id: me().id, resultado, nota: nota?.trim() || null, es_simulado: false, created_at: nowIso() })
    r.estado = 'resuelto'
    const post = d.posts.find((p) => p.id === r.post_id)
    if (['post_borrado', 'borrado_ban_3d'].includes(resultado) && post.estado === 'publicado') Object.assign(post, { estado: 'borrado', borrado_por: 'moderacion' })
    if (resultado === 'borrado_ban_3d') d.profiles.find((p) => p.id === post.author_id).ban_hasta = new Date(Date.now() + 3 * 864e5).toISOString()
    save()
  },
  async listHistory({ resultado, apelacion, q } = {}) {
    await wait()
    needMod()
    const d = load()
    return d.resolutions
      .map((res) => {
        const rep = d.reports.find((r) => r.id === res.report_id)
        const ap = d.appeals.find((a) => a.resolution_id === res.id)
        return {
          ...res, moderator: aliasOf(res.moderator_id),
          report: { id: rep.id, motivo: rep.motivo, detalle: rep.detalle, post: postRef(rep.post_id) },
          appeal: ap ? { id: ap.id, estado: ap.estado, texto: ap.texto, created_at: ap.created_at, resolved_at: ap.resolved_at } : null
        }
      })
      .filter((r) => !resultado || r.resultado === resultado)
      .filter((r) => !apelacion || (apelacion === 'sin_apelar' ? !r.appeal : r.appeal?.estado === apelacion))
      .filter((r) => !q?.trim() || `${r.report.post.titulo} ${r.report.post.autor_alias} ${r.nota ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },
  async listAppeals({ estado = 'pendiente' } = {}) {
    await wait()
    needMod()
    const d = load()
    return d.appeals.filter((a) => a.estado === estado).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((a) => {
      const res = d.resolutions.find((r) => r.id === a.resolution_id)
      const rep = d.reports.find((r) => r.id === res.report_id)
      return { ...a, resolution: { id: res.id, resultado: res.resultado, nota: res.nota, report: { post: postRef(rep.post_id) } } }
    })
  },
  async resolveAppeal(id, decision) {
    await wait()
    needMod()
    const d = load()
    const a = d.appeals.find((x) => x.id === id)
    if (!a) throw demoError('La apelación no existe.')
    if (a.estado !== 'pendiente') throw demoError('La apelación ya fue resuelta.')
    Object.assign(a, { estado: decision, resuelta_por: me().id, resolved_at: nowIso() })
    if (decision === 'revertida') {
      const res = d.resolutions.find((r) => r.id === a.resolution_id)
      const rep = d.reports.find((r) => r.id === res.report_id)
      const post = d.posts.find((p) => p.id === rep.post_id)
      if (post.borrado_por === 'moderacion') Object.assign(post, { estado: 'publicado', borrado_por: null })
      if (res.resultado === 'borrado_ban_3d') d.profiles.find((p) => p.id === post.author_id).ban_hasta = null
    }
    save()
  },
  async myResolutions() {
    await wait()
    const d = load()
    return d.resolutions.map((res) => {
      const rep = d.reports.find((r) => r.id === res.report_id)
      const post = d.posts.find((p) => p.id === rep.post_id)
      const ap = d.appeals.find((a) => a.resolution_id === res.id)
      return post.author_id !== meId() ? null : {
        resolution_id: res.id, post_id: post.id, post_titulo: post.titulo, resultado: res.resultado, nota: res.nota, created_at: res.created_at,
        apelacion_id: ap?.id ?? null, apelacion_estado: ap?.estado ?? null, apelacion_texto: ap?.texto ?? null
      }
    }).filter(Boolean).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },
  async appeal(resolutionId, texto) {
    await wait()
    needLogin()
    check(texto, LIMITES.apelacion, 'Apelación')
    const d = load()
    const res = d.resolutions.find((r) => r.id === resolutionId)
    if (!res) throw demoError('La resolución no existe.')
    const post = d.posts.find((p) => p.id === d.reports.find((r) => r.id === res.report_id).post_id)
    if (post.author_id !== meId()) throw demoError('Solo el autor de la publicación puede apelar.')
    if (res.resultado === 'descartado') throw demoError('Esa resolución descartó el reporte: no hay nada que apelar.')
    if (d.appeals.some((a) => a.resolution_id === resolutionId)) throw demoError('Ya apelaste esta resolución.')
    d.appeals.push({ id: nextId(d.appeals), resolution_id: resolutionId, apelante_id: me().id, texto: texto.trim(), estado: 'pendiente', resuelta_por: null, es_simulado: false, created_at: nowIso(), resolved_at: null })
    save()
  },
  async getStats() {
    await wait()
    needMod()
    const d = load()
    const dias = (n) => Date.now() - n * 864e5
    const lunes = (iso) => {
      const x = new Date(iso); x.setUTCHours(0, 0, 0, 0); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7))
      return x.toISOString().slice(0, 10)
    }
    const porSemana = {}
    d.posts.filter((p) => new Date(p.created_at) >= dias(56)).forEach((p) => { const k = lunes(p.created_at); porSemana[k] = (porSemana[k] || 0) + 1 })
    const semana = d.posts.filter((p) => new Date(p.created_at) >= dias(7))
    const activas = new Set(semana.map((p) => p.author_id))
    const porAnio = {}
    activas.forEach((id) => { const a = d.profiles.find((p) => p.id === id)?.anio; porAnio[a] = (porAnio[a] || 0) + 1 })
    const res30 = d.resolutions.filter((r) => new Date(r.created_at) >= dias(30))
    const ap30 = d.appeals.filter((a) => res30.some((r) => r.id === a.resolution_id))
    return {
      publicaciones_por_semana: Object.entries(porSemana).sort().map(([semana, total]) => ({ semana, total })),
      cuentas_activas_semana: activas.size,
      cuentas_registradas: d.profiles.filter((p) => p.rol === 'estudiante').length,
      activas_por_anio: Object.entries(porAnio).sort().map(([anio, cuentas]) => ({ anio: Number(anio), cuentas })),
      reportes_pendientes: d.reports.filter((r) => r.estado === 'pendiente').length,
      reportes_30d: d.reports.filter((r) => new Date(r.created_at) >= dias(30)).length,
      resoluciones_30d: res30.length,
      apeladas_30d: ap30.length,
      revertidas_30d: ap30.filter((a) => a.estado === 'revertida').length
    }
  },

  // ----- administración -----
  async listUsers({ q } = {}) {
    await wait()
    if (me()?.rol !== 'admin') throw demoError('Solo el administrador puede ver las cuentas.')
    const t = q?.trim().toLowerCase()
    return load().profiles.filter((p) => !t || p.alias.toLowerCase().includes(t)).sort((a, b) => a.alias.localeCompare(b.alias))
  },
  async setUserRole(id, rol) {
    await wait()
    if (me()?.rol !== 'admin') throw demoError('Solo el administrador puede cambiar roles.')
    const p = load().profiles.find((x) => x.id === id)
    if (!p) throw demoError('La cuenta no existe.')
    p.rol = rol
    save()
  }
}
