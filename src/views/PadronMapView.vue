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
            <MapIcon :size="16" class="text-[#177DA6]" />Mapa del Padrón
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
            <p class="text-sm font-semibold text-gray-800 truncate">{{ padronNombre }}</p>
          </div>
        </div>

        <!-- Botones de nivel -->
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

        <!-- 1. Búsqueda Municipio -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Añadir Municipio
          </label>
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
            />
            <button
              v-if="busquedaMunicipio"
              @mousedown.prevent="busquedaMunicipio = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X :size="14" />
            </button>
          </div>

          <!-- Dropdown Municipios -->
          <div
            v-if="dropdownAbierto && municipiosFiltrados.length"
            class="border border-gray-200 rounded-md overflow-hidden shadow-lg max-h-52 overflow-y-auto relative z-10 bg-white"
          >
            <div
              v-for="mun in municipiosFiltrados"
              :key="mun.cvegeo"
              @mousedown.prevent="elegirMunicipio(mun)"
              class="px-3 py-2 hover:bg-[#177DA6]/10 cursor-pointer flex justify-between items-center border-b last:border-0 text-sm"
            >
              <span class="font-medium text-gray-800">{{ mun.nombre }}</span>
              <span class="text-[10px] text-gray-400 font-mono">{{ mun.cvegeo }}</span>
            </div>
          </div>
        </div>

        <!-- 2. Búsqueda CP (Independiente y visible siempre) -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5"
          >
            <Hash :size="11" /> Añadir Código Postal
          </label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input
                v-model="busquedaCP"
                @keydown.enter="agregarCP"
                maxlength="5"
                placeholder="Ej: 52000"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-[#177DA6]/20 focus:border-[#177DA6]"
                :class="[cpValido ? 'border-[#177DA6]' : '', cpError ? 'border-red-400' : '']"
              />
              <div v-if="buscandoCP" class="absolute right-2.5 top-1/2 -translate-y-1/2">
                <div
                  class="w-3.5 h-3.5 border-2 border-[#177DA6] border-t-transparent rounded-full animate-spin"
                ></div>
              </div>
            </div>
            <button
              @click="agregarCP"
              :disabled="!cpValido || buscandoCP"
              class="bg-[#012737] text-white px-3 py-2 text-xs font-bold rounded-md disabled:opacity-50 hover:bg-[#177DA6] transition-colors"
            >
              Añadir
            </button>
          </div>
          <p v-if="cpError" class="text-[10px] text-red-500">{{ cpError }}</p>
        </div>

        <!-- 3. Chips de filtros activos (Sumados) -->
        <Transition name="slide-down">
          <div v-if="filtrosActivos.length" class="space-y-2 pt-2">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest"
                >Filtros Activos</span
              >
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="f in filtrosActivos"
                :key="f.id"
                class="inline-flex items-center gap-1 bg-[#177DA6] text-white text-[10px] font-bold px-2 py-1.5 rounded-md"
              >
                <component :is="f.icon" :size="10" />
                {{ f.label }}
                <button @click="removerFiltro(f)" class="opacity-70 hover:opacity-100 ml-1">
                  <X :size="12" />
                </button>
              </span>
            </div>
            <button
              @click="limpiarTodosFiltros"
              class="w-full text-[10px] text-gray-500 hover:text-red-500 transition-colors text-center py-1 mt-1"
            >
              Limpiar todos los filtros
            </button>
          </div>
        </Transition>

        <!-- 4. Resumen Limpio (Total Global o Sumado) -->
        <Transition name="slide-down">
          <div class="space-y-3 pt-2">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest"
                >Resumen</span
              >
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>
            <div class="bg-[#012737] text-white p-4 rounded-xl relative overflow-hidden">
              <div class="relative z-10">
                <p class="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">
                  Total Registros
                </p>
                <p class="text-3xl font-black">
                  {{ totalSeleccionado.toLocaleString() }}
                </p>
                <p class="text-[10px] opacity-70 mt-1">
                  {{ resumenTextoLabel }}
                </p>
              </div>
              <MapIcon :size="80" class="absolute -right-4 -bottom-4 opacity-5" />
            </div>
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
              <span class="font-bold text-gray-600">{{ totalContador }}</span>
              {{ modoMapa === 'puntos' ? ' registros en vista' : ' agrupaciones en vista' }}
            </p>
          </div>
        </Transition>
      </div>
    </aside>

    <!-- ═══════════════════════════════════════════════
         MAPA CENTRAL
    ═══════════════════════════════════════════════ -->
    <main class="flex-1 relative overflow-hidden">
      <button
        @click="isFiltersOpen = true"
        class="md:hidden absolute top-4 left-4 z-[1000] bg-white p-2.5 rounded-md shadow-lg text-gray-700 hover:text-[#177DA6]"
      >
        <Filter :size="20" />
      </button>

      <Transition name="fade">
        <div
          v-if="store.mapLoading"
          class="absolute inset-0 z-[2000] flex items-center justify-center bg-white/30 backdrop-blur-[2px]"
        >
          <div
            class="bg-white/90 px-6 py-4 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-3"
          >
            <div
              class="w-8 h-8 border-4 border-[#177DA6] border-t-transparent rounded-full animate-spin"
            ></div>
            <div class="text-center">
              <p class="text-xs font-black text-gray-800 uppercase tracking-widest">
                Actualizando Mapa
              </p>
              <p class="text-[10px] text-gray-500 font-medium">Consultando base de datos...</p>
            </div>
          </div>
        </div>
      </Transition>

      <div class="absolute top-4 right-4 z-[1000]">
        <button
          @click="mapRef?.resetView()"
          class="bg-white p-2.5 rounded-md shadow-lg text-gray-700 hover:text-[#177DA6] transition-colors"
          title="Centrar en EdoMex"
        >
          <Crosshair :size="20" />
        </button>
      </div>

      <Transition name="slide-down">
        <div
          v-if="mostrarBotonBusquedaArea"
          class="absolute top-6 left-1/2 -translate-x-1/2 z-[1000]"
        >
          <button
            @click="buscarEnAreaActiva"
            class="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-xl border border-gray-200 text-sm font-bold text-[#177DA6] hover:bg-[#177DA6] hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw :size="16" /> Buscar en esta área
          </button>
        </div>
      </Transition>

      <MapView
        ref="mapRef"
        :registros="registrosActuales"
        :modo="modoMapa"
        :datos-coropletas="datosCoropletas"
        :municipio-filtro="
          municipiosSeleccionados.length === 1 ? municipiosSeleccionados[0].nombre : null
        "
        :tiene-coordenadas="tieneCoordenadas"
        @view-change="onMapMove"
        @zoom-nivel="onZoomNivel"
        @select="onSelectRegistro"
        @municipio-click="onMunicipioClickAislado"
        @cluster-click="onClusterClick"
      />
    </main>

    <!-- ═══════════════════════════════════════════════
         PANEL DERECHO — Detalle registro
    ═══════════════════════════════════════════════ -->
    <Transition name="slide-right">
      <aside
        v-if="registroSeleccionado"
        class="absolute right-0 top-0 z-[3000] w-80 h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col"
      >
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-bold text-gray-800 text-sm">Detalle del Registro</h3>
          <button
            @click="registroSeleccionado = null"
            class="p-1 text-gray-400 hover:text-gray-700"
          >
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

        <div v-if="registroSeleccionado?.latitud" class="p-4 border-t border-gray-100">
          <button
            @click="volarARegistro(registroSeleccionado)"
            class="w-full flex items-center justify-center gap-2 bg-[#012737] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-[#177DA6] transition-colors"
          >
            <Crosshair :size="14" /> Centrar en mapa
          </button>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePadronStore } from '@/stores/padronStore'
