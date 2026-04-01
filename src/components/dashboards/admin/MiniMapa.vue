<template>
  <div class="space-y-3">
    <!-- Buscador unificado: CP numérico o nombre de municipio -->
    <div class="flex gap-2">
      <div class="relative flex-1 group">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none"
          :size="14"
        />
        <input
          v-model="queryBusqueda"
          @keyup.enter="buscarLugar"
          type="text"
          inputmode="text"
          maxlength="60"
          placeholder="CP (52000) o municipio..."
          class="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />

        <!-- Sugerencias de municipios -->
        <Transition name="slide-fade">
          <div
            v-if="sugerencias.length"
            class="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[700] max-h-44 overflow-y-auto"
          >
            <button
              v-for="s in sugerencias"
              :key="s"
              @mousedown.prevent="elegirSugerencia(s)"
              class="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary flex items-center gap-2 border-b border-slate-50 last:border-0 transition-colors"
            >
              <MapPin :size="11" class="text-slate-300 shrink-0" />
              {{ s }}
            </button>
          </div>
        </Transition>

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
        title="Usar mi ubicación GPS"
      >
        <Navigation v-if="!gpsLoading" :size="16" />
        <Loader2 v-else class="animate-spin text-primary" :size="16" />
      </button>
    </div>

    <!-- Pill de CP detectado -->
    <Transition name="slide-fade">
      <div v-if="cpDetectadoActual" class="flex items-center gap-2">
        <div
          class="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black"
        >
          <Hash :size="11" />
          CP {{ cpDetectadoActual }}
          <span class="opacity-60 font-normal">— detectado</span>
        </div>
      </div>
    </Transition>

    <!-- Mapa -->
    <div
      class="relative w-full h-64 rounded-3xl overflow-hidden border border-slate-200 shadow-inner"
    >
      <div :id="mapId" class="w-full h-full bg-[#f8fafc]"></div>

      <!-- Indicador de detección CP -->
      <Transition name="fade">
        <div
          v-if="detectandoCP"
          class="absolute bottom-3 left-3 z-[500] bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm border border-slate-100"
        >
          <div
            class="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"
          ></div>
          <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest"
            >Detectando CP...</span
          >
        </div>
      </Transition>

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
import { ref, onMounted, onUnmounted, watch, markRaw, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Navigation, Loader2, AlertCircle, MapPinOff, MapPin, Hash } from 'lucide-vue-next'

import dataCP from '@/data/cp_centroids.json'
import dataMun from '@/data/edomex_municipios.json'
import dataEnt from '@/data/edomex_estado.json'

const props = defineProps({
  mapId: { type: String, required: true },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  zoom: { type: Number, default: 10 },
  municipioSeleccionado: { type: String, default: '' },
})

const emit = defineEmits(['update:location'])

// ── Estado ────────────────────────────────────────────────────────────────────
const queryBusqueda = ref('')
const gpsLoading = ref(false)
const fueraDeLimites = ref(false)
const errorBusqueda = ref(null)
const detectandoCP = ref(false)
const cpDetectadoActual = ref('')

let map = null
let marker = null
let municipiosLayer = null
let _errorTimer = null

// ── Índice de CPs por bucket de latitud (construido una vez al montar) ────────
// Divide los CPs en franjas de 1° lat → búsqueda O(n/buckets) en lugar de O(n)
let cpIndex = null

const construirIndiceCPs = () => {
  const idx = {}
  for (const item of dataCP) {
    const bucket = Math.floor(item.lat)
    if (!idx[bucket]) idx[bucket] = []
    idx[bucket].push(item)
  }
  return idx
}

/**
 * Encuentra el CP más cercano con corrección de longitud por coseno.
 * Radio máximo 0.15° (~16 km) — amplio para zonas rurales del Edomex.
 */
