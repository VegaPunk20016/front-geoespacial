import api from './api'

export const userService = {
  async getUsers() {
    const response = await api.get('/users')
    return response.data
  },

  async updateUser(email, userData) {
    const response = await api.put(`/users/${email}`, userData)
    return response.data
  },

  async setRole(email, roleId) {
    // Endpoint específico para permisos (requiere jwt:manage_users)
    // Asumimos que tu controlador espera 'role_id' en el body
    const response = await api.patch(`/users/set-role/${email}`, { role_id: roleId })
    return response.data
  },

  async deleteUser(email) {
    // Usamos el email para eliminar
    const response = await api.delete(`/users/${email}`)
    return response.data
  },
}
