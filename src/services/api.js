import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (No autorizado)
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        console.warn('Sesión expirada o inválida. Redirigiendo...')
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('user_data')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
