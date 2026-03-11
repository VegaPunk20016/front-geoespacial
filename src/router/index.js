import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/layouts/LandingPage.vue'),
    meta: { guestOnly: true },
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
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/padrones/:id/datos',
    name: 'PadronDataView',
    component: () => import('@/views/PadronDataView.vue'),
    meta: { requiresAuth: true },
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
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  authStore.checkTokenExpiry()

  const isLogged = authStore.isAuthenticated

  if (to.meta.guestOnly && isLogged) {
    return next('/dashboard')
  }

  if (to.meta.requiresAuth && !isLogged) {
    return next('/login')
  }

  next()
})

export default router