import { useMunicipios } from '@/composables/useMunicipios'
import MapView from '@/components/MapView.vue'
import {
  Map as MapIcon,
  X,
  Search,
  MapPin,
  ArrowLeft,
  Filter,
  Crosshair,
  Building2,
  Hash,
  RefreshCw,
} from 'lucide-vue-next'

// ── Variables de Entorno y Stores ───────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const store = usePadronStore()
const { todos: todosMunicipios, normalizar } = useMunicipios()

// ── Estado (Refs) ───────────────────────────────────────────────────────────
const mapRef = ref(null)
const isFiltersOpen = ref(false)
const nivelActual = ref('estado')
const modoMapa = ref('estado')

const datosCoropletas = ref([])
const registroSeleccionado = ref(null)
const cargandoDetalle = ref(false)
const tieneCoordenadas = ref(false)

// Estado de Filtros (Sumables)
const municipiosSeleccionados = ref([]) // Arreglo de objetos municipio
const cpsSeleccionados = ref([]) // Arreglo de strings (CPs)
const resultadosPorCP = ref({}) // Mapa de resultados descargados por CP

const busquedaMunicipio = ref('')
const dropdownAbierto = ref(false)
const busquedaCP = ref('')
const buscandoCP = ref(false)
const cpError = ref('')

