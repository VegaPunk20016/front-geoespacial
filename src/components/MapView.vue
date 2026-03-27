<template>
  <div ref="mapContainer" class="w-full h-full bg-[#f8fafc] outline-none"></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, markRaw, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'

import dataMun from '@/data/edomex_municipios.json'
import dataEnt from '@/data/edomex_estado.json'
import { ZOOM_MUNICIPIO, ZOOM_PUNTO } from '@/utils/mapConstants'

// ── 1. Props y Emits ───────────────────────────────────────────────────────
const props = defineProps({
  registros: { type: Array, default: () => [] },
  modo: { type: String, default: 'estado' }, // 'estado' | 'clusters' | 'puntos'
  datosCoropletas: { type: Array, default: () => [] },
  municipioFiltro: { type: String, default: null },
  tieneCoordenadas: { type: Boolean, default: true },
})

const emit = defineEmits([
  'select',
  'view-change',
  'municipio-click',
  'zoom-nivel',
  'cluster-click',
])

// ── 2. Estado Interno y Cachés ─────────────────────────────────────────────
const mapContainer = ref(null)
const state = {
  map: null,
  clusterLayer: null,
  pointsLayer: null,
  municipiosLayer: null,
}

// Mapa de capas por nombre para acceso O(1)
const _municipioLayerMap = new Map()

let _renderTimer = null
let _prevRegistros = []
let _markerMap = new Map()
let lastMoveEmit = 0

const normalize = (s) => s?.toUpperCase().trim()

// Caché de iconos de cluster para evitar re-crear objetos
const iconCache = new Map()
const getClusterIcon = (count) => {
  if (iconCache.has(count)) return iconCache.get(count)
  const icon = L.divIcon({
    html: `<div class="c-bubble">${count}</div>`,
    className: 'c-icon',
    iconSize: [35, 35],
  })
  iconCache.set(count, icon)
  return icon
}

// Caché de coordenadas para evitar Number() repetido
const coordsCache = new WeakMap()
const getCoords = (r) => {
  if (r._coords) return r._coords
  if (coordsCache.has(r)) return coordsCache.get(r)
  const lat = Number(r.lat ?? r.latitud)
  const lng = Number(r.lng ?? r.longitud)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const coords = [lat, lng]
  coordsCache.set(r, coords)
  return coords
}

// ── 3. Computadas y Estilos ────────────────────────────────────────────────
const coropletaMap = computed(() => {
  if (!props.datosCoropletas?.length) return {}
  return Object.fromEntries(
    props.datosCoropletas.map((d) => [normalize(d.municipio), parseInt(d.total) || 0]),
  )
})

const maxTotal = computed(() => Math.max(...Object.values(coropletaMap.value), 1))

const getMunicipioStyle = (feature) => {
  const nombre = normalize(feature.properties.nombre)
  const esSeleccionado = normalize(props.municipioFiltro) === nombre
  const total = coropletaMap.value[nombre] || 0

  if (esSeleccionado) {
    return { color: '#0f172a', weight: 3, opacity: 1, fillColor: '#177DA6', fillOpacity: 0.55 }
  }

  // Coropleta: más registros → color más intenso
  if (total > 0) {
    const ratio = Math.min(total / maxTotal.value, 1)
    const fillOpacity = 0.15 + ratio * 0.55
    return {
      color: '#1e4a6e',
      weight: 0.6,
      opacity: 0.6,
      fillColor: '#177DA6',
      fillOpacity,
      className: 'mun-path',
    }
  }

  return {
    color: '#1e4a6e',
    weight: 0.6,
    opacity: 0.6,
    fillColor: '#bfdbfe',
    fillOpacity: 0.25,
    className: 'mun-path',
  }
}

