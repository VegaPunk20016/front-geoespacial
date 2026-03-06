<template>
  <div class="h-screen bg-gray-50 flex flex-col overflow-hidden relative font-sans">
    <header
      class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm"
    >
      <div class="flex items-center gap-4">
        <button
          @click="volverAlDashboard"
          class="p-2 text-gray-400 hover:text-[#177DA6] hover:bg-[#177DA6]/10 rounded-lg transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-[#012737] flex items-center gap-2">
            <Layers class="w-5 h-5 text-[#177DA6]" />
            Explorador de Padrones IIDESOFT
          </h1>
          <p class="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">
            ID DE CONSULTA: {{ padronId }}
          </p>
        </div>
      </div>

      <div v-if="status === 'success'" class="flex items-center gap-3">
        <div
          class="bg-green-50 text-green-700 px-3 py-1.5 rounded-md text-xs font-bold border border-green-100 flex items-center gap-2"
        >
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          {{ beneficiarios.length }} Registros Sincronizados
        </div>
      </div>
    </header>

    <main class="flex-1 flex overflow-hidden">
      <section class="w-full lg:w-3/5 overflow-y-auto border-r border-gray-200 bg-white z-10">
        <div v-if="status === 'loading'" class="h-full flex flex-col items-center justify-center">
          <Loader2 class="w-10 h-10 text-[#177DA6] animate-spin mb-4" />
          <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Cargando base de datos...
          </p>
        </div>

        <div v-else-if="status === 'success'" class="p-0">
          <table class="w-full text-left border-separate border-spacing-0">
            <thead class="sticky top-0 bg-white z-20 shadow-sm">
              <tr>
                <th
                  class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100"
                >
                  Identificador
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100"
                >
                  Información Principal
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100"
                >
                  Ubicación
                </th>
                <th
                  class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase border-b border-gray-100 text-right"
                >
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="b in beneficiarios"
                :key="b.id"
                class="group hover:bg-[#177DA6]/5 transition-colors cursor-pointer"
                @click="abrirDetalles(b)"
              >
                <td class="px-6 py-4">
                  <span
                    class="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200"
                  >
                    {{ b.clave_unica || 'SIN_CLAVE' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <p
                    class="text-sm font-bold text-[#012737] group-hover:text-[#177DA6] truncate max-w-[200px]"
                  >
                    {{ b.nombre_completo }}
                  </p>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <MapPin class="w-3 h-3 text-[#177DA6]" />
                    {{ b.municipio || 'General' }}
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="p-2 text-gray-300 group-hover:text-[#177DA6] transition-colors">
                    <ChevronRight class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="hidden lg:block lg:w-2/5 bg-gray-100 relative border-l border-gray-200 z-0">
        <div ref="mapContainer" class="absolute inset-0 z-0"></div>

        <div
          v-if="status === 'loading'"
          class="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center"
        >
          <Loader2 class="w-10 h-10 text-[#177DA6] animate-spin mb-4" />
          <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Generando cartografía...
          </p>
        </div>
      </section>
    </main>

    <div v-if="registroSeleccionado" class="fixed inset-0 z-[100] overflow-hidden">
      <div
        class="absolute inset-0 bg-[#012737]/60 transition-opacity"
        @click="registroSeleccionado = null"
      ></div>

      <div class="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div class="w-screen max-w-md">
          <div class="flex h-full flex-col bg-white shadow-2xl">
            <div class="bg-[#012737] p-8 text-white">
              <div class="flex items-start justify-between">
                <h2 class="text-xl font-bold leading-tight">Ficha Técnica</h2>
                <button
                  @click="registroSeleccionado = null"
                  class="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X class="h-6 w-6" />
                </button>
              </div>
              <div class="mt-6 flex items-center gap-3">
                <div
                  class="w-12 h-12 bg-[#177DA6] rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Database class="w-6 h-6 text-white" />
                </div>
                <div>
                  <p class="text-sm font-bold truncate max-w-[280px]">
                    {{ registroSeleccionado.nombre_completo }}
                  </p>
                  <p class="text-[10px] text-[#177DA6] font-mono uppercase tracking-widest">
                    Atributos Dinámicos
                  </p>
                </div>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <div class="space-y-3">
                <div
                  v-for="attr in atributosDinamicos"
                  :key="attr.key"
                  class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <p
                    class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#177DA6]"
                  >
                    {{ attr.key }}
                  </p>
                  <p class="text-sm text-gray-700 font-semibold break-words">
                    {{ attr.value }}
                  </p>
                </div>
              </div>
            </div>

            <div class="p-6 bg-white border-t border-gray-100">
              <div
                v-if="registroSeleccionado.latitud"
                class="bg-[#177DA6]/5 p-4 rounded-xl border border-[#177DA6]/20 flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-[#177DA6] rounded-lg">
                    <Navigation class="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p class="text-[10px] text-gray-400 font-bold uppercase">Ubicación GPS</p>
                    <p class="text-xs font-mono font-bold text-[#177DA6]">
                      {{ registroSeleccionado.latitud }}, {{ registroSeleccionado.longitud }}
                    </p>
                  </div>
                </div>
                <button
                  @click="enfocarEnMapa"
                  class="text-[10px] font-bold text-[#177DA6] hover:underline uppercase"
                >
                  Enfocar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref, watch, shallowRef } from 'vue' // <-- Añadidos watch y shallowRef
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePadronStore } from '@/stores/padronStore'
import {
  ArrowLeft,
  Map,
  Layers,
  Loader2,
  Database,
  MapPin,
  ChevronRight,
  X,
  FileText,
  Navigation,
  Briefcase,
  Map as MapIcon,
} from 'lucide-vue-next'

