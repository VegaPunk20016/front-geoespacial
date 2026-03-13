import api from './api'

export default {
  getAll() {
    return api.get('/padrones')
  },

  getById(id) {
    return api.get(`/padrones/${id}`)
  },

  // Puntos reales — zoom alto (≥13)
  getBeneficiarios(id, coords = null) {
    let url = `/padrones/${id}/beneficiarios`
    if (coords) url += '?' + new URLSearchParams(coords).toString()
    return api.get(url)
  },

  // Clusters del servidor — zoom bajo (<13)
  getClusters(id, coords = null) {
    let url = `/padrones/${id}/clusters`
    if (coords) url += '?' + new URLSearchParams(coords).toString()
    return api.get(url)
  },

  create(data) {
    return api.post('/padrones', data)
  },

  importCsv(id, file) {
    const formData = new FormData()
    formData.append('archivo', file)
    return api.post(`/padrones/${id}/importar`, formData, {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (e) => {
        console.log(`Subiendo: ${Math.round((e.loaded * 100) / e.total)}%`)
      },
    })
  },

  delete(id, permanente = false) {
    return api.delete(`/padrones/${id}?permanente=${permanente}`)
  },

  eliminar(id, permanente = false) {
    return this.delete(id, permanente)
  },
}
