import api from './api'

export default {
  getAll() {
    return api.get('/padrones')
  },
  getById(id) {
    return api.get(`/padrones/${id}`)
  },

  // Mapa — con AbortController signal
  getBeneficiarios(id, filtros = {}, signal = null) {
    return api.get(`/padrones/${id}/beneficiarios`, {
      params: filtros,
      ...(signal ? { signal } : {}),
    })
  },

  // Tabla — paginación explícita
  getBeneficiariosPaginados(
    id,
    { pagina = 1, porPagina = 50, municipio = null, seccion = null, cp = null } = {},
    signal = null,
  ) {
    return api.get(`/padrones/${id}/beneficiarios`, {
      params: {
        pagina,
        por_pagina: porPagina,
        ...(municipio ? { municipio } : {}),
        ...(seccion ? { seccion } : {}),
        ...(cp ? { codigo_postal: cp } : {}),
      },
      ...(signal ? { signal } : {}),
    })
  },

  getDetalleBeneficiario(padronId, beneficiarioId) {
    return api.get(`/padrones/${padronId}/beneficiarios/${beneficiarioId}`)
  },

  // Crear beneficiario
  crearBeneficiario(padronId, campos = {}, datosGenerales = {}) {
    return api.post(`/padrones/${padronId}/beneficiarios`, {
      campos_fijos: campos,
      datos_generales: datosGenerales,
    })
  },

  // Editar beneficiario (PATCH)
  editarBeneficiario(padronId, beneficiarioId, campos = {}, datosGenerales = {}) {
    return api.patch(`/padrones/${padronId}/beneficiarios/${beneficiarioId}`, {
      campos_fijos: campos,
      datos_generales: datosGenerales,
    })
  },

  // Eliminar beneficiario
  eliminarBeneficiario(padronId, beneficiarioId) {
    return api.delete(`/padrones/${padronId}/beneficiarios/${beneficiarioId}`)
  },

  getClusters(id, filtros = {}, signal = null) {
    return api.get(`/padrones/${id}/clusters`, {
      params: filtros,
      ...(signal ? { signal } : {}),
    })
  },

  buscar(id, q) {
    return api.get(`/padrones/${id}/buscar`, { params: { q } })
  },

  buscarGlobal(id, q, pagina = 1, porPagina = 100) {
    return api.get(`/padrones/${id}/buscar-global`, {
      params: { q, pagina, por_pagina: porPagina },
    })
  },

  buscarPorCP(id, cp) {
    return api.get(`/padrones/${id}/buscar-cp/${cp}`)
  },

  getResumen(id, municipio = null) {
    const params = municipio ? { municipio } : {}
    return api.get(`/padrones/${id}/resumen`, { params })
  },

  getPlantilla(id) {
    return api.get(`/padrones/${id}/plantilla`)
  },

  exportarPadronCompleto(id, termino = null) {
    return api.get(`/padrones/${id}/exportar`, {
      params: termino ? { q: termino } : {}, // ← enviar q si hay búsqueda
      responseType: 'blob',
      timeout: 120000,
    })
  },

  create(data) {
    return api.post('/padrones', data)
  },

  importCsv(id, file, onProgress = null) {
    const formData = new FormData()
    formData.append('archivo', file)
    return api.post(`/padrones/${id}/importar`, formData, {
      headers: { 'Content-Type': undefined },
      onUploadProgress: onProgress
        ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
        : undefined,
    })
  },

  importCsvMapeado(id, mapeo) {
    // Axios lo enviará como JSON automáticamente, sin trucos
    return api.post(`/padrones/${id}/importar-mapeado`, { mapeo })
  },

  eliminar(id, permanente = false) {
    return api.delete(`/padrones/${id}`, { params: { permanente } })
  },
}
