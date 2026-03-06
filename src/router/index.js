import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/layouts/LandingPage.vue'),
    meta: { guestOnly: true }, // Solo para gente sin sesión
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    // Nuestra nueva ruta protegida
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardPage.vue'),
    meta: { requiresAuth: true }, // Esta etiqueta es la marca secreta
  },
  {
    path: '/padrones/:id/datos',
    name: 'PadronDataView',
    component: () => import('@/views/PadronDataView.vue'),
    meta: { requiresAuth: true }, // Protegida igual que tu dashboard
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/ResetPassword.vue'),
    meta: { guestOnly: true },
    props: (route) => ({ token: route.query.token }),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLogged = authStore.isAuthenticated

  // CASO A: La ruta es solo para invitados y el usuario YA está logueado
  if (to.meta.guestOnly && isLogged) {
    return next('/dashboard') // Lo mandamos directo al dashboard
  }

  // CASO B: La ruta requiere auth y el usuario NO está logueado
  if (to.meta.requiresAuth && !isLogged) {
    return next('/login') // Lo pateamos al login
  }

  // CASO C: Todo normal, puede pasar
  next()
})

export default router
