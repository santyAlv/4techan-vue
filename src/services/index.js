// Punto único de acceso a los datos. Si hay credenciales de Supabase en .env se usa la base real;
// si no, la app corre en modo demostración con los datos de prueba locales (src/data/seed.json).
import { mockApi } from './mockApi.js'
import { supabaseApi } from './supabaseApi.js'

export const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
export const api = hasSupabase ? supabaseApi : mockApi
export const modo = hasSupabase ? 'supabase' : 'demo'
