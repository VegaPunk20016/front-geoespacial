<template>
  <div class="w-full h-full relative">
    <div ref="mapContainer" class="w-full h-full bg-[#f8fafc] outline-none"></div>

    <div class="absolute bottom-24 right-4 z-[1000] flex flex-col gap-2">
      <button
        @click="zoomIn"
        class="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-600 hover:text-[#177DA6] transition-all hover:shadow-xl border border-gray-100 active:scale-90"
        title="Aumentar zoom"
      >
        <Plus :size="20" />
      </button>
      <button
        @click="zoomOut"
        class="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-600 hover:text-[#177DA6] transition-all hover:shadow-xl border border-gray-100 active:scale-90"
        title="Disminuir zoom"
      >
        <Minus :size="20" />
      </button>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch, markRaw, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import { Plus, Minus } from 'lucide-vue-next'

// Datos geográficos y constantes
import dataMun from '@/data/edomex_municipios.json'
import dataEnt from '@/data/edomex_estado.json'
import seccionesUrl from '@/data/secciones_mexico_leaflet.geojson?url'
import { ZOOM_MUNICIPIO, ZOOM_PUNTO } from '@/utils/mapConstants'
import { useMunicipios } from '@/composables/useMunicipios'

const { normalizar } = useMunicipios()

// ── 1. Props y Emits ───────────────────────────────────────────────────────
const props = defineProps({
  registros: { type: Array, default: () => [] },
  modo: { type: String, default: 'estado' },
  datosCoropletas: { type: Array, default: () => [] },
  municipioFiltro: { type: String, default: null },
  tieneCoordenadas: { type: Boolean, default: true },
})

const emit = defineEmits([
  'select',
  'view-change',
  'municipio-click',
  'seccion-click', // Nuevo emit para secciones
  'zoom-nivel',
  'cluster-click',
])

// ── 2. Estado Interno ──────────────────────────────────────────────────────
const mapContainer = ref(null)
const state = {
  map: null,
  clusterLayer: null,
  pointsLayer: null,
  municipiosLayer: null,
}

const _municipioLayerMap = new Map()
const capaSecciones = ref(null)
let _renderTimer = null
let _prevRegistros = []
let _markerMap = new Map()
let lastMoveEmit = 0

// Tracking de selección
let _highlightedMarker = null
let _highlightedId = null

// ── 3. Helpers y Lógica de Carga ───────────────────────────────────────────

const cargarGeoJSONSecciones = async () => {
  try {
    const response = await fetch(seccionesUrl)
    return await response.json()
  } catch (error) {
    console.error('Error cargando el GeoJSON de secciones:', error)
    return null
  }
}

