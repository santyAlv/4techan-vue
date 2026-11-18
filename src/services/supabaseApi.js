import { createClient } from '@supabase/supabase-js'

// Solo se usan la URL y la clave PUBLICABLE. La seguridad real está en las políticas RLS de la base.
let client
const sb = () =>
  (client ??= createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  }))

const unwrap = ({ data, error }) => {
  if (error) throw error
  return data
}
const one = (v) => (Array.isArray(v) ? v[0] ?? null : v ?? null)

const POST_COLS =
  'id, titulo, cuerpo, estado, borrado_por, es_simulado, created_at, updated_at, author_id, autor_alias, board:boards(id, slug, nombre), comments(count)'
const normPost = (p) => ({ ...p, comentarios: p.comments?.[0]?.count ?? 0 })

export const supabaseApi = {
  // ----- autenticación -----
  async getSession() {
    const { data } = await sb().auth.getSession()
    return data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null
  },
  onAuthChange(cb) {
    const { data } = sb().auth.onAuthStateChange((_e, s) => cb(s?.user ? { id: s.user.id, email: s.user.email } : null))
    return () => data.subscription.unsubscribe()
  },
  async signIn({ email, password }) {
    unwrap(await sb().auth.signInWithPassword({ email, password }))
  },
  async signUp({ email, password, alias, anio, especialidad }) {
    const { data, error } = await sb().auth.signUp({
      email,
      password,
      options: { data: { alias, anio: String(anio), especialidad: especialidad || '' } }
    })
    if (error) throw error
    return { needsConfirmation: !data.session }
  },
  async signOut() {
    unwrap(await sb().auth.signOut())
  },
  async getMyProfile() {
    const s = await this.getSession()
    if (!s) return null
    return one(unwrap(await sb().from('profiles').select('id, alias, anio, especialidad, rol, ban_hasta, es_simulado').eq('id', s.id).limit(1)))
  },
  async aliasDisponible(alias) {
    return unwrap(await sb().rpc('alias_disponible', { p_alias: alias }))
  },

  // ----- foro -----
  async listBoards() {
    const rows = unwrap(await sb().from('boards').select('id, slug, nombre, descripcion, posts(count)').order('id'))
    return rows.map((b) => ({ ...b, total: b.posts?.[0]?.count ?? 0 }))
  },
  async listPosts({ board_slug, q, estado, orden = 'recientes', autor_id, page = 1, pageSize = 10 } = {}) {
    let query = sb().from('posts').select(board_slug ? POST_COLS.replace('board:boards(', 'board:boards!inner(') : POST_COLS, { count: 'exact' })
    if (board_slug) query = query.eq('board.slug', board_slug)
    if (estado) query = query.eq('estado', estado)
    if (autor_id) query = query.eq('author_id', autor_id)
    if (q?.trim()) {
      const t = q.trim().replace(/[%,()]/g, ' ')
      query = query.or(`titulo.ilike.%${t}%,cuerpo.ilike.%${t}%`)
    }
    query = query.order('created_at', { ascending: orden === 'antiguas' }).range((page - 1) * pageSize, page * pageSize - 1)
    const { data, error, count } = await query
    if (error) throw error
    return { data: data.map(normPost), count }
  },
  async getPost(id) {
    const post = one(unwrap(await sb().from('posts').select(POST_COLS).eq('id', id).limit(1)))
    if (!post) return null
    const comments = unwrap(
      await sb().from('comments').select('id, cuerpo, autor_alias, author_id, estado, es_simulado, created_at').eq('post_id', id).order('created_at')
    )
    return { ...normPost(post), comments }
  },
  async createPost({ board_id, titulo, cuerpo }) {
    const s = await this.getSession()
    return one(
      unwrap(await sb().from('posts').insert({ board_id: Number(board_id), author_id: s.id, titulo: titulo.trim(), cuerpo: cuerpo.trim() }).select('id'))
    )
  },
  async updatePost(id, { titulo, cuerpo }) {
    const rows = unwrap(await sb().from('posts').update({ titulo: titulo.trim(), cuerpo: cuerpo.trim() }).eq('id', id).select('id'))
    if (!rows.length) throw Object.assign(new Error('No se pudo modificar: la publicación ya no está disponible.'), { code: 'P0001' })
  },
  async cancelPost(id) {
    const rows = unwrap(await sb().from('posts').update({ estado: 'borrado' }).eq('id', id).select('id'))
    if (!rows.length) throw Object.assign(new Error('No se pudo cancelar: la publicación ya no está disponible.'), { code: 'P0001' })
  },
  async createComment({ post_id, cuerpo }) {
    const s = await this.getSession()
    unwrap(await sb().from('comments').insert({ post_id, author_id: s.id, cuerpo: cuerpo.trim() }))
  },
  async cancelComment(id) {
    unwrap(await sb().from('comments').update({ estado: 'borrado' }).eq('id', id))
  },

  // ----- reportes y moderación -----
  async createReport({ post_id, motivo, detalle }) {
    const s = await this.getSession()
    unwrap(await sb().from('reports').insert({ post_id, reporter_id: s.id, motivo, detalle: detalle?.trim() || null }))
  },
  async listReports({ estado = 'pendiente' } = {}) {
    return unwrap(
      await sb()
        .from('reports')
        .select('id, motivo, detalle, estado, es_simulado, created_at, reporter:profiles!reporter_id(alias), post:posts!post_id(id, titulo, autor_alias, estado)')
        .eq('estado', estado)
        .order('created_at')
    )
  },
  async resolveReport(id, { resultado, nota }) {
    unwrap(await sb().rpc('resolver_reporte', { p_report_id: id, p_resultado: resultado, p_nota: nota?.trim() || null }))
  },
  async listHistory({ resultado, apelacion, q } = {}) {
    const rows = unwrap(
      await sb()
        .from('resolutions')
        .select(
          'id, resultado, nota, es_simulado, created_at, moderator:profiles!moderator_id(alias), report:reports!report_id(id, motivo, detalle, post:posts!post_id(id, titulo, autor_alias, estado)), appeal:appeals(id, estado, texto, created_at, resolved_at)'
        )
        .order('created_at', { ascending: false })
        .limit(300)
    )
    return rows
      .map((r) => ({ ...r, appeal: one(r.appeal) }))
      .filter((r) => !resultado || r.resultado === resultado)
      .filter((r) => !apelacion || (apelacion === 'sin_apelar' ? !r.appeal : r.appeal?.estado === apelacion))
      .filter((r) => !q?.trim() || `${r.report?.post?.titulo} ${r.report?.post?.autor_alias} ${r.nota ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
  },
  async listAppeals({ estado = 'pendiente' } = {}) {
    return unwrap(
      await sb()
        .from('appeals')
        .select(
          'id, texto, estado, es_simulado, created_at, resolution:resolutions!resolution_id(id, resultado, nota, report:reports!report_id(post:posts!post_id(id, titulo, autor_alias, estado)))'
        )
        .eq('estado', estado)
        .order('created_at')
    )
  },
  async resolveAppeal(id, decision) {
    unwrap(await sb().rpc('resolver_apelacion', { p_appeal_id: id, p_decision: decision }))
  },
  async myResolutions() {
    return unwrap(await sb().rpc('mis_resoluciones'))
  },
  async appeal(resolutionId, texto) {
    unwrap(await sb().rpc('apelar', { p_resolution_id: resolutionId, p_texto: texto }))
  },
  async getStats() {
    return unwrap(await sb().rpc('estadisticas'))
  },

  // ----- administración -----
  async listUsers({ q } = {}) {
    let query = sb().from('profiles').select('id, alias, anio, especialidad, rol, ban_hasta, es_simulado, created_at').order('alias').limit(200)
    if (q?.trim()) query = query.ilike('alias', `%${q.trim().replace(/[%,()]/g, '')}%`)
    return unwrap(await query)
  },
  async setUserRole(id, rol) {
    const rows = unwrap(await sb().from('profiles').update({ rol }).eq('id', id).select('id'))
    if (!rows.length) throw Object.assign(new Error('No tenés permiso para cambiar roles.'), { code: '42501' })
  }
}
