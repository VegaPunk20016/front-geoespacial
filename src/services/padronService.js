import api from './api'

export default {
  getAll() {
    return api.get('/padrones')
  },

  getById(id) {
    return api.get(`/padrones/${id}`)
  },

  getBeneficiarios(id) {
    return api.get(`/padrones/${id}/beneficiarios`)
  },

  create(data) {
    return api.post('/padrones', data)
  },

  importCsv(id, file) {
    const formData = new FormData()
    formData.append('archivo', file)

    return api
      .post(`/padrones/${id}/importar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Subiendo: ${percentCompleted}%`)
        },
      })
      .catch((err) => {
        console.error('Error en la petición Axios:', err)
        throw err
      })
  },

  eliminar(id, permanente = false) {
    return api.delete(`/padrones/${id}?permanente=${permanente}`)
  },
}
