<template>
  <div class="h-[calc(100vh-80px)] flex bg-white overflow-hidden relative">
    <!-- ═══════════════════════════════════════════════
         SIDEBAR IZQUIERDO
    ═══════════════════════════════════════════════ -->
    <aside
      class="absolute md:relative z-40 w-80 h-full bg-white border-r border-gray-200 shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out flex flex-col"
      :class="isFiltersOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 bg-gray-50/50">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Map :size="16" class="text-[#177DA6]" /> Mapa del Padrón
          </h2>
          <button
            @click="isFiltersOpen = false"
            class="md:hidden text-gray-400 hover:text-gray-800 p-1"
          >
            <X :size="18" />
          </button>
        </div>
        <button
          @click="router.back()"
          class="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#012737] transition-colors group"
        >
          <ArrowLeft :size="14" class="group-hover:-translate-x-0.5 transition-transform" />
          Regresar
        </button>
      </div>

      <!-- Contenido scrollable -->
      <div class="flex-1 overflow-y-auto p-5 space-y-5">
        <!-- Info padrón -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Padrón</label>
          <div class="bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5">
            <p class="text-sm font-semibold text-gray-800 truncate">
              {{ padronNombre }}
            </p>
          </div>
        </div>

        <!-- Nivel de zoom actual -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nivel</label>
          <div class="flex gap-1.5">
            <button
              v-for="btn in botonesNivel"
              :key="btn.nivel"
              @click="irANivel(btn.nivel)"
              :title="btn.label"
              :class="[
                'flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                nivelActual === btn.nivel
                  ? 'bg-[#012737] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              ]"
            >
              <component :is="btn.icon" :size="13" />
              <span>{{ btn.label }}</span>
            </button>
          </div>
        </div>

        <!-- Buscador de municipio con dropdown -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >Municipio</label
          >
          <div class="relative">
            <Search
              :size="14"
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              v-model="busquedaMunicipio"
              @focus="dropdownAbierto = true"
              @blur="cerrarDropdownDelay"
              placeholder="Buscar o seleccionar..."
              class="w-full pl-8 pr-8 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#177DA6]/20 focus:border-[#177DA6]"
              :class="municipioSeleccionado ? 'border-[#177DA6]' : ''"
            />
            <button
              v-if="busquedaMunicipio || municipioSeleccionado"
              @mousedown.prevent="limpiarMunicipio"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X :size="14" />
            </button>
          </div>

          <!-- Dropdown catálogo INEGI -->
          <div
            v-if="dropdownAbierto && municipiosFiltrados.length"
            class="border border-gray-200 rounded-md overflow-hidden shadow-lg max-h-52 overflow-y-auto"
          >
            <div
              v-for="mun in municipiosFiltrados"
              :key="mun.cvegeo"
              @mousedown.prevent="elegirMunicipio(mun)"
              class="px-3 py-2 hover:bg-[#177DA6]/10 cursor-pointer flex justify-between items-center border-b last:border-0 text-sm"
              :class="municipioSeleccionado?.nombre === mun.nombre ? 'bg-[#177DA6]/10' : ''"
            >
              <span class="font-medium text-gray-800">{{ mun.nombre }}</span>
              <span class="text-[10px] text-gray-400 font-mono">{{ mun.cvegeo }}</span>
            </div>
          </div>

          <!-- Chip municipio activo -->
          <div
            v-if="municipioSeleccionado && !dropdownAbierto"
            class="flex items-center justify-between bg-[#177DA6]/10 border border-[#177DA6]/20 rounded-md px-3 py-2"
          >
            <div class="flex items-center gap-2">
              <MapPin :size="12" class="text-[#177DA6]" />
              <span class="text-xs font-bold text-[#177DA6]">{{
                municipioSeleccionado.nombre
              }}</span>
            </div>
            <button @click="limpiarMunicipio" class="text-[#177DA6]/60 hover:text-[#177DA6]">
              <X :size="12" />
            </button>
          </div>
        </div>

        <!-- Stats municipio -->
        <Transition name="slide-down">
          <div v-if="statsAgnosticas" class="space-y-3">
            <div class="bg-[#012737] text-white p-4 rounded-xl">
              <p class="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">
                Total registros
              </p>
              <p class="text-3xl font-black">
                {{ Number(statsAgnosticas.stats?.total_registros || 0).toLocaleString() }}
              </p>
              <p class="text-[10px] opacity-70 mt-1">{{ statsAgnosticas.municipio }}</p>
            </div>

            <template v-for="(val, key) in statsAgnosticas.stats" :key="key">
              <div
                v-if="key.startsWith('sum_') && val > 0"
                class="bg-gray-50 p-3 rounded-lg border border-gray-100"
              >
                <div class="flex justify-between items-center mb-1.5">
                  <span class="text-[9px] font-bold text-gray-500 uppercase">
                    {{ key.replace('sum_', '').replace(/_/g, ' ') }}
                  </span>
                  <span class="text-xs font-black text-gray-800">{{
                    Number(val).toLocaleString()
                  }}</span>
                </div>
                <div class="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                  <div
                    class="bg-[#177DA6] h-full rounded-full transition-all duration-700"
                    :style="{
                      width:
                        Math.min((val / statsAgnosticas.stats.total_registros) * 100, 100) + '%',
                    }"
                  ></div>
                </div>
              </div>
            </template>
          </div>
        </Transition>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-100">
        <Transition name="fade">
          <div
            v-if="store.mapLoading"
            class="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg w-full justify-center"
          >
            <div
              class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"
            ></div>
            <span class="text-xs font-black tracking-widest uppercase">Consultando</span>
          </div>
          <div v-else class="text-center">
            <p class="text-[10px] text-gray-400">
              <span class="font-bold text-gray-600">{{ totalContador }}</span> registros en vista
            </p>
          </div>
        </Transition>
      </div>
    </aside>

    <!-- ═══════════════════════════════════════════════
         MAPA
    ═══════════════════════════════════════════════ -->
    <main class="flex-1 relative overflow-hidden">
      <!-- Botón abrir sidebar (mobile) -->
      <button
        @click="isFiltersOpen = true"
        class="md:hidden absolute top-4 left-4 z-[400] bg-white p-2.5 rounded-md shadow-lg text-gray-700 hover:text-[#177DA6]"
      >
        <Filter :size="20" />
      </button>

      <!-- Reset view -->
      <div class="absolute top-4 right-4 z-[400]">
        <button
          @click="mapRef?.resetView()"
          class="bg-white p-2.5 rounded-md shadow-lg text-gray-700 hover:text-[#177DA6] transition-colors"
          title="Centrar en EdoMex"
        >
          <Crosshair :size="20" />
        </button>
      </div>

      <MapView
        ref="mapRef"
        :registros="registrosActuales"
        :modo="modoMapa"
        :datos-coropletas="datosCoropletas"
        :municipio-filtro="municipioSeleccionado?.nombre ?? null"
        :tiene-coordenadas="tieneCoordenadas"
        @view-change="onMapMove"
        @zoom-nivel="onZoomNivel"
        @select="onSelectRegistro"
        @municipio-click="onMunicipioClick"
      />
    </main>

    <!-- ═══════════════════════════════════════════════
         PANEL DERECHO — Detalle registro
    ═══════════════════════════════════════════════ -->
    <aside
      v-if="registroSeleccionado"
      class="absolute right-0 top-0 z-[500] w-80 h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col"
    >
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 class="font-bold text-gray-800 text-sm">Detalle del Registro</h3>
        <button @click="registroSeleccionado = null" class="p-1 text-gray-400 hover:text-gray-700">
          <X :size="18" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5 space-y-2.5">
        <div v-if="cargandoDetalle" class="space-y-3">
          <div v-for="i in 6" :key="i" class="bg-gray-100 animate-pulse h-12 rounded-lg"></div>
        </div>

        <template v-else>
          <template v-for="(val, key) in camposFijosRegistro" :key="key">
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">{{ key }}</p>
              <p class="text-sm font-semibold text-gray-800">{{ val }}</p>
            </div>
          </template>

          <p
            v-if="Object.keys(datosExtra).length"
            class="text-[9px] font-bold text-gray-400 uppercase tracking-widest pt-2"
          >
            Datos adicionales
          </p>
          <div
            v-for="(v, k) in datosExtra"
            :key="k"
            class="bg-gray-50 p-3 rounded-lg border border-gray-100"
          >
            <p class="text-[9px] font-bold text-gray-400 uppercase mb-0.5">
              {{ k.replace(/_/g, ' ') }}
            </p>
            <p class="text-sm font-semibold text-gray-800">{{ v }}</p>
          </div>
        </template>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePadronStore } from '@/stores/padronStore'
