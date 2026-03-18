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

const props = defineProps({
  registros: { type: Array, default: () => [] },
  modo: { type: String, default: 'estado' },
  datosCoropletas: { type: Array, default: () => [] },
  municipioFiltro: { type: String, default: null },
  tieneCoordenadas: { type: Boolean, default: true },
})

const emit = defineEmits(['select', 'view-change', 'municipio-click', 'zoom-nivel'])

const mapContainer = ref(null)
const state = { map: null, clusterLayer: null, pointsLayer: null, municipiosLayer: null }

// ── FIX 2a: throttle para renderMarkers ──────────────────────────────────
// Sin throttle: cada cambio de props dispara un render completo
// Con throttle: máximo 1 render cada 200ms aunque lleguen muchos cambios
let _renderTimer = null
const renderThrottled = () => {
  if (_renderTimer) return
  _renderTimer = setTimeout(() => {
    _renderTimer = null
    renderMarkers()
  }, 200)
}

// ── Coropletas ─────────────────────────────────────────────────────────────
const coropletaMap = computed(() => {
  if (!props.datosCoropletas?.length) return {}
  return Object.fromEntries(
    props.datosCoropletas.map((d) => [d.municipio?.toUpperCase().trim(), parseInt(d.total) || 0]),
  )
})

const maxTotal = computed(() => Math.max(...Object.values(coropletaMap.value), 1))

const getMunicipioStyle = (feature) => {
  const nombre = feature.properties.nombre?.toUpperCase().trim()
  const esSeleccionado = props.municipioFiltro?.toUpperCase().trim() === nombre
  const total = coropletaMap.value[nombre] ?? 0
  const ratio = total / maxTotal.value

  if (esSeleccionado) {
    return { color: '#0f172a', weight: 3, opacity: 1, fillColor: '#1e293b', fillOpacity: 0.5 }
  }
  return {
    color: '#1e4a6e',
    weight: 0.6,
    opacity: 0.6,
    fillColor: '#bfdbfe',
    fillOpacity: 0.45,
  }
}

// ── Inicialización ─────────────────────────────────────────────────────────
const initMap = () => {
  if (state.map) return

  state.map = markRaw(
    L.map(mapContainer.value, {
      zoomControl: false,
      preferCanvas: true,
      center: [19.35, -99.63],
      zoom: 9,
    }),
  )

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; INEGI',
    maxZoom: 20,
  }).addTo(state.map)

  state.clusterLayer = markRaw(
    L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      disableClusteringAtZoom: 17,
      chunkedLoading: true, // FIX: no bloquear el hilo principal al agregar markers
      chunkInterval: 100,
      chunkDelay: 50,
      iconCreateFunction: (c) =>
        L.divIcon({
          html: `<div class="c-bubble">${c.getChildCount()}</div>`,
          className: 'c-icon',
          iconSize: [35, 35],
        }),
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
        layer.on({
          click: (e) => {
            L.DomEvent.stopPropagation(e)
            emit('municipio-click', feature.properties)
          },
          mouseover: (e) => {
            if (props.modo === 'estado') e.target.setStyle({ fillOpacity: 0.4 })
          },
          mouseout: (e) => {
            if (props.modo === 'estado') e.target.setStyle(getMunicipioStyle(feature))
          },
        })
      },
    }),
  ).addTo(state.map)

  state.map.on('moveend', handleMoveEnd)
}

