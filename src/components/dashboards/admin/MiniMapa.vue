<template>
  <div class="space-y-3">
    <div class="flex gap-2">
      <div class="relative flex-1 group">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
          :size="14"
        />
        <input
          v-model="queryBusqueda"
          @keyup.enter="buscarLugar"
          @input="queryBusqueda = queryBusqueda.replace(/\D/g, '').slice(0, 5)"
          type="text"
          inputmode="numeric"
          maxlength="5"
          placeholder="Buscar Código Postal"
          class="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />

        <Transition name="slide-fade">
          <div
            v-if="errorBusqueda"
            class="absolute -top-10 left-0 bg-red-500 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-xl font-bold flex items-center gap-2 z-[600]"
          >
            <AlertCircle :size="12" /> {{ errorBusqueda }}
          </div>
        </Transition>
      </div>

      <button
        @click="obtenerUbicacionActual"
        :disabled="gpsLoading"
        class="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
      >
        <Navigation v-if="!gpsLoading" :size="16" />
        <Loader2 v-else class="animate-spin text-primary" :size="16" />
      </button>
    </div>

    <div
      class="relative w-full h-64 rounded-3xl overflow-hidden border border-slate-200 shadow-inner group"
    >
      <div :id="mapId" class="w-full h-full bg-[#f8fafc]"></div>

      <Transition name="fade">
        <div
          v-if="fueraDeLimites"
          class="absolute inset-0 z-[500] bg-red-900/10 backdrop-blur-[1px] pointer-events-none flex items-end justify-center pb-4"
        >
          <div
            class="bg-red-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
          >
            <MapPinOff :size="14" /> Fuera de los límites permitidos
          </div>
        </div>
      </Transition>

      <div
        class="absolute top-2 right-2 z-[500] bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[8px] font-black text-slate-400 border uppercase tracking-tighter"
      >
        Motor Geográfico Agnóstico
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, markRaw } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Navigation, Loader2, AlertCircle, MapPinOff } from 'lucide-vue-next'

// Data Geográfica
import dataCP from '@/data/cp_centroids.json'
import dataMun from '@/data/edomex_municipios.json'
import dataEnt from '@/data/edomex_estado.json'

const props = defineProps({
  mapId: { type: String, required: true },
  lat: { type: Number, default: null }, // Cambiado a null para detectar ausencia
  lng: { type: Number, default: null },
  zoom: { type: Number, default: 10 },
  municipioSeleccionado: { type: String, default: '' },
})

const emit = defineEmits(['update:location'])

const queryBusqueda = ref('')
const gpsLoading = ref(false)
const fueraDeLimites = ref(false)
const errorBusqueda = ref(null)

let map = null
let marker = null
let municipiosLayer = null

// --- Estilos de Municipios (Sincronizados con el Dropdown) ---
const getMunicipioStyle = (feature) => {
  const esActivo =
    props.municipioSeleccionado?.toUpperCase() === feature.properties.nombre?.toUpperCase()
  return {
    color: esActivo ? '#0f172a' : '#1e4a6e',
    weight: esActivo ? 2.5 : 0.8,
    opacity: esActivo ? 1 : 0.6,
    fillColor: esActivo ? '#3b82f6' : '#bfdbfe',
    fillOpacity: esActivo ? 0.35 : 0.1,
  }
}

// --- Detección de Punto en Polígono (Ray Casting) ---
const esPuntoEnEdomex = (latlng) => {
  let inside = false
  const x = latlng.lng,
    y = latlng.lat

  // Usamos el GeoJSON del estado completo para validar
  dataEnt.features.forEach((feature) => {
    const coords = feature.geometry.coordinates
    const checkPolygon = (poly) => {
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0],
          yi = poly[i][1]
        const xj = poly[j][0],
          yj = poly[j][1]
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
        if (intersect) inside = !inside
      }
    }
    // Soporte para Polígonos y MultiPolígonos
    if (feature.geometry.type === 'Polygon') coords.forEach(checkPolygon)
    else if (feature.geometry.type === 'MultiPolygon')
      coords.forEach((p) => p.forEach(checkPolygon))
  })
  return inside
}

const encontrarCPMasCercano = (lat, lon) => {
  let cercano = { cp: '', distancia: Infinity }
  dataCP.forEach((item) => {
    const d = Math.sqrt(Math.pow(item.lat - lat, 2) + Math.pow(item.lon - lon, 2))
    if (d < cercano.distancia) cercano = { cp: item.cp, distancia: d }
  })
  return cercano.distancia < 0.04 ? cercano.cp : ''
}