import { useMunicipios } from '@/composables/useMunicipios'
import MapView from '@/components/MapView.vue'
import { Map, X, Search, MapPin, ArrowLeft, Filter, Crosshair, Building2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = usePadronStore()
const { todos: todosMunicipios, normalizar } = useMunicipios()

// ── Estado ──────────────────────────────────────────────────────────────────
const mapRef = ref(null)
const isFiltersOpen = ref(false)
const nivelActual = ref('estado')
const modoMapa = ref('estado')
const municipioSeleccionado = ref(null)
const datosCoropletas = ref([])
const statsAgnosticas = ref(null)
const registroSeleccionado = ref(null)
const cargandoDetalle = ref(false)
const tieneCoordenadas = ref(false)

// Dropdown municipio
const busquedaMunicipio = ref('')
const dropdownAbierto = ref(false)
let _closeTimer = null
let _moveTimer = null

// ── Computed ────────────────────────────────────────────────────────────────
const padronNombre = computed(
  () => store.padrones.find((p) => p.id === route.params.id)?.nombre_padron || 'Cargando...',
)

const botonesNivel = computed(() => {
  const base = [
    { nivel: 'estado', label: 'Estado', icon: Map },
    { nivel: 'municipio', label: 'Municipio', icon: Building2 },
  ]
  if (tieneCoordenadas.value) base.push({ nivel: 'punto', label: 'Detalle', icon: Crosshair })
  return base
})

const municipiosFiltrados = computed(() => {
  const q = normalizar(busquedaMunicipio.value)
  if (!q) return todosMunicipios
  return todosMunicipios.filter((m) => m._norm?.includes(q) || m.nombre.toLowerCase().includes(q))
})

const registrosActuales = computed(() => {
  if (modoMapa.value === 'clusters') return store.clusters
  if (modoMapa.value === 'puntos') return store.beneficiarios
  return []
})

const totalContador = computed(() => {
  if (modoMapa.value === 'clusters')
    return store.clusters.reduce((a, c) => a + (parseInt(c.count) || 0), 0).toLocaleString()
  return store.beneficiarios.length.toLocaleString()
})

const VACIOS = new Set(['', 'sin nombre', 'n/a', 'null', 'undefined', '-', '—'])
const tieneValor = (v) => v != null && !VACIOS.has(String(v).trim().toLowerCase())

const camposFijosRegistro = computed(() => {
  const r = registroSeleccionado.value
  if (!r) return {}
  return Object.fromEntries(
    Object.entries({
      'Clave única': r.clave_unica,
      Nombre: r.nombre_completo,
      Municipio: r.municipio,
      Sección: r.seccion,
      Latitud: r.latitud,
      Longitud: r.longitud,
    }).filter(([, v]) => tieneValor(v)),
  )
})

const datosExtra = computed(() => {
  const d = registroSeleccionado.value?.datos_generales
  if (!d) return {}
  try {
    const obj = typeof d === 'string' ? JSON.parse(d) : d
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => tieneValor(v)))
  } catch {
    return {}
  }
})