const handleMoveEnd = () => {
  const b = state.map.getBounds()
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

// ── FIX 2b: renderizado incremental con diff ──────────────────────────────
// Problema original: clearLayers() + recrear TODOS los markers en cada render
// → con 5000 puntos esto congela la UI 200-500ms en cada movimiento del mapa
//
// Solución: comparar el array nuevo contra el anterior y solo agregar/quitar
// los que cambiaron. Si el cambio es >50% se hace reset completo (más rápido).
let _prevRegistros = []
let _markerMap = new Map() // id → marker (para diff)

const renderMarkers = () => {
  if (!state.map) return
  if (props.modo === 'estado' || !props.registros.length) {
    _clearAll()
    return
  }

  if (props.modo === 'clusters') {
    _renderClusters()
  } else {
    _renderPuntosDiff()
  }
}

const _clearAll = () => {
  state.clusterLayer.clearLayers()
  state.pointsLayer.clearLayers()
  _prevRegistros = []
  _markerMap.clear()
}

const _renderClusters = () => {
  // Clusters del servidor: pocos elementos (<2000), reset completo es rápido
  state.pointsLayer.clearLayers()
  state.clusterLayer.clearLayers()

  props.registros.forEach((r) => {
    const circle = L.circleMarker([r.lat, r.lng], {
      radius: Math.min(5 + Math.sqrt(r.count || 1) * 2, 40),
      fillColor: '#3b82f6',
      color: '#fff',
      weight: 1.5,
      fillOpacity: 0.8,
    })
    circle.addTo(state.pointsLayer)
  })
}

const _renderPuntosDiff = () => {
  const nuevos = props.registros
  const prevIds = new Set(_prevRegistros.map((r) => r.id))
  const nuevosIds = new Set(nuevos.map((r) => r.id))

  // Si el cambio es muy grande → reset completo (más rápido que N operaciones de diff)
  const cambios =
    nuevos.filter((r) => !prevIds.has(r.id)).length +
    _prevRegistros.filter((r) => !nuevosIds.has(r.id)).length

  if (cambios > nuevos.length * 0.5) {
    state.clusterLayer.clearLayers()
    _markerMap.clear()
    const markers = _crearMarkers(nuevos)
    state.clusterLayer.addLayers(markers) // bulk — mucho más rápido que addLayer en loop
    _prevRegistros = nuevos
    return
  }

  // Diff: quitar los que ya no están
  const aQuitar = _prevRegistros.filter((r) => !nuevosIds.has(r.id))
  aQuitar.forEach((r) => {
    const m = _markerMap.get(r.id)
    if (m) {
      state.clusterLayer.removeLayer(m)
      _markerMap.delete(r.id)
    }
  })

  // Agregar los nuevos
  const aAgregar = nuevos.filter((r) => !prevIds.has(r.id))
  const markers = _crearMarkers(aAgregar)
  if (markers.length) state.clusterLayer.addLayers(markers)

  _prevRegistros = nuevos
}

const _crearMarkers = (registros) => {
  const markers = []
  registros.forEach((r) => {
    const lat = parseFloat(r.latitud)
    const lng = parseFloat(r.longitud)
    if (isNaN(lat) || isNaN(lng)) return

    const m = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'p-icon',
        html: '<div class="p-dot"></div>',
        iconSize: [10, 10],
      }),
    }).on('click', () => emit('select', r))

    _markerMap.set(r.id, m)
    markers.push(m)
  })
  return markers
}

// ── API Externa ────────────────────────────────────────────────────────────
defineExpose({
  zoomToMunicipio: (nombre) => {
    const layer = state.municipiosLayer
      .getLayers()
      .find((l) => l.feature.properties.nombre?.toUpperCase() === nombre?.toUpperCase())
    if (layer) state.map.fitBounds(layer.getBounds(), { padding: [20, 20] })
  },
  resetView: () => state.map.flyTo([19.35, -99.63], 9),
})

// ── Watchers ───────────────────────────────────────────────────────────────
// FIX: usar renderThrottled en lugar de renderMarkers directo
watch(() => props.registros, renderThrottled, { deep: false })

watch([() => props.datosCoropletas, () => props.municipioFiltro], () => {
  state.municipiosLayer?.setStyle(getMunicipioStyle)
})

onMounted(async () => {
  await nextTick()
  initMap()
})

onUnmounted(() => {
  if (_renderTimer) clearTimeout(_renderTimer)
  _markerMap.clear()
  state.map?.remove()
})
</script>

<style>
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
}
.c-icon,
.p-icon {
  background: transparent;
  border: none;
}
.p-dot {
  width: 10px;
  height: 10px;
  background: #0f172a;
  border: 1.5px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
