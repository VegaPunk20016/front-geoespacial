<template>
  <div class="h-screen bg-gray-50 flex flex-col overflow-hidden relative font-sans">
    <!-- HEADER -->
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
          {{ beneficiariosFiltrados.length }} Registros Sincronizados
        </div>
      </div>
    </header>

    <!-- BANNER DE ERROR NO CRÍTICO (cartografía) -->
    <div
      v-if="errorCartografia"
      class="bg-yellow-50 border-b border-yellow-200 px-6 py-2 text-xs text-yellow-700 font-medium flex items-center gap-2"
    >
      <AlertTriangle class="w-3.5 h-3.5" />
      No se pudo cargar la cartografía base. Los marcadores siguen disponibles.
    </div>

    <main class="flex-1 flex overflow-hidden">
      <!-- TABLA -->
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
                  v-if="mostrarColumnaNombre"
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
                v-for="b in beneficiariosFiltrados"
                :key="b.id"
                class="group hover:bg-[#177DA6]/5 transition-colors cursor-pointer"
                tabindex="0"
                role="button"
                :aria-label="`Ver detalles de ${b.nombre_completo || b.clave_unica}`"
                @click="abrirDetalles(b)"
                @keydown.enter="abrirDetalles(b)"
              >
                <td class="px-6 py-4">
                  <span
                    class="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200"
                  >
                    {{ b.clave_unica || 'SIN_CLAVE' }}
                  </span>
                </td>
                <td v-if="mostrarColumnaNombre" class="px-6 py-4">
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
                  <button
                    class="p-2 text-gray-300 group-hover:text-[#177DA6] transition-colors"
                    :aria-label="`Abrir detalles de ${b.nombre_completo || b.clave_unica}`"
                  >
                    <ChevronRight class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- MAPA -->
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

    <!-- PANEL LATERAL DE DETALLE -->
    <div v-if="registroSeleccionado" class="fixed inset-0 z-[100] overflow-hidden">
      <div class="absolute inset-0 bg-[#012737]/60 transition-opacity" @click="cerrarDetalle"></div>
      <div class="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div class="w-screen max-w-md">
          <div class="flex h-full flex-col bg-white shadow-2xl">
            <div class="bg-[#012737] p-8 text-white">
              <div class="flex items-start justify-between">
                <h2 class="text-xl font-bold leading-tight">Ficha Técnica</h2>
                <button
                  @click="cerrarDetalle"
                  class="p-1 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Cerrar panel"
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
                  <p v-if="nombreValido" class="text-sm font-bold truncate max-w-[280px]">
                    {{ registroSeleccionado.nombre_completo }}
                  </p>
                  <p v-else class="text-sm font-bold text-gray-400 italic">Registro Geográfico</p>
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
                  <p class="text-sm text-gray-700 font-semibold break-words">{{ attr.value }}</p>
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
import { onMounted, onUnmounted, computed, ref, watch, shallowRef, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePadronStore } from '@/stores/padronStore'
import {
  ArrowLeft,
  Layers,
  Loader2,
  Database,
  MapPin,
  ChevronRight,
  X,
  Navigation,
  AlertTriangle,
} from 'lucide-vue-next'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'

// ─── ROUTER & STORE ──────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const padronStore = usePadronStore()
const padronId = computed(() => route.params.id)
const { beneficiarios, status } = storeToRefs(padronStore)

// ─── ESTADO LOCAL ─────────────────────────────────────────────────────────────
const registroSeleccionado = ref(null)
const errorCartografia = ref(false)

// ─── MAPA (shallowRef para objetos Leaflet no reactivos) ─────────────────────
const mapContainer = ref(null)
const map = shallowRef(null)
const limitesLayer = shallowRef(null)
const clusterLayer = shallowRef(null) // 🆕 Cluster en lugar de featureGroup simple

// ─── COMPUTED ─────────────────────────────────────────────────────────────────

/** Filtra registros sin ID (basura) */
const beneficiariosFiltrados = computed(() => beneficiarios.value.filter((b) => b.id !== null))

/** Decide si mostrar columna de nombres */
const mostrarColumnaNombre = computed(() =>
  beneficiariosFiltrados.value.some((b) => {
    const nombre = b.nombre_completo?.trim().toUpperCase()
    return nombre && nombre !== 'SIN NOMBRE' && nombre !== ''
  }),
)

/** Nombre válido del registro seleccionado — evita lógica en template */
const nombreValido = computed(() => {
  const nombre = registroSeleccionado.value?.nombre_completo?.trim().toUpperCase()
  return nombre && nombre !== 'SIN NOMBRE' && nombre !== ''
})

/** Parsea datos_generales UNA sola vez al seleccionar, no en cada render */
const atributosDinamicos = computed(() => {
  if (!registroSeleccionado.value?.datos_generales) return []
  const rawData = registroSeleccionado.value.datos_generales
  try {
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    return Object.entries(data).map(([key, value]) => ({
      key: key.replace(/_/g, ' ').toUpperCase(),
      value: value ?? 'N/A',
    }))
  } catch {
    console.warn('datos_generales tiene formato inválido')
    return []
  }
})