const initMap = () => {
  if (map) return

  // Posición inicial: si no hay lat/lng, usamos el centro del estado
  const startLat = props.lat || 19.35
  const startLng = props.lng || -99.63

  map = markRaw(
    L.map(props.mapId, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 8,
    }),
  ).setView([startLat, startLng], props.zoom)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map)

  municipiosLayer = L.geoJSON(dataMun, {
    style: getMunicipioStyle,
    onEachFeature: (feature, layer) => {
      layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        procesarCambioUbicacion(e.latlng.lat, e.latlng.lng)
      })
    },
  }).addTo(map)

  // Marcador
  const circularIcon = L.divIcon({
    className: 'custom-div-icon',
    html: '<div class="marker-pin"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  marker = L.marker([startLat, startLng], {
    draggable: true,
    icon: circularIcon,
    zIndexOffset: 1000,
  }).addTo(map)

  marker.on('dragend', () => {
    const { lat, lng } = marker.getLatLng()
    procesarCambioUbicacion(lat, lng)
  })

  map.on('click', (e) => procesarCambioUbicacion(e.latlng.lat, e.latlng.lng))

  if (!props.lat && props.municipioSeleccionado) {
    sincronizarConMunicipio(props.municipioSeleccionado)
  }
}

const procesarCambioUbicacion = (lat, lng) => {
  const nLat = parseFloat(lat.toFixed(7))
  const nLng = parseFloat(lng.toFixed(7))
  const punto = L.latLng(nLat, nLng)

  // Validar si está dentro de los límites reales del polígono Edomex
  if (esPuntoEnEdomex(punto)) {
    fueraDeLimites.value = false
    marker.setLatLng([nLat, nLng])

    // Detectar municipio bajo el punto
    let municipioDetectado = ''
    municipiosLayer.eachLayer((layer) => {
      const bounds = layer.getBounds()
      if (bounds.contains(punto)) {
        municipioDetectado = layer.feature.properties.nombre
      }
    })

    const cpDetectado = encontrarCPMasCercano(nLat, nLng)
    emit('update:location', {
      lat: nLat,
      lng: nLng,
      municipio: municipioDetectado,
      cp: cpDetectado,
    })
  } else {
    fueraDeLimites.value = true
    // Regresar marcador a posición anterior válida
    setTimeout(() => {
      fueraDeLimites.value = false
      marker.setLatLng([props.lat || 19.35, props.lng || -99.63])
    }, 1500)
  }
}

const sincronizarConMunicipio = (nombreMun) => {
  if (!nombreMun || !municipiosLayer) return
  municipiosLayer.setStyle(getMunicipioStyle)

  const layer = municipiosLayer
    .getLayers()
    .find((l) => l.feature.properties.nombre?.toUpperCase() === nombreMun.toUpperCase())

  if (layer) {
    const bounds = layer.getBounds()
    map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 14 })

    // Si no había coordenadas previas (caso agnóstico), movemos el pin al centro del municipio
    if (!props.lat) {
      const centro = bounds.getCenter()
      procesarCambioUbicacion(centro.lat, centro.lng)
    }
  }
}

const buscarLugar = () => {
  const q = queryBusqueda.value.trim()
  if (!q) return
  errorBusqueda.value = null

  if (/^\d{5}$/.test(q)) {
    const cpMatch = dataCP.find((item) => item.cp === q)
    if (cpMatch) moverAMapa(cpMatch.lat, cpMatch.lon, 15)
    else mostrarError('CP no disponible')
    return
  }

  const munMatch = dataMun.features.find((f) =>
    f.properties.nombre?.toUpperCase().includes(q.toUpperCase()),
  )
  if (munMatch) {
    const bounds = L.geoJSON(munMatch).getBounds()
    map.flyToBounds(bounds, { padding: [30, 30] })
    procesarCambioUbicacion(bounds.getCenter().lat, bounds.getCenter().lng)
  } else {
    mostrarError('Lugar no encontrado')
  }
}

const mostrarError = (msg) => {
  errorBusqueda.value = msg
  setTimeout(() => (errorBusqueda.value = null), 3000)
}

const moverAMapa = (lat, lng, zoom) => {
  marker.setLatLng([lat, lng])
  map.flyTo([lat, lng], zoom)
  procesarCambioUbicacion(lat, lng)
}

const obtenerUbicacionActual = () => {
  if (!navigator.geolocation) return alert('GPS no soportado')
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      moverAMapa(pos.coords.latitude, pos.coords.longitude, 16)
      gpsLoading.value = false
    },
    () => {
      alert('Error GPS')
      gpsLoading.value = false
    },
    { enableHighAccuracy: true },
  )
}

watch(() => props.municipioSeleccionado, sincronizarConMunicipio)

watch(
  () => [props.lat, props.lng],
  ([newLat, newLng]) => {
    if (map && marker && newLat && newLng) {
      marker.setLatLng([newLat, newLng])
      map.panTo([newLat, newLng])
    }
  },
)

onMounted(() => setTimeout(initMap, 300))
onUnmounted(() => map?.remove())
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

:deep(.custom-div-icon) {
  background: transparent;
  border: none;
}
:deep(.marker-pin) {
  width: 20px;
  height: 20px;
  background-color: #3b82f6;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
  transition: all 0.2s ease;
  cursor: grab;
  z-index: 1000;
}
:deep(.marker-pin:active) {
  cursor: grabbing;
  transform: scale(1.2);
}
</style>
