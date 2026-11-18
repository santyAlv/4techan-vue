const fmt = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
export const fmtFecha = (iso) => (iso ? fmt.format(new Date(iso)) : '—')

export function hace(iso) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `hace ${d} ${d === 1 ? 'día' : 'días'}`
  return fmtFecha(iso)
}
export const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null)