// ── 4. Inicialización del Mapa ─────────────────────────────────────────────
const initMap = () => {
  if (state.map) return

  state.map = markRaw(
    L.map(mapContainer.value, {
      zoomControl: false,
      preferCanvas: true,
      center: [19.35, -99.63],
      zoom: 9,
      minZoom: 8,
      maxZoom: 22,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    }),
  )

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; INEGI',
    maxZoom: 22,
    maxNativeZoom: 19,
  }).addTo(state.map)

  state.clusterLayer = markRaw(
    L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      maxClusterRadius: (zoom) => {
        if (zoom >= 19) return 10
        if (zoom >= 15) return 30
        return 50
      },
      spiderlegPolylineOptions: { weight: 1.5, color: '#177da6', opacity: 0.6 },
      chunkedLoading: true,
      iconCreateFunction: (c) => getClusterIcon(c.getChildCount()),
    }),
  ).addTo(state.map)

  state.pointsLayer = markRaw(L.layerGroup()).addTo(state.map)

  // Borde del estado (no interactivo)
  L.geoJSON(dataEnt, {
    style: { color: '#1e293b', weight: 2, fillOpacity: 0, interactive: false },
  }).addTo(state.map)

  // Capa de municipios con tooltips y eventos
  state.municipiosLayer = markRaw(
    L.geoJSON(dataMun, {
      style: getMunicipioStyle,
      onEachFeature: (feature, layer) => {
        const nombre = feature.properties.nombre

        // Registrar en mapa de acceso rápido para zoomToMunicipio
        _municipioLayerMap.set(normalize(nombre), layer)

        layer.bindTooltip('', { className: 'map-tooltip', sticky: true, direction: 'top' })

        layer.on({
          // Dejamos el hover intacto
          mouseover: () => {
            const total = coropletaMap.value[normalize(nombre)] || 0
            layer.setTooltipContent(`
              <div class="font-bold text-xs">${nombre}</div>
              <div class="text-[10px] opacity-80">${total.toLocaleString()} registros</div>
            `)
          },
          // ELIMINAMOS EL EVENTO CLICK AQUÍ
        })
      },
    }),
  ).addTo(state.map)

  state.map.on('moveend', handleMoveEnd)
}

// ── 5. Eventos del Mapa ────────────────────────────────────────────────────
const handleMoveEnd = () => {
  const now = Date.now()
  if (now - lastMoveEmit < 200) return
  lastMoveEmit = now

  const b = state.map.getBounds().pad(0.2)
  const zoom = state.map.getZoom()
  const nivel = zoom >= ZOOM_PUNTO ? 'punto' : zoom >= ZOOM_MUNICIPIO ? 'municipio' : 'estado'

  emit('zoom-nivel', nivel)
  emit('view-change', {
    bounds: [
      [b.getSouth(), b.getWest()],
      [b.getNorth(), b.getEast()],
    ],
    zoom,
    nivel,
  })
}

// ── 6. Renderizado de Markers ──────────────────────────────────────────────
const renderThrottled = () => {
  clearTimeout(_renderTimer)
  _renderTimer = setTimeout(renderMarkers, 150)
}

const renderMarkers = () => {
  if (!state.map) return

  if (props.modo === 'estado') {
    _renderSuperClusterEstado()
    return
  }

  if (props.modo === 'clusters') _renderClusters()
  else if (props.modo === 'puntos') _renderPuntosDiff()
}

const _renderSuperClusterEstado = () => {
  _clearAll()
  const totalGeneral = props.datosCoropletas.reduce((a, b) => a + (parseInt(b.total) || 0), 0)
  if (totalGeneral === 0) return

  const icon = L.divIcon({
    html: `
      <div class="c-bubble state-bubble">
        <span class="label">TOTAL PADRÓN</span>
        <span class="count">${totalGeneral.toLocaleString()}</span>
        <span class="instruction">Selecciona un municipio</span>
      </div>`,
    className: 'c-icon-state',
    iconSize: [120, 120],
  })

  L.marker([19.35, -99.63], { icon, interactive: false }).addTo(state.pointsLayer)
}

