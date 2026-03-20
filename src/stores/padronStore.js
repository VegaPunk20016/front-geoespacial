import { defineStore } from 'pinia'
import padronService from '../services/padronService'

// ─────────────────────────────────────────────────────────────────────────────
// CACHE DE BOUNDS — evita re-pedir el mismo área en 5 minutos
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000
const boundsCache = new Map()

const buildCacheKey = (modo, id, filtros) => {
  const f = normalizarBounds(filtros)
  const p = 2
  const r = (n) => (n != null ? Math.round(Number(n) * 10 ** p) / 10 ** p : 'x')
  const mun = filtros?.municipio ? `_${filtros.municipio}` : ''
  return `${modo}_${id}_${r(f.min_lat)}_${r(f.max_lat)}_${r(f.min_lng)}_${r(f.max_lng)}${mun}`
}

const getCache = (key) => {
  const entry = boundsCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) {
    boundsCache.delete(key)
    return null
  }
  return entry.data
}

const setCache = (key, data) => {
  boundsCache.set(key, { data, ts: Date.now() })
  if (boundsCache.size > 50) boundsCache.delete(boundsCache.keys().next().value)
}

const invalidarCache = (id) => {
  for (const key of boundsCache.keys()) {
    if (key.includes(`_${id}_`)) boundsCache.delete(key)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZAR BOUNDS
// ─────────────────────────────────────────────────────────────────────────────
function normalizarBounds(coords = {}) {
  if (!coords) return {}

  let min_lat, max_lat, min_lng, max_lng

  if (Array.isArray(coords.bounds)) {
    const [[S, W], [N, E]] = coords.bounds
    min_lat = S
    max_lat = N
    min_lng = W
    max_lng = E
  } else {
    min_lat = coords.min_lat
    max_lat = coords.max_lat
    min_lng = coords.min_lng
    max_lng = coords.max_lng
  }

  const validLat = (n) => isFinite(n) && n >= -90 && n <= 90
  const validLng = (n) => isFinite(n) && n >= -180 && n <= 180

  const f = {
    zoom: coords.zoom ?? null,
    nivel: coords.nivel ?? null,
    municipio: coords.municipio ?? null,
  }

  if (validLat(min_lat) && validLat(max_lat) && validLng(min_lng) && validLng(max_lng)) {
    f.min_lat = Number(min_lat)
    f.max_lat = Number(max_lat)
    f.min_lng = Number(min_lng)
    f.max_lng = Number(max_lng)
  }

  return f
}

export const usePadronStore = defineStore('padron', {
  state: () => ({
    padrones: [],
    padronActual: null,
    beneficiarios: [],
    clusters: [],
    paginacion: null, // { total, pagina, por_pagina, paginas }

    status: 'idle',
    mapLoading: false,
    actionStatus: 'idle',
    errorMessage: null,

    _mapRequestId: 0,
  }),

  actions: {
    // =========================================================
    // CATÁLOGO
    // =========================================================

    async fetchPadrones() {
      this.status = 'loading'
      this.errorMessage = null
      try {
        const res = await padronService.getAll()
        this.padrones = res.data.data
        this.status = 'success'
      } catch (err) {
        if (err.name === 'CanceledError') return
        this.errorMessage = err.response?.data?.message || 'Error al cargar los padrones'
        this.status = 'error'
      }
    },

    async fetchPadronPorId(id) {
      try {
        const res = await padronService.getById(id)
        this.padronActual = res.data.data
        return this.padronActual
      } catch (err) {
        console.error('Error al cargar el padrón:', err)
        return null
      }
    },

    // =========================================================
    // MAPA — AbortController + requestId + cache de bounds
    // =========================================================

    _mapAbortController: null,

    async fetchMapaDatos(id, coords, modo) {
      const filtros = normalizarBounds(coords)
      const cacheKey = buildCacheKey(modo, id, filtros)
      const cachedData = getCache(cacheKey)

      if (cachedData) {
        if (modo === 'puntos') {
          this.beneficiarios = cachedData
          this.clusters = []
        } else {
          this.clusters = cachedData
          this.beneficiarios = []
        }
        return
      }

      if (this._mapAbortController) this._mapAbortController.abort()
      this._mapAbortController = new AbortController()
      const signal = this._mapAbortController.signal
      const requestId = ++this._mapRequestId

      this.mapLoading = true

      try {
        let data
        if (modo === 'puntos') {
          const res = await padronService.getBeneficiarios(id, filtros, signal)
          data = res.data.data || []
        } else {
          const res = await padronService.getClusters(id, filtros, signal)
          data = res.data.data || []
        }

        if (requestId !== this._mapRequestId) return

        setCache(cacheKey, data)

        if (modo === 'puntos') {
          this.beneficiarios = data
          this.clusters = []
        } else {
          this.clusters = data
          this.beneficiarios = []
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
        console.error('Error cargando mapa:', err)
      } finally {
        if (requestId === this._mapRequestId) this.mapLoading = false
      }
    },

    // =========================================================
    // BENEFICIARIOS — tabla sin paginación (carga todo)
    // =========================================================

    async fetchBeneficiarios(id, filtros = {}) {
      this.status = 'loading'
      this.errorMessage = null
      try {
        const res = await padronService.getBeneficiarios(id, normalizarBounds(filtros))
        this.beneficiarios = res.data.data
        this.paginacion = null
        this.status = 'success'
      } catch (err) {
        if (err.name === 'CanceledError') return
        this.errorMessage = err.response?.data?.message || 'Error al cargar los datos'
        this.status = 'error'
        throw err
      }
    },

    // =========================================================
    // BENEFICIARIOS — tabla con paginación
    // =========================================================

    async fetchBeneficiariosPaginados(
      id,
      { pagina = 1, porPagina = 50, municipio = null, seccion = null, cp = null } = {},
    ) {
      this.status = 'loading'
      this.errorMessage = null
      try {
        const res = await padronService.getBeneficiariosPaginados(id, {
          pagina,
          porPagina,
          municipio,
          seccion,
          cp,
        })
        this.beneficiarios = res.data.data ?? []
        this.paginacion = res.data.paginacion ?? null
        this.status = 'success'
      } catch (err) {
        if (err.name === 'CanceledError') return
        this.errorMessage = err.response?.data?.message || 'Error al cargar los datos'
        this.status = 'error'
        throw err
      }
    },

    async fetchDetalleBeneficiario(padronId, beneficiarioId) {
      try {
        const res = await padronService.getDetalleBeneficiario(padronId, beneficiarioId)
        return res.data.data
      } catch (err) {
        console.error('Error al cargar detalle:', err)
        return null
      }
    },

    // =========================================================
    // CLUSTERS (acceso directo)
    // =========================================================

    async fetchClusters(id, filtros = {}) {
      this.status = 'loading'
      this.errorMessage = null
      try {
        const res = await padronService.getClusters(id, normalizarBounds(filtros))
        this.clusters = res.data.data
        this.status = 'success'
      } catch (err) {
        if (err.name === 'CanceledError') return
        this.errorMessage = err.response?.data?.message || 'Error al cargar clusters'
        this.status = 'error'
        throw err
      }
    },

    // =========================================================
    // BUSCADORES
    // =========================================================

    async buscarPersona(id, query) {
      try {
        const res = await padronService.buscar(id, query)
        return res.data.data
      } catch (err) {
        if (err.name === 'CanceledError') return []
        console.error('Error en búsqueda:', err)
        return []
      }
    },

    // Búsqueda inteligente: detecta CP (5 dígitos) o texto
    async buscarInteligente(id, query) {
      if (!query || query.length < 2) return []
      try {
        if (/^\d{5}$/.test(query)) {
          const res = await padronService.buscarPorCP(id, query)
          return res.data.data
        }
        const res = await padronService.buscar(id, query)
        return res.data.data
      } catch (err) {
        if (err.name === 'CanceledError') return []
        console.error('Error en búsqueda inteligente:', err)
        return []
      }
    },

    // Obtener estructura dinámica del padrón (campos extras del JSON)
    async fetchPlantillaExtra(id) {
      try {
        const res = await padronService.getPlantilla(id)
        return res.data.data
      } catch (err) {
        console.error('Error al obtener plantilla:', err)
        return {}
      }
    },

    // =========================================================
    // RESUMEN
    // =========================================================

    async fetchResumenAgnostico(id, municipio = null) {
      try {
        const res = await padronService.getResumen(id, municipio)
        return res.data.data
      } catch (err) {
        console.error('Error al obtener resumen:', err)
        return null
      }
    },

    // =========================================================
    // CRUD BENEFICIARIOS
    // =========================================================

    async crearBeneficiario(padronId, campos = {}, datosGenerales = {}) {
      this.actionStatus = 'loading'
      this.errorMessage = null
      try {
        const res = await padronService.crearBeneficiario(padronId, campos, datosGenerales)
        this.actionStatus = 'success'
        invalidarCache(padronId)
        return res.data
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al crear el registro'
        this.actionStatus = 'error'
        throw err
      }
    },

    async editarBeneficiario(padronId, beneficiarioId, campos = {}, datosGenerales = {}) {
      this.actionStatus = 'loading'
      this.errorMessage = null
      try {
        const res = await padronService.editarBeneficiario(
          padronId,
          beneficiarioId,
          campos,
          datosGenerales,
        )

        // Actualizar localmente sin recargar toda la lista
        const idx = this.beneficiarios.findIndex((b) => b.id === beneficiarioId)
        if (idx !== -1) {
          this.beneficiarios = [
            ...this.beneficiarios.slice(0, idx),
            { ...this.beneficiarios[idx], ...campos },
            ...this.beneficiarios.slice(idx + 1),
          ]
        }

        this.actionStatus = 'success'
        invalidarCache(padronId)
        return res.data
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al editar el registro'
        this.actionStatus = 'error'
        throw err
      }
    },

    async eliminarBeneficiario(padronId, beneficiarioId) {
      this.actionStatus = 'loading'
      this.errorMessage = null
      try {
        await padronService.eliminarBeneficiario(padronId, beneficiarioId)
        this.beneficiarios = this.beneficiarios.filter((b) => b.id !== beneficiarioId)
        this.actionStatus = 'success'
        invalidarCache(padronId)
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al eliminar el registro'
        this.actionStatus = 'error'
        throw err
      }
    },

    // =========================================================
    // CRUD PADRONES
    // =========================================================

    async crearPadron(datos) {
      this.actionStatus = 'loading'
      this.errorMessage = null
      try {
        const res = await padronService.create(datos)
        this.padrones = [res.data.data, ...this.padrones]
        this.actionStatus = 'success'
        return res.data
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al crear el padrón'
        this.actionStatus = 'error'
        throw err
      }
    },

    async importarCsv(id, file, onProgress = null) {
      this.actionStatus = 'loading'
      this.errorMessage = null
      try {
        const res = await padronService.importCsv(id, file, onProgress)
        this.actionStatus = 'success'
        invalidarCache(id)
        return res.data
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al procesar el archivo'
        this.actionStatus = 'error'
        throw err
      }
    },

    async importarCsvMapeado(id, mapeo) {
      this.actionStatus = 'loading'
      this.errorMessage = null
      try {
        const res = await padronService.importCsvMapeado(id, mapeo)
        this.actionStatus = 'success'
        invalidarCache(id) // Limpiamos la caché del mapa/tabla
        return res.data // Retornamos los datos para que el componente los use
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al importar los datos'
        this.actionStatus = 'error'
        throw err
      }
    },

    async eliminarPadron(id, permanente = false) {
      this.actionStatus = 'loading'
      this.errorMessage = null
      try {
        await padronService.eliminar(id, permanente)
        this.padrones = this.padrones.filter((p) => p.id !== id)
        this.actionStatus = 'success'
        invalidarCache(id)
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Error al eliminar el padrón'
        this.actionStatus = 'error'
        throw err
      }
    },
  },
})