// Botón Flotante
const mostrarBotonBusquedaArea = ref(false)
const datosVistaPendiente = ref(null)
const autoCargarSiguienteMove = ref(false)

let _closeTimer = null
let _moveTimer = null

// ── Computed Properties ─────────────────────────────────────────────────────
const padronNombre = computed(
  () => store.padrones.find((p) => p.id === route.params.id)?.nombre_padron || 'Cargando...',
)

const botonesNivel = computed(() => {
  const base = [
    { nivel: 'estado', label: 'Estado', icon: MapIcon },
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

const cpValido = computed(() => /^\d{5}$/.test(busquedaCP.value))

const filtrosActivos = computed(() => {
  const list = []
  municipiosSeleccionados.value.forEach((m) => {
    list.push({ id: m.cvegeo, tipo: 'municipio', label: m.nombre, icon: MapPin })
  })
  cpsSeleccionados.value.forEach((cp) => {
    list.push({ id: cp, tipo: 'cp', label: `CP ${cp}`, icon: Hash })
  })
  return list
})

const resumenTextoLabel = computed(() => {
  if (municipiosSeleccionados.value.length === 0 && cpsSeleccionados.value.length === 0) {
    return 'Estado General'
  }
  const parts = []
  if (municipiosSeleccionados.value.length)
    parts.push(`${municipiosSeleccionados.value.length} Municipio(s)`)
  if (cpsSeleccionados.value.length) parts.push(`${cpsSeleccionados.value.length} CP(s)`)
  return parts.join(' + ')
})

const totalSeleccionado = computed(() => {
  // Si no hay nada seleccionado, mostramos la suma de TODO el estado
  if (municipiosSeleccionados.value.length === 0 && cpsSeleccionados.value.length === 0) {
    return datosCoropletas.value.reduce((acc, d) => acc + parseInt(d.total || 0), 0)
  }

  let total = 0
  // Sumamos todos los registros encontrados por CP
  cpsSeleccionados.value.forEach((cp) => {
    total += resultadosPorCP.value[cp]?.length || 0
  })
  // Sumamos las estadísticas de los municipios seleccionados
  municipiosSeleccionados.value.forEach((mun) => {
    const mData = datosCoropletas.value.find(
      (d) => normalizar(d.municipio) === normalizar(mun.nombre),
    )
    if (mData) total += parseInt(mData.total || 0)
  })

  return total
})

const registrosActuales = computed(() => {
  // Si hay CPs buscados, los puntos mandan en el mapa
  if (cpsSeleccionados.value.length > 0) {
    return Object.values(resultadosPorCP.value).flat()
  }
  if (modoMapa.value === 'clusters') return store.clusters
  if (modoMapa.value === 'puntos') return store.beneficiarios
  return []
})

const totalContador = computed(() => {
  if (cpsSeleccionados.value.length > 0)
    return Object.values(resultadosPorCP.value).flat().length.toLocaleString()
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
      'C.P.': r.codigo_postal,
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

// ── Lógica de Adición/Remoción de Filtros ──────────────────────────────────
const cerrarDropdownDelay = () => {
  _closeTimer = setTimeout(() => {
    dropdownAbierto.value = false
  }, 150)
}

const elegirMunicipio = (mun) => {
  // Evitar duplicados
  if (!municipiosSeleccionados.value.some((m) => m.cvegeo === mun.cvegeo)) {
    municipiosSeleccionados.value.push(mun)

    // Zoom y petición del municipio agregado (para que aparezcan los clusters)
    mapRef.value?.zoomToMunicipio(mun.nombre)
    modoMapa.value = 'clusters'
    nivelActual.value = 'municipio'
    store.fetchMapaDatos(route.params.id, { nivel: 'municipio', municipio: mun.nombre }, 'clusters')
  }
  busquedaMunicipio.value = ''
  dropdownAbierto.value = false
}

// Handler por si clican en el mapa un municipio directamente
const onMunicipioClickAislado = ({ nombre }) => {
  const munObj = todosMunicipios.find((m) => normalizar(m.nombre) === normalizar(nombre))
  if (munObj) elegirMunicipio(munObj)
}

const agregarCP = async () => {
  if (!cpValido.value) return
  const cp = busquedaCP.value

  if (cpsSeleccionados.value.includes(cp)) {
    busquedaCP.value = ''
    return
  }

  buscandoCP.value = true
  cpError.value = ''
  try {
    const res = await store.buscarInteligente(route.params.id, cp)
    if (res && res.length > 0) {
      cpsSeleccionados.value.push(cp)
      resultadosPorCP.value[cp] = res

      modoMapa.value = 'puntos'
      nivelActual.value = 'punto'
      // Volar al primer registro con coordenadas de este CP
      const conCoords = res.find((r) => r.latitud && r.longitud)
      if (conCoords)
        mapRef.value?.flyToRegistro(Number(conCoords.latitud), Number(conCoords.longitud), 14)
    } else {
      cpError.value = 'Sin registros para este CP'
    }
  } catch (e) {
    cpError.value = 'Error al buscar el CP'
  } finally {
    buscandoCP.value = false
    busquedaCP.value = ''
  }
}

const removerFiltro = (f) => {
  if (f.tipo === 'municipio') {
    municipiosSeleccionados.value = municipiosSeleccionados.value.filter((m) => m.cvegeo !== f.id)
  } else if (f.tipo === 'cp') {
    cpsSeleccionados.value = cpsSeleccionados.value.filter((cp) => cp !== f.id)
    delete resultadosPorCP.value[f.id]
  }

  // Si nos quedamos sin filtros, reiniciamos vista
  if (municipiosSeleccionados.value.length === 0 && cpsSeleccionados.value.length === 0) {
    limpiarTodosFiltros()
  }
}

const limpiarTodosFiltros = () => {
  municipiosSeleccionados.value = []
  cpsSeleccionados.value = []
  resultadosPorCP.value = {}
  busquedaCP.value = ''
  busquedaMunicipio.value = ''
  registroSeleccionado.value = null
  mostrarBotonBusquedaArea.value = false

  modoMapa.value = 'estado'
  nivelActual.value = 'estado'
  mapRef.value?.resetView()
}

// ── Lógica de Movimiento de Mapa ───────────────────────────────────────────
let ultimaAreaConsultada = null

const esAreaSimilar = (oldB, newB) => {
  if (!oldB || !newB) return false
  const latDiff = Math.abs(oldB[0][0] - newB[0][0])
  const lngDiff = Math.abs(oldB[0][1] - newB[0][1])
  return latDiff < 0.01 && lngDiff < 0.01
}

const onMapMove = (datosVista) => {
  clearTimeout(_moveTimer)

  _moveTimer = setTimeout(() => {
    // Si estamos mostrando puros CPs, ignorar re-fetch de área
    if (cpsSeleccionados.value.length > 0) return

    datosVistaPendiente.value = datosVista

    if (autoCargarSiguienteMove.value) {
      autoCargarSiguienteMove.value = false
      buscarEnAreaActiva()
      return
    }

    if (esAreaSimilar(ultimaAreaConsultada, datosVista.bounds)) {
      mostrarBotonBusquedaArea.value = false
      return
    }

    mostrarBotonBusquedaArea.value = true
  }, 300)
}

const buscarEnAreaActiva = async () => {
  if (!datosVistaPendiente.value) return

  mostrarBotonBusquedaArea.value = false
  const { nivel, bounds, zoom } = datosVistaPendiente.value

  ultimaAreaConsultada = bounds

  if (nivel === 'estado') {
    modoMapa.value = 'estado'
  } else if (nivel === 'municipio') {
    modoMapa.value = 'clusters'
    await store.fetchMapaDatos(route.params.id, { bounds, nivel, zoom }, 'clusters')
  } else if (nivel === 'punto' && tieneCoordenadas.value) {
    modoMapa.value = 'puntos'
    await store.fetchMapaDatos(route.params.id, { bounds, nivel, zoom }, 'puntos')
  }
}

const onZoomNivel = (nivel) => {
  nivelActual.value = nivel
}

const onClusterClick = () => {
  autoCargarSiguienteMove.value = true
  mostrarBotonBusquedaArea.value = false
}

const irANivel = (nivel) => {
  mostrarBotonBusquedaArea.value = false
  if (nivel === 'estado') {
    limpiarTodosFiltros()
  } else if (nivel === 'municipio' && municipiosSeleccionados.value.length > 0) {
    // Vuela al último municipio agregado
    const lastMun = municipiosSeleccionados.value[municipiosSeleccionados.value.length - 1]
    mapRef.value?.zoomToMunicipio(lastMun.nombre)
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

const volarARegistro = (r) => {
  if (r?.latitud && r?.longitud)
    mapRef.value?.flyToRegistro(Number(r.latitud), Number(r.longitud), 16)
}

// ── Ciclo de Vida ───────────────────────────────────────────────────────────
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

onUnmounted(() => {
  clearTimeout(_closeTimer)
  clearTimeout(_moveTimer)
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-12px) translateX(-50%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