// ── Dropdown ────────────────────────────────────────────────────────────────
const cerrarDropdownDelay = () => {
  _closeTimer = setTimeout(() => {
    dropdownAbierto.value = false
  }, 150)
}

const elegirMunicipio = (mun) => {
  busquedaMunicipio.value = mun.nombre
  dropdownAbierto.value = false
  onMunicipioClick({ nombre: mun.nombre, cvegeo: mun.cvegeo })
}

const limpiarMunicipio = () => {
  busquedaMunicipio.value = ''
  dropdownAbierto.value = false
  municipioSeleccionado.value = null
  statsAgnosticas.value = null
  registroSeleccionado.value = null
}

// ── Mapa ────────────────────────────────────────────────────────────────────
const onMapMove = (coords) => {
  clearTimeout(_moveTimer)
  _moveTimer = setTimeout(async () => {
    const { nivel } = coords
    const municipio = municipioSeleccionado.value?.nombre ?? null

    if (nivel === 'estado') {
      modoMapa.value = 'estado'
    } else if (nivel === 'municipio') {
      modoMapa.value = 'clusters'
      await store.fetchMapaDatos(route.params.id, { ...coords, municipio }, 'clusters')
    } else if (nivel === 'punto' && tieneCoordenadas.value) {
      modoMapa.value = 'puntos'
      await store.fetchMapaDatos(route.params.id, { ...coords, municipio }, 'puntos')
    }
  }, 500)
}

const onZoomNivel = (nivel) => (nivelActual.value = nivel)

const onMunicipioClick = async ({ nombre }) => {
  municipioSeleccionado.value = { nombre }
  statsAgnosticas.value = await store.fetchResumenAgnostico(route.params.id, nombre)
  if (nivelActual.value === 'estado') mapRef.value?.zoomToMunicipio(nombre)
}

const irANivel = (nivel) => {
  if (nivel === 'estado') {
    limpiarMunicipio()
    mapRef.value?.resetView()
  } else if (nivel === 'municipio' && municipioSeleccionado.value) {
    mapRef.value?.zoomToMunicipio(municipioSeleccionado.value.nombre)
  }
}

const onSelectRegistro = async (r) => {
  registroSeleccionado.value = r
  cargandoDetalle.value = true
  const detalle = await store.fetchDetalleBeneficiario(route.params.id, r.id)
  if (registroSeleccionado.value?.id === r.id) {
    registroSeleccionado.value = detalle ?? r
  }
  cargandoDetalle.value = false
}

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  if (store.status === 'idle' || store.status === 'error') {
    await store.fetchPadrones()
  }
  const resumen = await store.fetchResumenAgnostico(route.params.id)
  if (Array.isArray(resumen)) {
    datosCoropletas.value = resumen
    tieneCoordenadas.value = resumen.some((r) => r.tiene_coordenadas)
  }
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
