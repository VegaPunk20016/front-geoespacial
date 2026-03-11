import { defineStore } from 'pinia'
import { userService } from '@/services/userService'

export const useUserStore = defineStore('users', {
  // ─── PILAR 5: Máquina de estados completa ────────────────────────────────
  state: () => ({
    users: [],

    // Estado de la lista (fetch)
    status: 'idle', // idle | loading | success | error
    errorMessage: null,

    // Estado de acciones puntuales (editar, eliminar)
    actionStatus: 'idle', // idle | loading | success | error
    actionError: null,
  }),

  actions: {
    // ─── PILAR 1: La lógica de datos vive aquí, no en el componente ─────────

    async fetchUsers() {
      this.status = 'loading'
      this.errorMessage = null

      try {
        const data = await userService.getUsers()
        // Normaliza los 3 posibles formatos de respuesta del backend
        this.users = data.data || data.users || data
        this.status = 'success'
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'No se pudo cargar la lista de usuarios.'
        this.status = 'error'
        console.error(err)
      }
    },

    async updateUser(email, formData) {
      this.actionStatus = 'loading'
      this.actionError = null

      try {
        await userService.updateUser(email, formData)

        // Actualiza el usuario en la lista local sin refetch — reactividad pura
        const index = this.users.findIndex((u) => u.email === email)
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...formData }
        }

        this.actionStatus = 'success'
      } catch (err) {
        this.actionError = err.response?.data?.message || 'Error al actualizar el usuario.'
        this.actionStatus = 'error'
        throw err
      }
    },

    async deleteUser(email) {
      this.actionStatus = 'loading'
      this.actionError = null

      try {
        await userService.deleteUser(email)

        // Elimina de la lista local sin refetch — reactividad pura
        this.users = this.users.filter((u) => u.email !== email)

        this.actionStatus = 'success'
      } catch (err) {
        this.actionError = err.response?.data?.message || 'Error al eliminar el usuario.'
        this.actionStatus = 'error'
        throw err
      }
    },

    async setRole(email, roleId) {
      this.actionStatus = 'loading'
      this.actionError = null

      try {
        await userService.setRole(email, roleId)

        // Refleja el cambio de rol localmente
        const index = this.users.findIndex((u) => u.email === email)
        if (index !== -1) {
          this.users[index] = { ...this.users[index], role_id: roleId }
        }

        this.actionStatus = 'success'
      } catch (err) {
        this.actionError = err.response?.data?.message || 'Error al cambiar el rol.'
        this.actionStatus = 'error'
        throw err
      }
    },

    // Resetea el actionStatus a idle (útil al cerrar modales)
    resetActionStatus() {
      this.actionStatus = 'idle'
      this.actionError = null
    },
  },

  getters: {
    // ─── PILAR 2: Single Source of Truth — datos derivados aquí ─────────────
    totalUsers: (state) => state.users.length,
    isLoading: (state) => state.status === 'loading',
    hasError: (state) => state.status === 'error',
    isSaving: (state) => state.actionStatus === 'loading',
  },
})
