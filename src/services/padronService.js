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

  // 🔴 ZONA DE JEFES (Admin)
  create(data) {
    return api.post('/padrones', data)
  },

  // Ojo aquí: Le decimos a Axios que vamos a enviar un archivo pesado (multipart)
  importCsv(id, file) {
    const formData = new FormData()
    formData.append('archivo_csv', file)

    return api.post(`/padrones/${id}/importar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  delete(id, permanente = false) {
    return api.delete(`/padrones/${id}?permanente=${permanente}`)
  },
}