const encontrarCPMasCercano = (lat, lon) => {
  if (!cpIndex) return ''

  const cosLat = Math.cos((lat * Math.PI) / 180)
  const buckets = [Math.floor(lat) - 1, Math.floor(lat), Math.floor(lat) + 1]
  let mejorCP = ''
  let mejorDist = 0.15 // radio máximo en grados

  for (const b of buckets) {
    const grupo = cpIndex[b]
    if (!grupo) continue
    for (const item of grupo) {
      const dlat = item.lat - lat
      const dlng = (item.lon - lon) * cosLat
      const d = Math.sqrt(dlat * dlat + dlng * dlng)
      if (d < mejorDist) {
        mejorDist = d
        mejorCP = item.cp
      }
    }
  }
  return mejorCP
}

// ── Sugerencias de municipio ──────────────────────────────────────────────────
const listaNombresMunicipios = dataMun.features.map((f) => f.properties.nombre)

const sugerencias = computed(() => {
  const q = queryBusqueda.value.trim().toLowerCase()
  // Solo texto, no numérico puro
  if (!q || /^\d+$/.test(q) || q.length < 2) return []
  return listaNombresMunicipios.filter((n) => n.toLowerCase().includes(q)).slice(0, 6)
})

// ── Estilos de municipios ─────────────────────────────────────────────────────
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

// ── Ray casting: ¿está el punto dentro del polígono del estado? ───────────────
const esPuntoEnEdomex = (latlng) => {
  let inside = false
  const x = latlng.lng
  const y = latlng.lat
  dataEnt.features.forEach((feature) => {
    const coords = feature.geometry.coordinates
    const checkPoly = (poly) => {
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0],
          yi = poly[i][1]
        const xj = poly[j][0],
          yj = poly[j][1]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
      }
    }
    if (feature.geometry.type === 'Polygon') coords.forEach(checkPoly)
    else if (feature.geometry.type === 'MultiPolygon') coords.forEach((p) => p.forEach(checkPoly))
  })
  return inside
}

// ── Inicializar mapa ──────────────────────────────────────────────────────────
const initMap = () => {
  if (map) return
  cpIndex = construirIndiceCPs() // índice rápido de CPs

  const startLat = props.lat || 19.35
  const startLng = props.lng || -99.63

  map = markRaw(
    L.map(props.mapId, { zoomControl: false, attributionControl: false, minZoom: 8 }),
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

  // Estado inicial
  if (!props.lat && props.municipioSeleccionado) {
    sincronizarConMunicipio(props.municipioSeleccionado)
  } else if (props.lat && props.lng) {
    // Detectar CP de las coords iniciales (sin bloquear render)
    requestAnimationFrame(() => {
      const cp = encontrarCPMasCercano(props.lat, props.lng)
      if (cp) cpDetectadoActual.value = cp
    })
  }
}

// ── Núcleo: procesar cualquier cambio de coordenadas ─────────────────────────
const procesarCambioUbicacion = (lat, lng) => {
  const nLat = parseFloat(lat.toFixed(7))
  const nLng = parseFloat(lng.toFixed(7))
  const punto = L.latLng(nLat, nLng)

  if (!esPuntoEnEdomex(punto)) {
    fueraDeLimites.value = true
    setTimeout(() => {
      fueraDeLimites.value = false
      marker.setLatLng([props.lat || 19.35, props.lng || -99.63])
    }, 1500)
    return
  }

  fueraDeLimites.value = false
  marker.setLatLng([nLat, nLng])

  // Detectar municipio bajo el punto
  let municipioDetectado = ''
  municipiosLayer.eachLayer((layer) => {
    if (layer.getBounds().contains(punto)) {
      municipioDetectado = layer.feature.properties.nombre
    }
  })

  // Detectar CP — no bloqueante
  detectandoCP.value = true
  requestAnimationFrame(() => {
    const cp = encontrarCPMasCercano(nLat, nLng)
    cpDetectadoActual.value = cp
    detectandoCP.value = false

    emit('update:location', {
      lat: nLat,
      lng: nLng,
      municipio: municipioDetectado,
      cp,
    })
  })
}

// ── Sincronizar vista cuando cambia el municipio seleccionado ─────────────────
const sincronizarConMunicipio = (nombreMun) => {
  if (!nombreMun || !municipiosLayer || !map) return

  municipiosLayer.setStyle(getMunicipioStyle)

  const layer = municipiosLayer
    .getLayers()
    .find((l) => l.feature.properties.nombre?.toUpperCase() === nombreMun.toUpperCase())

  if (layer) {
    const bounds = layer.getBounds()
    map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 14 })

    if (!props.lat) {
      const centro = bounds.getCenter()
      procesarCambioUbicacion(centro.lat, centro.lng)
    }
  }
}

