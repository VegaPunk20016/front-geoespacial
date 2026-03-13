<template>
  <div ref="mapContainer" class="w-full h-full bg-[#f8fafc]"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, shallowRef, nextTick } from 'vue'
import L from 'leaflet'
import proj4 from 'proj4'

import dataMun from '@/data/edomex_municipios.json'
import dataEnt from '@/data/edomex_estado.json'

import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'

const props = defineProps([
  'registros',
  'modo',
  'datosCoropletas',
  'seleccionado',
  'municipioFiltro',
])
const emit = defineEmits(['select', 'view-change', 'municipio-click'])

const mapContainer = ref(null)
const map = shallowRef(null)
const clusterLayer = shallowRef(null)
const pointsLayer = shallowRef(null)
const municipiosLayer = shallowRef(null)

proj4.defs(
  'EPSG:6372',
  '+proj=lcc +lat_1=17.5 +lat_2=29.5 +lat_0=12 +lon_0=-102 +x_0=2500000 +y_0=0 +ellps=GRS80 +units=m +no_defs',
)
const toGPS = (c) => {
  const p = proj4('EPSG:6372', 'EPSG:4326', c)
  return [p[1], p[0]]
}

const getStyle = (feature) => {
  const name = feature.properties.nombre.toUpperCase()
  const filter = props.municipioFiltro?.toUpperCase()
  const isSelected = name === filter

  let intensity = 0
  if (props.datosCoropletas?.length) {
    const data = props.datosCoropletas.find((d) => d.municipio.toUpperCase() === name)
    if (data) {
      const max = Math.max(...props.datosCoropletas.map((d) => parseInt(d.total)))
      intensity = parseInt(data.total) / max
    }
  }

  return {
    color: '#0f172a',
    weight: isSelected ? 3 : 0.4,
    fillColor: '#2563eb',
    fillOpacity: isSelected ? 0.35 : intensity * 0.6,
    opacity: isSelected ? 1 : 0.2,
  }
}

const initMap = () => {
  map.value = L.map(mapContainer.value, { zoomControl: false, preferCanvas: true }).setView(
    [19.35, -99.63],
    9,
  )

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map.value)

  clusterLayer.value = L.markerClusterGroup({
    iconCreateFunction: (c) =>
      L.divIcon({
        html: `<div class="c-bubble">${c.getChildCount() > 999 ? (c.getChildCount() / 1000).toFixed(1) + 'k' : c.getChildCount()}</div>`,
        className: 'c-icon',
        iconSize: [35, 35],
      }),
  }).addTo(map.value)

  pointsLayer.value = L.layerGroup().addTo(map.value)

  map.value.on('moveend', () => {
    const b = map.value.getBounds()
    emit('view-change', {
      min_lat: b.getSouth(),
      max_lat: b.getNorth(),
      min_lng: b.getWest(),
      max_lng: b.getEast(),
      zoom: map.value.getZoom(),
    })
  })

  L.geoJSON(dataEnt, {
    coordsToLatLng: toGPS,
    style: { color: '#0f172a', weight: 4, fillOpacity: 0, interactive: false },
  }).addTo(map.value)

  municipiosLayer.value = L.geoJSON(dataMun, {
    coordsToLatLng: toGPS,
    style: getStyle,
    onEachFeature: (f, l) => {
      l.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        emit('municipio-click', { nombre: f.properties.nombre })
      })
    },
  }).addTo(map.value)
}

const renderData = () => {
  clusterLayer.value.clearLayers()
  pointsLayer.value.clearLayers()

  if (props.modo === 'clusters') {
    props.registros.forEach((r) => {
      const m = L.marker([r.lat, r.lng], {
        icon: L.divIcon({
          html: `<div class="c-bubble">${r.count > 999 ? (r.count / 1000).toFixed(1) + 'k' : r.count}</div>`,
          className: 'c-icon',
          iconSize: [35, 35],
        }),
      })
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        map.value.flyTo([r.lat, r.lng], map.value.getZoom() + 2)
      })
      pointsLayer.value.addLayer(m)
    })
  } else {
    const markers = props.registros
      .map((r) => {
        if (!r.latitud) return null
        const m = L.marker([r.latitud, r.longitud], {
          icon: L.divIcon({
            html: '<div class="p-dot"></div>',
            className: 'p-icon',
            iconSize: [10, 10],
          }),
        })
        m.on('click', () => emit('select', r))
        return m
      })
      .filter((m) => m)
    clusterLayer.value.addLayers(markers)
  }
}

watch(() => props.registros, renderData, { deep: true })
watch(
  () => props.municipioFiltro,
  () => {
    municipiosLayer.value.setStyle(getStyle)
    if (props.municipioFiltro) {
      municipiosLayer.value.eachLayer((l) => {
        if (l.feature.properties.nombre.toUpperCase() === props.municipioFiltro.toUpperCase()) {
          map.value.fitBounds(l.getBounds(), { padding: [40, 40] })
        }
      })
    }
  },
)
watch(
  () => props.datosCoropletas,
  () => municipiosLayer.value.setStyle(getStyle),
)
watch(
  () => props.seleccionado,
  (n) => {
    if (n) map.value.flyTo([n.latitud, n.longitud], 18)
  },
)

onMounted(async () => {
  await nextTick()
  initMap()
})
</script>

<style>
.c-bubble {
  width: 35px;
  height: 35px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
  transition: transform 0.2s;
}
.c-bubble:hover {
  transform: scale(1.1);
}
.p-dot {
  width: 10px;
  height: 10px;
  background: #0f172a;
  border: 1.5px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.c-icon,
.p-icon {
  background: transparent;
  border: none;
}
</style>
