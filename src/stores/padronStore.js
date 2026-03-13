import { defineStore } from 'pinia'
import padronService from '../services/padronService'
import api from '../services/api' // Asegúrate de importar tu instancia de axios/api

export const usePadronStore = defineStore('padron', {
  state: () => ({
    padrones: [],
    padronActual: null,
    beneficiarios: [], // puntos reales (zoom alto)
    clusters: [], // clusters del servidor (zoom bajo)

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

    async fetchMapaDatos(id, filtros, modo) {
      this.loading = true
      try {
        // Si el zoom es alto pedimos beneficiarios, si es bajo clusters
        const endpoint = modo === 'puntos' ? 'beneficiarios' : 'clusters'
        const res = await api.get(`/padrones/${id}/${endpoint}`, { params: filtros })

        if (modo === 'puntos') {
          this.beneficiarios = res.data.data || []
        } else {
          this.clusters = res.data.data || []
        }
      } catch (err) {
        console.error('Error cargando mapa:', err)
      } finally {
        this.loading = false
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

    // ---> NUEVA ACCIÓN: BUSCADOR OMNIBAR <---
    async buscarPersona(id, query) {
      try {
        const response = await api.get(`/padrones/${id}/buscar`, { params: { q: query } })
        return response.data.data
      } catch (err) {
        console.error('Error en la búsqueda global:', err)
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
