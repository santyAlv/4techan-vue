import { createRouter, createWebHashHistory } from 'vue-router'
import { iniciarSesion, sesion } from '../stores/session.js'
import { can } from '../utils/permissions.js'

// Cada ruta declara el permiso que necesita (meta.permiso). El guard lo comprueba antes de entrar.
const routes = [
  { path: '/', name: 'inicio', component: () => import('../views/HomeView.vue'), meta: { titulo: 'Inicio' } },
  { path: '/t/:slug', name: 'tablon', component: () => import('../views/BoardView.vue'), props: true, meta: { titulo: 'Tablón' } },
  { path: '/p/:id', name: 'publicacion', component: () => import('../views/PostView.vue'), props: true, meta: { titulo: 'Publicación' } },
  { path: '/nueva', name: 'nueva', component: () => import('../views/PostFormView.vue'), meta: { titulo: 'Nueva publicación', permiso: 'post:crear' } },
  { path: '/p/:id/editar', name: 'editar', component: () => import('../views/PostFormView.vue'), props: true, meta: { titulo: 'Editar publicación', permiso: 'post:crear' } },
  { path: '/mi-actividad', name: 'mi-actividad', component: () => import('../views/MyActivityView.vue'), meta: { titulo: 'Mi actividad', permiso: 'mi-actividad' } },
  { path: '/moderacion', name: 'moderacion', component: () => import('../views/ModerationView.vue'), meta: { titulo: 'Moderación', permiso: 'moderacion:ver' } },
  { path: '/moderacion/historial', name: 'historial', component: () => import('../views/HistoryView.vue'), meta: { titulo: 'Historial de moderación', permiso: 'moderacion:ver' } },
  { path: '/estadisticas', name: 'estadisticas', component: () => import('../views/StatsView.vue'), meta: { titulo: 'Estadísticas', permiso: 'estadisticas:ver' } },
  { path: '/usuarios', name: 'usuarios', component: () => import('../views/UsersView.vue'), meta: { titulo: 'Cuentas y roles', permiso: 'usuarios:administrar' } },
  { path: '/ingresar', name: 'ingresar', component: () => import('../views/LoginView.vue'), meta: { titulo: 'Ingresar' } },
  { path: '/registro', name: 'registro', component: () => import('../views/RegisterView.vue'), meta: { titulo: 'Crear cuenta' } },
  { path: '/acerca', name: 'acerca', component: () => import('../views/AboutView.vue'), meta: { titulo: 'Acerca de esta versión' } },
  { path: '/acceso-denegado', name: 'denegado', component: () => import('../views/DeniedView.vue'), meta: { titulo: 'Sin acceso' } },
  { path: '/:pathMatch(.*)*', name: 'no-encontrada', component: () => import('../views/DeniedView.vue'), props: { noEncontrada: true }, meta: { titulo: 'No encontrada' } }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(async (to) => {
  await iniciarSesion()
  const permiso = to.meta.permiso
  if (permiso && !can(sesion.rol.value, permiso)) {
    return sesion.logueado.value ? { name: 'denegado' } : { name: 'ingresar', query: { volver: to.fullPath } }
  }
})
router.afterEach((to) => {
  document.title = `${to.meta.titulo ?? '4TEChan'} · 4TEChan`
})
