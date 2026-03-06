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
  },
  getters: {
    isAuthenticated: (state) => !!state.token && state.token !== 'undefined',
    userRole: (state) => state.user?.role || 'user',
  },
})