const normalizarParaMatch = (str) => {
  if (!str) return ''
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// ── 4. Computadas ────────────────────────────────────────────────────────────

const coropletaMap = computed(() => {
  if (!props.datosCoropletas?.length) return {}
  return props.datosCoropletas.reduce((acc, d) => {
    const llave = d.match_key || normalizarParaMatch(d.municipio)
    if (llave) {
      acc[llave] = (acc[llave] || 0) + (parseInt(d.total) || 0)
    }
    return acc
  }, {})
})

const maxTotal = computed(() => {
  const valores = Object.values(coropletaMap.value)
  return valores.length > 0 ? Math.max(...valores) : 1
})

// ── 5. Lógica de Secciones ───────────────────────────────────────────────────

const limpiarSecciones = () => {
  if (capaSecciones.value && state.map) {
    state.map.removeLayer(capaSecciones.value)
    capaSecciones.value = null
  }
}

const dibujarSecciones = async (dataResumen) => {
  const seccionesGeoJSON = await cargarGeoJSONSecciones()
  if (!seccionesGeoJSON) return

  limpiarSecciones()

  if (!dataResumen.hay_secciones || !dataResumen.secciones) return

  const seccionesData = dataResumen.secciones

  capaSecciones.value = L.geoJSON(seccionesGeoJSON, {
    filter: (feature) => {
      const id = String(feature.properties.seccion)
      return Object.prototype.hasOwnProperty.call(seccionesData, id)
    },
    style: () => ({
      fillColor: '#177DA6',
      weight: 1.5,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.5,
    }),
    onEachFeature: (feature, layer) => {
      const numSeccion = String(feature.properties.seccion)
      const info = seccionesData[numSeccion]

      layer.on({
        mouseover: (e) => e.target.setStyle({ fillOpacity: 0.8, weight: 3 }),
        mouseout: (e) => e.target.setStyle({ fillOpacity: 0.5, weight: 1.5 }),
        click: (e) => {
          L.DomEvent.stopPropagation(e)
          emit('seccion-click', {
            seccion: numSeccion,
            detalles: info.detalles,
            meta: info.meta,
          })
        },
      })
    },
  }).addTo(state.map)

  const bounds = capaSecciones.value.getBounds()
  if (bounds.isValid()) {
    state.map.fitBounds(bounds, { padding: [20, 20] })
  }
}

const getMunicipioStyle = (feature) => {
  const nombreGeoLimpio = normalizarParaMatch(feature.properties.nombre)
  const total = coropletaMap.value[nombreGeoLimpio] || 0
  const esSeleccionado =
    props.municipioFiltro && normalizarParaMatch(props.municipioFiltro) === nombreGeoLimpio

  if (esSeleccionado) {
    return { color: '#0f172a', weight: 3, opacity: 1, fillColor: '#177DA6', fillOpacity: 0.7 }
  }

  if (total > 0) {
    const ratio = Math.min(total / maxTotal.value, 1)
    return {
      color: '#1e4a6e',
      weight: 0.6,
      opacity: 0.6,
      fillColor: '#177DA6',
      fillOpacity: 0.15 + ratio * 0.55,
      className: 'mun-path',
    }
  }

  return {
    color: '#1e4a6e',
    weight: 0.6,
    opacity: 0.6,
    fillColor: '#bfdbfe',
    fillOpacity: 0.2,
    className: 'mun-path',
  }
}

// ── 6. Iconos y Marcadores ───────────────────────────────────────────────────

const getClusterIcon = (count) => {
  return L.divIcon({
    html: `<div class="c-bubble">${count}</div>`,
    className: 'c-icon',
    iconSize: [35, 35],
  })
}

const ICON_NORMAL = () =>
  L.divIcon({
    className: 'p-icon',
    html: '<div class="p-dot"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })

const ICON_HIGHLIGHT = () =>
  L.divIcon({
    className: 'p-icon',
    html: '<div class="p-dot p-dot--highlight"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

const getCoords = (r) => {
  const lat = Number(r.lat ?? r.latitud)
  const lng = Number(r.lng ?? r.longitud)
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null
}

const zoomIn = () => state.map?.zoomIn()
const zoomOut = () => state.map?.zoomOut()

// ── 7. Inicialización del Mapa ──────────────────────────────────────────────

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
      scrollWheelZoom: true, // Habilitamos el scroll
      wheelDebounceTime: 150, // Evita saltos bruscos
      wheelPxPerZoomLevel: 120, // Sensibilidad del scroll
      // ──────────────────
      doubleClickZoom: true,
    }),
  )

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    maxZoom: 22,
    maxNativeZoom: 19,
  }).addTo(state.map)

  state.clusterLayer = markRaw(
    L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: (zoom) => (zoom >= 15 ? 30 : 50),
      iconCreateFunction: (c) => getClusterIcon(c.getChildCount()),
    }),
  ).addTo(state.map)

  state.pointsLayer = markRaw(L.layerGroup()).addTo(state.map)

  state.municipiosLayer = markRaw(
    L.geoJSON(dataMun, {
      style: getMunicipioStyle,
      onEachFeature: (feature, layer) => {
        const nombre = feature.properties.nombre
        const nombreLimpio = normalizarParaMatch(nombre)
        _municipioLayerMap.set(nombreLimpio, layer)

        layer.bindTooltip('', { className: 'map-tooltip', sticky: true })

        layer.on({
          mouseover: () => {
            const total = coropletaMap.value[nombreLimpio] || 0
            layer.setTooltipContent(`
              <div class="font-bold text-xs">${nombre}</div>
              <div class="text-[10px] opacity-80">${total.toLocaleString()} registros</div>
            `)
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e)
            emit('municipio-click', { nombre: nombre })
            state.map.flyToBounds(layer.getBounds(), { padding: [30, 30], duration: 1 })
          },
        })
      },
    }),
  ).addTo(state.map)

  state.map.on('moveend', handleMoveEnd)
}

// ── 8. API Pública (defineExpose) ───────────────────────────────────────────

