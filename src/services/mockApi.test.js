import { describe, it, expect, beforeEach } from 'vitest'
import { mockApi as api, setDemoRole, resetDemo, DEMO_USERS } from './mockApi.js'

// localStorage mínimo para correr el modo demo en Node
const mem = new Map()
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }

const rol = (r) => setDemoRole(r)
beforeEach(() => { resetDemo(); rol('estudiante') })

describe('modo demo: permisos y operaciones', () => {
  it('invitado no puede publicar ni moderar', async () => {
    rol('invitado')
    await expect(api.createPost({ board_id: 1, titulo: 'Título válido', cuerpo: 'Cuerpo válido' })).rejects.toThrow(/rol/i)
    await expect(api.listReports()).rejects.toThrow(/Comisión/)
  })

  it('estudiante crea, modifica y cancela (conserva historial)', async () => {
    const { id } = await api.createPost({ board_id: 1, titulo: 'Mi aporte', cuerpo: 'Texto del aporte' })
    await api.updatePost(id, { titulo: 'Mi aporte editado', cuerpo: 'Texto del aporte' })
    await api.cancelPost(id)
    const p = await api.getPost(id)
    expect(p.estado).toBe('borrado')
    expect(p.borrado_por).toBe('autor')
    rol('invitado')
    expect(await api.getPost(id)).toBeNull() // el invitado ya no la ve
    rol('moderador')
    expect((await api.getPost(id)).estado).toBe('borrado') // la Comisión sí: queda el historial
  })

  it('no permite editar publicaciones ajenas ni reportar las propias', async () => {
    await expect(api.updatePost(1, { titulo: 'Intento ajeno', cuerpo: 'Cuerpo válido' })).rejects.toThrow(/tus publicaciones/)
    const { id } = await api.createPost({ board_id: 2, titulo: 'Propia cosa', cuerpo: 'Cuerpo válido' })
    await expect(api.createReport({ post_id: id, motivo: 'spam' })).rejects.toThrow(/propia/)
  })

  it('reporte duplicado y motivo «otro» sin detalle se rechazan', async () => {
    await api.createReport({ post_id: 1, motivo: 'spam' })
    await expect(api.createReport({ post_id: 1, motivo: 'spam' })).rejects.toThrow(/Ya reportaste/)
    await expect(api.createReport({ post_id: 2, motivo: 'otro', detalle: 'corto' })).rejects.toThrow(/Otro/)
  })

  it('flujo completo: reporte -> resolución con suspensión -> apelación -> reversión', async () => {
    const { id } = await api.createPost({ board_id: 3, titulo: 'Venta dudosa', cuerpo: 'Texto de la venta' })
    const autor = DEMO_USERS.estudiante
    rol('moderador')
    // otro estudiante reporta: simulamos con el rol moderador (puede reportar)
    await api.createReport({ post_id: id, motivo: 'spam' })
    const [rep] = (await api.listReports()).filter((r) => r.post.id === id)
    await api.resolveReport(rep.id, { resultado: 'borrado_ban_3d', nota: 'Prueba de suspensión' })
    expect((await api.getPost(id)).borrado_por).toBe('moderacion')
    rol('estudiante')
    await expect(api.createPost({ board_id: 1, titulo: 'Sigo publicando', cuerpo: 'Cuerpo válido' })).rejects.toThrow(/suspendida/)
    const mis = (await api.myResolutions()).find((r) => r.post_id === id)
    await api.appeal(mis.resolution_id, 'Fue un malentendido, no vendía nada.')
    await expect(api.appeal(mis.resolution_id, 'Otra vez la misma apelación')).rejects.toThrow(/Ya apelaste/)
    rol('moderador')
    const [ap] = (await api.listAppeals()).filter((a) => a.resolution.report.post.id === id)
    await api.resolveAppeal(ap.id, 'revertida')
    expect((await api.getPost(id)).estado).toBe('publicado')
    rol('estudiante')
    const ok = await api.createPost({ board_id: 1, titulo: 'Ya puedo publicar', cuerpo: 'Cuerpo válido' })
    expect(ok.id).toBeGreaterThan(0)
    expect(autor).toBeTruthy()
  })

  it('solo el administrador gestiona roles', async () => {
    await expect(api.listUsers()).rejects.toThrow(/administrador/)
    rol('moderador')
    await expect(api.setUserRole(DEMO_USERS.estudiante, 'admin')).rejects.toThrow(/administrador/)
    rol('admin')
    await api.setUserRole(DEMO_USERS.estudiante, 'moderador')
    expect((await api.listUsers({ q: 'sim_13' }))[0].rol).toBe('moderador')
  })

  it('listados con búsqueda, filtro y datos de prueba marcados', async () => {
    const r = await api.listPosts({ q: 'soldadura' })
    expect(r.count).toBe(1)
    expect(r.data[0].es_simulado).toBe(true)
    const t = await api.listPosts({ board_slug: 'compraventa', pageSize: 3 })
    expect(t.data.length).toBeLessThanOrEqual(3)
    expect(t.data.every((p) => p.board.slug === 'compraventa')).toBe(true)
    rol('moderador')
    const h = await api.listHistory({ apelacion: 'revertida' })
    expect(h).toHaveLength(1)
    const stats = await api.getStats()
    expect(stats.resoluciones_30d).toBe(10)
    expect(stats.revertidas_30d).toBe(1)
  })
})