// ─── MAPA: INICIALIZACIÓN ─────────────────────────────────────────────────────
const inicializarMapa = () => {
  if (!mapContainer.value) return

  map.value = L.map(mapContainer.value).setView([23.6345, -102.5528], 5)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map.value)

  // 🆕 Crear capa de clusters con opciones de estilo
  clusterLayer.value = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    iconCreateFunction(cluster) {
      const count = cluster.getChildCount()
      return L.divIcon({
        html: `<div class="cluster-icon">${count}</div>`,
        className: 'custom-cluster',
        iconSize: L.point(36, 36),
      })
    },
  })

  clusterLayer.value.addTo(map.value)
}

// ─── MAPA: FRONTERAS ─────────────────────────────────────────────────────────
const cargarFronterasMunicipales = async () => {
  if (!map.value) return
  try {
    const response = await fetch('/data/edomex.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()

    limitesLayer.value = L.geoJSON(data, {
      style: {
        color: '#012737',
        weight: 1.5,
        opacity: 0.6,
        fillColor: '#177DA6',
        fillOpacity: 0.05,
        dashArray: '4 4',
      },
      onEachFeature(feature, layer) {
        const nombre = feature.properties.NOMGEO || 'Municipio'
        layer.bindTooltip(`<div class="text-xs font-bold uppercase">${nombre}</div>`, {
          sticky: true,
        })
      },
    }).addTo(map.value)

    errorCartografia.value = false
  } catch (e) {
    console.warn('Límites no cargados:', e)
    errorCartografia.value = true // 🆕 Muestra banner al usuario
  }
}

// ─── MAPA: MARCADORES CON CLUSTER ────────────────────────────────────────────
const dibujarMarcadores = () => {
  if (!map.value || !clusterLayer.value) return

  clusterLayer.value.clearLayers()
  let hasValidCoords = false

  beneficiariosFiltrados.value.forEach((b) => {
    const lat = parseFloat(b.latitud)
    const lng = parseFloat(b.longitud)
    if (isNaN(lat) || isNaN(lng)) return

    hasValidCoords = true

    const customPin = L.divIcon({
      className: 'bg-transparent border-0',
      html: `<div style="
        width:16px;height:16px;
        background:#177DA6;
        border-radius:50%;
        border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        cursor:pointer;
        transition:transform .15s;
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    const marker = L.marker([lat, lng], { icon: customPin })
    marker.bindTooltip(
      `<div class="text-xs font-sans"><strong>${b.nombre_completo || b.clave_unica}</strong></div>`,
    )
    marker.on('click', () => abrirDetalles(b))

    clusterLayer.value.addLayer(marker) // 🆕 Agrega al cluster, no al mapa directo
  })

  if (hasValidCoords) {
    map.value.fitBounds(clusterLayer.value.getBounds(), { padding: [50, 50] })
  }
}

// ─── MAPA: ENFOCAR REGISTRO ───────────────────────────────────────────────────
const enfocarEnMapa = () => {
  const { latitud, longitud } = registroSeleccionado.value ?? {}
  const lat = parseFloat(latitud)
  const lng = parseFloat(longitud)
  if (!map.value || isNaN(lat) || isNaN(lng)) return
  map.value.flyTo([lat, lng], 18, { duration: 1 })
}

// ─── WATCHERS ─────────────────────────────────────────────────────────────────

// 🆕 Observa solo la longitud del array — evita deep: true costoso
watch(
  () => beneficiariosFiltrados.value.length,
  (newLen) => {
    if (newLen > 0) dibujarMarcadores()
  },
)

// Cuando se selecciona un registro con coordenadas, vuela al punto
watch(registroSeleccionado, (nuevo) => {
  if (!map.value || !nuevo) return
  const lat = parseFloat(nuevo.latitud)
  const lng = parseFloat(nuevo.longitud)
  if (isNaN(lat) || isNaN(lng)) return
  map.value.flyTo([lat, lng], 16, { duration: 1.5 })
})

// ─── TECLADO: CIERRE CON ESCAPE ───────────────────────────────────────────────
const onKeydown = (e) => {
  if (e.key === 'Escape') cerrarDetalle()
}

// ─── ACCIONES ─────────────────────────────────────────────────────────────────
const abrirDetalles = (reg) => {
  registroSeleccionado.value = reg
}

const cerrarDetalle = () => {
  registroSeleccionado.value = null
}

const volverAlDashboard = () => router.push('/dashboard')

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────
onMounted(async () => {
  padronStore.fetchBeneficiarios(padronId.value)

  // 🆕 nextTick garantiza que el DOM esté listo — sin setTimeout arbitrario
  await nextTick()
  inicializarMapa()
  cargarFronterasMunicipales()
  if (beneficiariosFiltrados.value.length > 0) dibujarMarcadores()

  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  // 🆕 Limpia el mapa para evitar memory leaks
  map.value?.remove()
  map.value = null
  clusterLayer.value = null
  limitesLayer.value = null

  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #177da6;
}

:deep(.leaflet-tooltip) {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 8px 12px;
}

/* 🆕 Estilos del cluster personalizado */
:deep(.custom-cluster) {
  background: transparent;
  border: none;
}

:deep(.cluster-icon) {
  width: 36px;
  height: 36px;
  background: #177da6;
  color: white;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 10px rgba(23, 125, 166, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  font-family: monospace;
  transition: transform 0.15s;
}

:deep(.cluster-icon:hover) {
  transform: scale(1.15);
}
</style>