// --- IMPORTACIONES DE LEAFLET ---
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const route = useRoute()
const router = useRouter()
const padronStore = usePadronStore()
const padronId = computed(() => route.params.id)
const { beneficiarios, status, errorMessage } = storeToRefs(padronStore)

const registroSeleccionado = ref(null)

// --- VARIABLES DEL MAPA ---
const mapContainer = ref(null)
const map = shallowRef(null)
const limitesLayer = shallowRef(null)
const markersLayer = shallowRef(null)

// 🧠 LOGICA UNIVERSAL
const atributosDinamicos = computed(() => {
  if (!registroSeleccionado.value?.datos_generales) return []

  const rawData = registroSeleccionado.value.datos_generales
  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData

  return Object.entries(data).map(([key, value]) => ({
    key: key.replace(/_/g, ' ').toUpperCase(),
    value: value || 'N/A',
  }))
})

// --- FUNCIONES DEL MAPA ---
const inicializarMapa = () => {
  if (!mapContainer.value) return

  // Centro inicial en México
  map.value = L.map(mapContainer.value).setView([23.6345, -102.5528], 5)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map.value)

  markersLayer.value = L.featureGroup().addTo(map.value)
}

// 🗺️ 3. Cargar fronteras municipales (Polígonos)
const cargarFronterasMunicipales = async () => {
  if (!map.value) return

  try {
    // 1. CORRECCIÓN DE RUTA: Directo desde la raíz (Vue detecta la carpeta public automáticamente)
    const response = await fetch('/data/edomex.json')
    const data = await response.json()

    limitesLayer.value = L.geoJSON(data, {
      style: function (feature) {
        return {
          color: '#012737',
          weight: 1.5,
          opacity: 0.6,
          fillColor: '#177DA6',
          fillOpacity: 0.05,
          dashArray: '4 4',
        }
      },
      onEachFeature: function (feature, layer) {
        // OJO: Asegúrate de que tu JSON realmente use 'NOMGEO' como llave para el nombre
        const nombreMunicipio = feature.properties.NOMGEO || 'Municipio'

        // EFECTO 1: TOOLTIP (Aparece al pasar el cursor)
        layer.bindTooltip(
          `
          <div class="text-xs font-bold text-[#012737] uppercase tracking-widest">
            ${nombreMunicipio}
          </div>
        `,
          {
            sticky: true,
            className: 'bg-white/90 backdrop-blur-sm border-0 shadow-sm px-3 py-1.5',
          },
        )

        // EFECTO 2: POPUP (Aparece y se queda fijo al DAR CLIC / SELECCIONAR) ✨
        layer.bindPopup(`
          <div class="text-center p-1">
            <h4 class="text-sm font-black text-[#177DA6] uppercase m-0">${nombreMunicipio}</h4>
            <span class="text-[10px] text-gray-500 uppercase tracking-wider">Límite Municipal</span>
          </div>
        `)

        // Interactividad avanzada
        layer.on({
          mouseover: (e) => {
            const l = e.target
            l.setStyle({ fillOpacity: 0.2, weight: 2 })
          },
          mouseout: (e) => {
            limitesLayer.value.resetStyle(e.target)
          },
          click: (e) => {
            // OPCIONAL: Al seleccionar, la cámara hace zoom automático para encuadrar todo el municipio
            map.value.fitBounds(e.target.getBounds(), { padding: [20, 20], duration: 1 })
          },
        })
      },
    }).addTo(map.value)
  } catch (error) {
    console.warn('No se pudo cargar el archivo GeoJSON de límites:', error)
  }
}

