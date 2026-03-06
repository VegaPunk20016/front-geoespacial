import { defineStore } from 'pinia'
import padronService from '../services/padronService'

export const usePadronStore = defineStore('padron', {
  state: () => ({
    padrones: [],
    padronActual: null,
    beneficiarios: [],

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

    async fetchBeneficiarios(id) {
      this.status = 'loading'
      this.errorMessage = null

      try {
        const response = await padronService.getBeneficiarios(id)
        this.beneficiarios = response.data.data
        this.status = 'success'
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al cargar el mapa'
        this.status = 'error'
        throw err
      }
    },

    async crearPadron(datos) {
      this.actionStatus = 'loading'
      try {
        const response = await padronService.create(datos)
        this.padrones.unshift(response.data.data) // Reactividad pura
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
        this.errorMessage = err.response?.data?.message || 'Error al procesar el archivo CSV'
        this.actionStatus = 'error'
        throw err
      }
    },
  },
})
