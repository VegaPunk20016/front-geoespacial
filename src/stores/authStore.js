import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('jwt_token') || null,
    user: JSON.parse(localStorage.getItem('user_data')) || null,
  }),

  actions: {
    login(token) {
      this.token = token
      localStorage.setItem('jwt_token', token)

      try {
        const decoded = jwtDecode(token)
        const userData = {
          id: decoded.uid,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.perms,
        }
        this.user = userData
        localStorage.setItem('user_data', JSON.stringify(userData))
      } catch (error) {
        console.error('Error al decodificar el token:', error)
        this.logout()
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('user_data')
    },

    // 🆕 Verifica si el token expiró y hace logout automático si es necesario.
    // Llámalo en el guard del router o en App.vue al montar.
    checkTokenExpiry() {
      if (!this.token) return
      try {
        const { exp } = jwtDecode(this.token)
        const hasExpired = Date.now() >= exp * 1000 // exp viene en segundos
        if (hasExpired) {
          console.warn('Token expirado. Cerrando sesión automáticamente.')
          this.logout()
        }
      } catch {
        this.logout()
      }
    },
  },

  getters: {
    isAuthenticated: (state) => {
      if (!state.token || state.token === 'undefined') return false
      try {
        const { exp } = jwtDecode(state.token)
        return Date.now() < exp * 1000
      } catch {
        return false
      }
    },

    userRole: (state) => state.user?.role || 'user',
  },
})