defineExpose({
  dibujarSecciones,
  limpiarSecciones,
  zoomToMunicipio: (nombre) => {
    const layer = _municipioLayerMap.get(normalizarParaMatch(nombre))
    if (layer) state.map.flyToBounds(layer.getBounds(), { padding: [30, 30] })
  },
  flyToRegistro: (lat, lng, zoom = 15) => {
    state.map?.flyTo([lat, lng], zoom)
  },
  resetView: () => {
    state.map?.flyTo([19.35, -99.63], 9)
  },
  highlightRegistro: (id) => {
    if (_highlightedMarker) _highlightedMarker.setIcon(ICON_NORMAL())
    const m = _markerMap.get(id)
    if (m) {
      m.setIcon(ICON_HIGHLIGHT())
      _highlightedMarker = m
      _highlightedId = id
    }
  },
})

// ── 9. Renderizado y Watchers ───────────────────────────────────────────────

const handleMoveEnd = () => {
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

const renderMarkers = () => {
  if (!state.map) return
  _clearAll()

  if (props.modo === 'estado') {
    const totalGeneral = props.datosCoropletas.reduce((a, b) => a + (parseInt(b.total) || 0), 0)
    if (totalGeneral === 0) return
    const icon = L.divIcon({
      html: `<div class="c-bubble state-bubble"><span class="count">${totalGeneral.toLocaleString()}</span></div>`,
      className: 'c-icon-state',
      iconSize: [120, 120],
    })
    L.marker([19.35, -99.63], { icon, interactive: false }).addTo(state.pointsLayer)
  } else {
    _renderElementosMapa()
  }
}

const _renderElementosMapa = () => {
  const markers = []
  for (let r of props.registros) {
    const coords = getCoords(r)
    if (!coords) continue
    if (r.count && props.modo === 'clusters') {
      const m = L.marker(coords, { icon: getClusterIcon(r.count) })
      m.on('click', () => {
        emit('cluster-click', r)
        state.map.flyTo(coords, ZOOM_PUNTO)
      })
      m.addTo(state.pointsLayer)
    } else {
      const esDestacado = r.id === _highlightedId
      const m = L.marker(coords, {
        icon: esDestacado ? ICON_HIGHLIGHT() : ICON_NORMAL(),
        zIndexOffset: esDestacado ? 1000 : 0,
      })
      m.on('click', () => _selectMarker(r, m))
      _markerMap.set(r.id, m)
      markers.push(m)
    }
  }
  if (markers.length) state.clusterLayer.addLayers(markers)
}

const _clearAll = () => {
  state.clusterLayer.clearLayers()
  state.pointsLayer.clearLayers()
  _markerMap.clear()
}

const _selectMarker = (r, marker) => {
  if (_highlightedMarker) _highlightedMarker.setIcon(ICON_NORMAL())
  marker.setIcon(ICON_HIGHLIGHT())
  _highlightedMarker = marker
  _highlightedId = r.id
  emit('select', r)
}

watch(
  () => props.registros,
  () => {
    clearTimeout(_renderTimer)
    _renderTimer = setTimeout(renderMarkers, 150)
  },
  { deep: false },
)

watch([() => props.datosCoropletas, () => props.municipioFiltro], () => {
  state.municipiosLayer?.setStyle(getMunicipioStyle)
})

watch(() => props.modo, renderMarkers)

onMounted(async () => {
  await nextTick()
  initMap()
  renderMarkers()
})

onUnmounted(() => {
  clearTimeout(_renderTimer)
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
}

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

/* Punto normal */
.p-dot {
  width: 10px;
  height: 10px;
  background: #0f172a;
  border: 1.5px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  display: block;
  transition: all 0.15s ease;
}
.p-dot:hover {
  cursor: pointer;
  background: #177da6;
  transform: scale(1.3);
}

/* Punto seleccionado — azul con pulso */
.p-dot--highlight {
  width: 16px;
  height: 16px;
  background: #177da6;
  border: 2.5px solid white;
  border-radius: 50%;
  display: block;
  animation: pulse-point 1.6s ease-out infinite;
}

@keyframes pulse-point {
  0% {
    box-shadow:
      0 0 0 0 rgba(23, 125, 166, 0.7),
      0 3px 8px rgba(0, 0, 0, 0.35);
  }
  60% {
    box-shadow:
      0 0 0 10px rgba(23, 125, 166, 0),
      0 3px 8px rgba(0, 0, 0, 0.35);
  }
  100% {
    box-shadow:
      0 0 0 0 rgba(23, 125, 166, 0),
      0 3px 8px rgba(0, 0, 0, 0.35);
  }
}
</style>
