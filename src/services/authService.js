import api from './api'

export const authService = {
  async register(userData) {
    const response = await api.post('/users/register', userData)
    return response.data
  },

  async login(credentials) {

    const response = await api.post('/users/login', credentials)
    return response.data
  },

  async sendForgotPassword(email) {
    const response = await api.post('/users/forgot-password', { email })
    return response.data
  },

  async resetPassword(token, password) {
    const response = await api.post('/users/reset-password', {
      token: token,
      password: password,
    })
    return response.data
  },
}