// ── Búsqueda: CP (5 dígitos) o nombre de municipio ───────────────────────────
const buscarLugar = () => {
  const q = queryBusqueda.value.trim()
  if (!q) return
  clearError()

  // CP exacto (5 dígitos)
  if (/^\d{5}$/.test(q)) {
    const cpMatch = dataCP.find((item) => item.cp === q)
    if (cpMatch) {
      cpDetectadoActual.value = q
      const nLat = parseFloat(cpMatch.lat.toFixed(7))
      const nLng = parseFloat(cpMatch.lon.toFixed(7))
      const punto = L.latLng(nLat, nLng)

      marker.setLatLng([nLat, nLng])
      map.flyTo([nLat, nLng], 15)

      // 1. Detectar el municipio bajo las coordenadas del CP
      let municipioDetectado = ''
      if (municipiosLayer) {
        municipiosLayer.eachLayer((layer) => {
          if (layer.getBounds().contains(punto)) {
            municipioDetectado = layer.feature.properties.nombre
          }
        })
      }

      // 2. Emitir el municipio detectado en lugar de un string vacío
      emit('update:location', {
        lat: nLat,
        lng: nLng,
        municipio: municipioDetectado, // <- AHORA SÍ ENVIAMOS EL MUNICIPIO
        cp: q,
      })
    } else {
      mostrarError('CP no encontrado en el catálogo')
    }
    queryBusqueda.value = ''
    return
  }

  // Nombre de municipio (texto)
  const munMatch = dataMun.features.find((f) =>
    f.properties.nombre?.toUpperCase().includes(q.toUpperCase()),
  )
  if (munMatch) {
    const bounds = L.geoJSON(munMatch).getBounds()
    const centro = bounds.getCenter()
    map.flyToBounds(bounds, { padding: [30, 30] })
    procesarCambioUbicacion(centro.lat, centro.lng)
    queryBusqueda.value = ''
  } else {
    mostrarError('Lugar no encontrado')
  }
}

const elegirSugerencia = (nombre) => {
  queryBusqueda.value = nombre
  buscarLugar()
}

const mostrarError = (msg) => {
  clearError()
  errorBusqueda.value = msg
  _errorTimer = setTimeout(() => (errorBusqueda.value = null), 3000)
}

const clearError = () => {
  clearTimeout(_errorTimer)
  errorBusqueda.value = null
}

// ── GPS ───────────────────────────────────────────────────────────────────────
const obtenerUbicacionActual = () => {
  if (!navigator.geolocation) return mostrarError('GPS no disponible en este dispositivo')
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      procesarCambioUbicacion(pos.coords.latitude, pos.coords.longitude)
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 16)
      gpsLoading.value = false
    },
    () => {
      mostrarError('No se pudo obtener la ubicación GPS')
      gpsLoading.value = false
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(() => props.municipioSeleccionado, sincronizarConMunicipio)

watch(
  () => [props.lat, props.lng],
  ([newLat, newLng]) => {
    if (!map || !marker || !newLat || !newLng) return
    marker.setLatLng([newLat, newLng])
    map.panTo([newLat, newLng])
    // Re-detectar CP si las coords vienen desde fuera del mapa
    requestAnimationFrame(() => {
      const cp = encontrarCPMasCercano(newLat, newLng)
      if (cp && cp !== cpDetectadoActual.value) {
        cpDetectadoActual.value = cp
      }
    })
  },
)

onMounted(() => setTimeout(initMap, 300))
onUnmounted(() => {
  clearTimeout(_errorTimer)
  map?.remove()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.18s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.18s ease-in;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(6px);
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
}
:deep(.marker-pin:active) {
  cursor: grabbing;
  transform: scale(1.2);
}
</style>
