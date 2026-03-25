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
  modo: { type: String, default: 'estado' }, // 'estado', 'clusters', 'puntos'
  datosCoropletas: { type: Array, default: () => [] },
  municipioFiltro: { type: String, default: null },
  tieneCoordenadas: { type: Boolean, default: true },
})

const emit = defineEmits(['select', 'view-change', 'municipio-click', 'zoom-nivel'])

// ── 2. Variables de Estado y Utilidades (Cachés) ───────────────────────────
const mapContainer = ref(null)
const state = {
  map: null,
  clusterLayer: null,
  pointsLayer: null,
  municipiosLayer: null,
}

let _renderTimer = null
let _prevRegistros = []
let _markerMap = new Map()
let lastMoveEmit = 0

const normalize = (s) => s?.toUpperCase().trim()

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

const coordsCache = new WeakMap()
const getCoords = (r) => {
  // Nota: Verificamos _coords temporal si tu store lo inyecta, si no, usamos el cache WeakMap
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

  if (esSeleccionado) {
    return { color: '#0f172a', weight: 3, opacity: 1, fillColor: '#1e293b', fillOpacity: 0.5 }
  }

  return {
    color: '#1e4a6e',
    weight: 0.6,
    opacity: 0.6,
    fillColor: '#bfdbfe',
    fillOpacity: 0.45,
    className: 'mun-path',
  }
}

// ── 4. Lógica del Mapa y Renderizado ───────────────────────────────────────
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

  L.geoJSON(dataEnt, {
    style: { color: '#1e293b', weight: 2, fillOpacity: 0, interactive: false },
  }).addTo(state.map)

  state.municipiosLayer = markRaw(
    L.geoJSON(dataMun, {
      style: getMunicipioStyle,
      onEachFeature: (feature, layer) => {
        const nombre = feature.properties.nombre
        layer.bindTooltip('', { className: 'map-tooltip', sticky: true, direction: 'top' })

        layer.on({
          mouseover: (e) => {
            const total = coropletaMap.value[normalize(nombre)] || 0
            layer.setTooltipContent(`
              <div class="font-bold text-xs">${nombre}</div>
              <div class="text-[10px] opacity-80">${total.toLocaleString()} registros</div>
            `)
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e)
            if (props.modo === 'estado' || props.municipioFiltro !== nombre) {
              emit('municipio-click', feature.properties)
            }
          },
        })
      },
    }),
  ).addTo(state.map)

  state.map.on('moveend', handleMoveEnd)
}

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

const renderThrottled = () => {
  clearTimeout(_renderTimer)
  _renderTimer = setTimeout(() => {
    renderMarkers()
  }, 150)
}

const renderMarkers = () => {
  if (!state.map) return

  if (props.modo === 'estado') {
    _renderSuperClusterEstado()
    return
  }

  if (props.modo === 'clusters') {
    _renderClusters()
  } else if (props.modo === 'puntos') {
    _renderPuntosDiff()
  }
}

const _renderSuperClusterEstado = () => {
  _clearAll()
  const centroEstado = [19.35, -99.63]
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

  L.marker(centroEstado, { icon, interactive: false }).addTo(state.pointsLayer)
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

  for (let i = 0; i < props.registros.length; i++) {
    const r = props.registros[i]
    const coords = getCoords(r)
    if (!coords) continue

    const icon = getClusterIcon(r.count || 1)

    const marker = L.marker(coords, { icon })
    marker.on('click', () => {
      state.map.flyTo(coords, ZOOM_PUNTO, { duration: 1.0 })
    })

    marker.addTo(state.pointsLayer)
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

  if (cambios > nuevos.length * 0.5) {
    state.clusterLayer.clearLayers()
    _markerMap.clear()

    const markers = _crearMarkers(nuevos)
    if (markers.length) state.clusterLayer.addLayers(markers)
    _prevRegistros = nuevos
    return
  }

  for (const [id, r] of prevMap) {
    if (!newMap.has(id)) {
      const m = _markerMap.get(id)
      if (m) {
        state.clusterLayer.removeLayer(m)
        _markerMap.delete(id)
      }
    }
  }

  const markers = []
  for (const [id, r] of newMap) {
    if (!prevMap.has(id)) {
      const m = _crearMarkers([r])
      if (m.length) markers.push(...m)
    }
  }

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

// ── 5. Reglas de Movimiento ────────────────────────────────────────────────
const aplicarRestriccionesMovimiento = () => {
  if (!state.map) return

  if (props.modo === 'estado' || !props.municipioFiltro) {
    state.map.dragging.enable()
    state.map.scrollWheelZoom.disable()
    state.map.setMaxBounds(null)

    state.map.setMinZoom(8)
    state.map.setMaxZoom(18)
    return
  }

  const municipioMap = new Map(dataMun.features.map((f) => [normalize(f.properties.nombre), f]))
  const feat = municipioMap.get(normalize(props.municipioFiltro))

  if (feat) {
    const layer = L.geoJSON(feat)
    const bounds = layer.getBounds()

    if (props.modo === 'clusters') {
      state.map.dragging.disable()
      state.map.scrollWheelZoom.disable()
      state.map.doubleClickZoom.disable()

      const fitZoom = state.map.getBoundsZoom(bounds, false, [20, 20])
      state.map.setMinZoom(fitZoom)
      state.map.setMaxZoom(fitZoom)
    } else if (props.modo === 'puntos') {
      state.map.dragging.enable()
      state.map.scrollWheelZoom.enable()
      state.map.doubleClickZoom.enable()

      state.map.setMaxBounds(bounds.pad(0.1))
      state.map.setMinZoom(ZOOM_PUNTO - 1)
      state.map.setMaxZoom(22)
    }
  }
}

// ── 6. API Externa (Expose) ────────────────────────────────────────────────
defineExpose({
  zoomToMunicipio: (nombre) => {
    const layer = state.municipiosLayer
      .getLayers()
      .find((l) => normalize(l.feature.properties.nombre) === normalize(nombre))

    if (layer) state.map.flyToBounds(layer.getBounds(), { padding: [20, 20], duration: 1.0 })
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

// ── 7. Watchers y Ciclo de Vida ────────────────────────────────────────────
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
  if (_renderTimer) clearTimeout(_renderTimer)
  _markerMap.clear()
  state.map?.remove()
})
</script>

<style>
/* Animación suave para los municipios */
path.mun-path {
  transition:
    fill 0.3s ease,
    fill-opacity 0.3s ease;
}

/* Tooltip Elegante */
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

/* Burbujas de Cluster */
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

/* Burbuja Gigante del Estado */
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

/* Iconos Transparentes */
.c-icon,
.p-icon,
.c-icon-state {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Puntos Individuales */
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

.c-bubble:hover:not(.state-bubble) {
  cursor: pointer;
  background: #177da6;
  transform: scale(1.15);
  box-shadow: 0 6px 20px rgba(23, 125, 166, 0.6);
  z-index: 1000;
}
</style>