const dibujarMarcadores = () => {
  if (!map.value || !markersLayer.value) return

  markersLayer.value.clearLayers()
  let hasValidCoords = false

  beneficiarios.value.forEach((b) => {
    const lat = parseFloat(b.latitud)
    const lng = parseFloat(b.longitud)

    if (!isNaN(lat) && !isNaN(lng)) {
      hasValidCoords = true

      const customPin = L.divIcon({
        className: 'bg-transparent border-0',
        html: `<div class="w-4 h-4 bg-[#177DA6] rounded-full border-2 border-white shadow-[0_0_10px_rgba(23,125,166,0.5)] hover:scale-150 hover:bg-[#012737] transition-all cursor-pointer"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      const marker = L.marker([lat, lng], { icon: customPin })

      marker.bindTooltip(
        `
        <div class="text-xs font-sans">
          <strong class="text-[#012737] block">${b.nombre_completo}</strong>
          <span class="text-gray-500">${b.municipio || 'S/D'}</span>
        </div>
      `,
        { direction: 'top', offset: [0, -10] },
      )

      // Al dar clic en el pin, abrimos el panel lateral
      marker.on('click', () => {
        abrirDetalles(b)
      })

      markersLayer.value.addLayer(marker)
    }
  })

  // Ajustar zoom para ver todos los puntos
  if (hasValidCoords) {
    map.value.fitBounds(markersLayer.value.getBounds(), { padding: [50, 50] })
  }
}

// --- OBSERVADORES (WATCHERS) ---
// Dibujar cuando lleguen los datos del backend
watch(
  beneficiarios,
  () => {
    if (beneficiarios.value.length > 0) {
      dibujarMarcadores()
    }
  },
  { deep: true },
)

// Volar al punto cuando se selecciona un registro
watch(registroSeleccionado, (nuevoRegistro) => {
  if (!map.value) return

  if (nuevoRegistro && nuevoRegistro.latitud && nuevoRegistro.longitud) {
    const lat = parseFloat(nuevoRegistro.latitud)
    const lng = parseFloat(nuevoRegistro.longitud)
    if (!isNaN(lat) && !isNaN(lng)) {
      map.value.flyTo([lat, lng], 16, { duration: 1.5 })
    }
  } else if (!nuevoRegistro && markersLayer.value && markersLayer.value.getLayers().length > 0) {
    map.value.flyToBounds(markersLayer.value.getBounds(), { padding: [50, 50], duration: 1 })
  }
})

// --- MÉTODOS DE LA UI ---
const enfocarEnMapa = () => {
  if (registroSeleccionado.value && registroSeleccionado.value.latitud) {
    const lat = parseFloat(registroSeleccionado.value.latitud)
    const lng = parseFloat(registroSeleccionado.value.longitud)

    // 🛡️ Filtro de seguridad
    if (!isNaN(lat) && !isNaN(lng)) {
      map.value.flyTo([lat, lng], 18, { duration: 1 })
    } else {
      console.warn('Este registro no tiene coordenadas válidas para enfocar.')
    }
  }
}
const cargarDatos = () => {
  if (padronId.value) padronStore.fetchBeneficiarios(padronId.value)
}

const abrirDetalles = (reg) => {
  registroSeleccionado.value = reg
}

const volverAlDashboard = () => router.push('/dashboard')

onMounted(() => {
  cargarDatos()
  setTimeout(() => {
    inicializarMapa()
    cargarFronterasMunicipales() // <--- ¡AÑADE ESTA LÍNEA AQUÍ!
    if (beneficiarios.value.length > 0) dibujarMarcadores()
  }, 100)
})
</script>

<style scoped>
/* Scrollbar fino para UI Premium */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #177da6;
}

/* Estilizar los tooltips (popups) de Leaflet para que combinen con Tailwind */
:deep(.leaflet-tooltip) {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 8px 12px;
}
:deep(.leaflet-tooltip-top:before) {
  border-top-color: white;
}
</style>