const _clearAll = () => {
  state.clusterLayer.clearLayers()
  state.pointsLayer.clearLayers()
  _prevRegistros = []
  _markerMap.clear()
}

const _renderClusters = () => {
  state.pointsLayer.clearLayers()
  state.clusterLayer.clearLayers()

  const markersParaAgrupar = []

  for (let i = 0; i < props.registros.length; i++) {
    const r = props.registros[i]
    const coords = getCoords(r)
    if (!coords) continue

    // 1. Si el backend YA mandó el cluster armado (ej. count = 50)
    if (r.count && parseInt(r.count) > 1) {
      const marker = L.marker(coords, { icon: getClusterIcon(r.count) })

      marker.on('click', () => {
        emit('cluster-click', r)
        state.map.flyTo(coords, ZOOM_PUNTO, { duration: 1.0 })
      })

      marker.addTo(state.pointsLayer) // Se pinta directo porque ya viene agrupado
    }
    // 2. Si el backend mandó un registro individual (count = 1 o vacío)
    else {
      const marker = L.marker(coords, {
        icon: L.divIcon({
          className: 'p-icon',
          html: '<div class="p-dot"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      })

      marker.on('click', () => emit('select', r))
      markersParaAgrupar.push(marker)
    }
  }

  // 3. ¡LA MAGIA OCURRE AQUÍ! Le damos todos los puntos sueltos al
  // plugin de Leaflet para que él haga los cálculos y pinte los globos grandes.
  if (markersParaAgrupar.length > 0) {
    state.clusterLayer.addLayers(markersParaAgrupar)
  }
}

const _renderPuntosDiff = () => {
  state.pointsLayer.clearLayers()

  const nuevos = props.registros
  const prevMap = new Map(_prevRegistros.map((r) => [r.id, r]))
  const newMap = new Map(nuevos.map((r) => [r.id, r]))

  let cambios = 0
  for (const id of newMap.keys()) {
    if (!prevMap.has(id)) cambios++
  }
  for (const id of prevMap.keys()) {
    if (!newMap.has(id)) cambios++
  }

  // Si más del 50% cambió → render completo
  if (cambios > nuevos.length * 0.5) {
    state.clusterLayer.clearLayers()
    _markerMap.clear()
    const markers = _crearMarkers(nuevos)
    if (markers.length) state.clusterLayer.addLayers(markers)
    _prevRegistros = nuevos
    return
  }

  // Render diferencial: solo añade/quita lo necesario
  for (const [id] of prevMap) {
    if (!newMap.has(id)) {
      const m = _markerMap.get(id)
      if (m) {
        state.clusterLayer.removeLayer(m)
        _markerMap.delete(id)
      }
    }
  }

  const toAdd = []
  for (const [id, r] of newMap) {
    if (!prevMap.has(id)) toAdd.push(r)
  }

  const markers = _crearMarkers(toAdd)
  if (markers.length) state.clusterLayer.addLayers(markers)
  _prevRegistros = nuevos
}

const _crearMarkers = (registros) => {
  const markers = []
  for (let i = 0; i < registros.length; i++) {
    const r = registros[i]
    const coords = getCoords(r)
    if (!coords) continue

    const m = L.marker(coords, {
      icon: L.divIcon({
        className: 'p-icon',
        html: '<div class="p-dot"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
    }).on('click', () => emit('select', r))

    _markerMap.set(r.id, m)
    markers.push(m)
  }
  return markers
}

const aplicarRestriccionesMovimiento = () => {
  if (!state.map) return

  // Paneo y zoom libre siempre, sin importar el modo
  state.map.dragging.enable()
  state.map.scrollWheelZoom.enable()
  state.map.doubleClickZoom.enable()

  // Quitamos la restricción de bordes cerrados
  state.map.setMaxBounds(null)

  // Límites generales para no alejarse más allá del estado ni acercarse demasiado
  state.map.setMinZoom(8)
  state.map.setMaxZoom(22)
}

// ── 8. API Expuesta al Padre ───────────────────────────────────────────────
defineExpose({
  /**
   * Vuela con animación suave al bounding box del municipio seleccionado.
   * Usa el Map de capas construido en onEachFeature para acceso O(1).
   */
  zoomToMunicipio: (nombre) => {
    const layer = _municipioLayerMap.get(normalize(nombre))
    if (!layer || !state.map) return
    state.map.flyToBounds(layer.getBounds(), { padding: [30, 30], duration: 1.0, maxZoom: 13 })
  },

  /**
   * Vuela a las coordenadas de un registro específico (útil para resultados de búsqueda).
   */
  flyToRegistro: (lat, lng, zoom = 15) => {
    if (!state.map) return
    state.map.flyTo([lat, lng], zoom, { duration: 1.0 })
  },

  resetView: () => {
    if (!state.map) return
    state.map.scrollWheelZoom.disable()
    state.map.dragging.enable()
    state.map.setMaxBounds(null)
    state.map.setMinZoom(8)
    state.map.setMaxZoom(18)
    state.map.flyTo([19.35, -99.63], 9, { duration: 1.2 })
  },
})

// ── 9. Watchers y Ciclo de Vida ────────────────────────────────────────────
watch(() => props.registros, renderThrottled, { deep: false })

watch([() => props.datosCoropletas, () => props.municipioFiltro], () => {
  state.municipiosLayer?.setStyle(getMunicipioStyle)
})

watch(
  () => props.modo,
  () => {
    aplicarRestriccionesMovimiento()
    renderMarkers()
  },
)

onMounted(async () => {
  await nextTick()
  initMap()
  aplicarRestriccionesMovimiento()
  renderMarkers()
})

onUnmounted(() => {
  clearTimeout(_renderTimer)
  _markerMap.clear()
  _municipioLayerMap.clear()
  state.map?.remove()
})
</script>

<style>
path.mun-path {
  transition:
    fill 0.3s ease,
    fill-opacity 0.3s ease;
}

.map-tooltip {
  background: #0f172a !important;
  color: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 6px 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2) !important;
}
.map-tooltip::before {
  border-top-color: #0f172a !important;
}

/* Cluster */
.c-bubble {
  width: 35px;
  height: 35px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  transition: all 0.2s ease;
}
.c-bubble:hover:not(.state-bubble) {
  cursor: pointer;
  background: #177da6;
  transform: scale(1.15);
  box-shadow: 0 6px 20px rgba(23, 125, 166, 0.6);
  z-index: 1000;
}

/* Burbuja estado */
.state-bubble {
  width: 120px !important;
  height: 120px !important;
  background: rgba(1, 39, 55, 0.95) !important;
  flex-direction: column;
  animation: pulse-blue 2s infinite;
  border: 4px solid white !important;
}
.state-bubble .label {
  font-size: 8px;
  opacity: 0.7;
  letter-spacing: 1px;
}
.state-bubble .count {
  font-size: 22px;
  margin: 2px 0;
}
.state-bubble .instruction {
  font-size: 9px;
  color: #fbbf24;
  margin-top: 5px;
  text-align: center;
  font-weight: 400;
}

@keyframes pulse-blue {
  0% {
    box-shadow: 0 0 0 0 rgba(1, 39, 55, 0.4);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(1, 39, 55, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(1, 39, 55, 0);
  }
}

.c-icon,
.p-icon,
.c-icon-state {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Puntos individuales */
.p-dot {
  width: 10px;
  height: 10px;
  background: #0f172a;
  border: 1.5px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  display: block;
}
.p-dot:hover {
  cursor: pointer;
  background: #177da6;
  transform: scale(1.2);
  transition: all 0.2s ease;
}
</style>
