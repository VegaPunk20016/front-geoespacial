import { defineStore } from 'pinia'
import padronService from '../services/padronService'
import api from '../services/api'

export const usePadronStore = defineStore('padron', {
  state: () => ({
    padrones: [],
    padronActual: null,
    beneficiarios: [], // puntos reales — cuando el backend responde modo:'puntos'
    clusters: [], // clusters agrupados — cuando el backend responde modo:'clusters'

    status: 'idle',
    actionStatus: 'idle',
    errorMessage: null,
  }),

  actions: {
    async fetchPadrones() {
      this.status = 'loading'
      this.errorMessage = null
      try {
        const response = await padronService.getAll()
        this.padrones = response.data.data
        this.status = 'success'
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al cargar los padrones'
        this.status = 'error'
        console.error(err)
      }
    },

    /**
     * fetchMapaDatos — siempre llama a /clusters.
     *
     * El backend decide internamente si devuelve puntos o clusters según el zoom
     * (umbral único en PadronController: zoom >= 13 → puntos, < 13 → clusters).
     * La respuesta trae { modo: 'puntos'|'clusters', data: [...] } para que el
     * frontend sepa qué recibió sin repetir la lógica del umbral aquí.
     *
     * Retorna el objeto completo { modo, total, data } para que el caller
     * pueda actualizar modoActual con el valor real del backend.
     */
    async fetchMapaDatos(id, filtros) {
      this.status = 'loading'
      try {
        const res = await api.get(`/padrones/${id}/clusters`, { params: filtros })
        const modo = res.data.modo // 'puntos' | 'clusters'
        const data = res.data.data || []

        if (modo === 'puntos') {
          this.beneficiarios = data
          this.clusters = []
        } else {
          this.clusters = data
          this.beneficiarios = []
        }

        this.status = 'success'
        return res.data // { modo, total, data }
      } catch (err) {
        this.status = 'error'
        console.error('Error cargando mapa:', err)
        return null
      }
    },

    async fetchBeneficiarios(id, coords = null) {
      this.status = 'loading'
      this.errorMessage = null
      try {
        const response = await padronService.getBeneficiarios(id, coords)
        this.beneficiarios = response.data.data
        this.status = 'success'
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al cargar los datos'
        this.status = 'error'
        throw err
      }
    },

    async fetchClusters(id, coords = null) {
      this.status = 'loading'
      this.errorMessage = null
      try {
        const response = await padronService.getClusters(id, coords)
        this.clusters = response.data.data
        this.status = 'success'
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al cargar clusters'
        this.status = 'error'
        throw err
      }
    },

    async buscarMunicipios(id, query) {
      try {
        const response = await api.get(`/padrones/${id}/buscar`, { params: { q: query } })
        return response.data.data
      } catch (err) {
        console.error('Error en la búsqueda de municipios:', err)
        return []
      }
    },

    async crearPadron(datos) {
      this.actionStatus = 'loading'
      try {
        const response = await padronService.create(datos)
        this.padrones.unshift(response.data.data)
        this.actionStatus = 'success'
        return response.data
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al crear la tabla'
        this.actionStatus = 'error'
        throw err
      }
    },

    async importarCsv(id, file) {
      this.actionStatus = 'loading'
      this.errorMessage = null
      try {
        const response = await padronService.importCsv(id, file)
        this.actionStatus = 'success'
        return response.data
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al procesar el archivo'
        this.actionStatus = 'error'
        throw err
      }
    },

    async fetchResumenAgnostico(id, municipio = null) {
      try {
        const params = municipio ? { municipio } : {}
        const response = await api.get(`/padrones/${id}/resumen`, { params })
        return response.data.data
      } catch (err) {
        console.error('Error al obtener resumen agnóstico:', err)
        return null
      }
    },

    async eliminarPadron(id, permanente = false) {
      this.actionStatus = 'loading'
      this.errorMessage = null
      try {
        await padronService.eliminar(id, permanente)
        this.padrones = this.padrones.filter((p) => p.id !== id)
        this.actionStatus = 'success'
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al eliminar el padrón'
        this.actionStatus = 'error'
        throw err
      }
    },
  },
})
