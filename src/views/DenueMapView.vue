<template>
  <div class="h-[calc(100vh-80px)] flex bg-slate-50 overflow-hidden relative font-sans">
    <aside
      class="absolute md:relative z-40 w-80 h-full bg-white border-r border-slate-200 shadow-2xl md:shadow-none transition-transform duration-300 flex flex-col"
      :class="isFiltersOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <div class="p-6 border-b border-slate-100 bg-slate-50/50">
        <button
          @click="router.back()"
          class="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest mb-4 transition-colors group"
        >
          <ArrowLeft :size="14" class="group-hover:-translate-x-1 transition-transform" />
          Volver al catálogo
        </button>

        <h2 class="text-lg font-black text-slate-800 flex items-center gap-2 italic">
          <Search :size="20" class="text-blue-600" /> MODO CONSULTA
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-8 custom-scroll">
        <div class="space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"
            >Fuente de Datos</label
          >
          <div class="p-4 bg-slate-900 rounded-2xl shadow-lg border border-slate-800">
            <p class="text-sm font-bold text-white mb-1">
              {{ padronActivo?.nombre_padron || 'Cargando...' }}
            </p>
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold rounded-full uppercase border border-blue-500/30"
              >
                {{ padronActivo?.categoria }}
              </span>
              <span class="text-[9px] text-slate-500 font-medium italic">Solo lectura</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"
            >Filtro Territorial</label
          >
          <div class="relative group">
            <Search
              :size="16"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            />
            <input
              v-model="busquedaMunicipio"
              @focus="dropdownAbierto = true"
              @blur="cerrarDropdownDelay"
              placeholder="Buscar municipio..."
              class="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
            />
          </div>

          <div
            v-if="dropdownAbierto && municipiosFiltrados.length"
            class="mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scroll z-50"
          >
            <div
              v-for="mun in municipiosFiltrados"
              :key="mun.cvegeo"
              @mousedown.prevent="elegirMunicipio(mun)"
              class="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
            >
              <span class="text-sm font-bold text-slate-700">{{ mun.nombre }}</span>
              <span class="text-[9px] font-mono text-slate-300">#{{ mun.cvegeo }}</span>
            </div>
          </div>
        </div>

        <div v-if="padronSeleccionadoId" class="pt-4 border-t border-slate-100 space-y-3">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"
            >Herramientas</label
          >
          <button
            @click="descargarPDF"
            class="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:border-red-500 hover:text-red-500 transition-all active:scale-95 shadow-sm"
          >
            <FileText :size="16" /> GENERAR REPORTE PDF
          </button>
        </div>
      </div>

      <div class="p-4 border-t border-slate-100 bg-slate-50 text-center">
        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          {{ totalEnVista }} registros en mapa
        </p>
      </div>
    </aside>

    <main class="flex-1 relative bg-slate-200">
      <MapView
        v-if="padronSeleccionadoId"
        ref="mapRef"
        :registros="registrosActuales"
        :modo="modoMapa"
        :datos-coropletas="datosCoropletas"
        :municipio-filtro="municipioSeleccionado?.nombre ?? null"
        @view-change="onMapMove"
        @zoom-nivel="onZoomNivel"
        @select="onSelectRegistro"
        @municipio-click="onMunicipioClick"
        @seccion-click="onSeccionClick"
      />

      <Transition name="slide-up-banner">
        <div
          v-if="resumenMunicipioActivo || cargandoResumenMunicipio"
          class="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1001] w-[95%] max-w-3xl px-4"
        >
          <div
            class="relative bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div
              v-if="cargandoResumenMunicipio"
              class="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse"
            ></div>

            <div class="p-8">
              <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-5">
                  <div
                    class="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-inner"
                  >
                    <Building2
                      v-if="!resumenMunicipioActivo?.seccion"
                      :size="24"
                      class="text-blue-400"
                    />
                    <Hash v-else :size="24" class="text-cyan-400" />
                  </div>
                  <div class="flex flex-col">
                    <span
                      class="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1"
                    >
                      {{
                        resumenMunicipioActivo?.seccion
                          ? 'Análisis de Sección Electoral'
                          : 'Análisis Geográfico Municipal'
                      }}
                    </span>
                    <h4
                      class="text-3xl font-black text-white tracking-tighter leading-tight italic"
                    >
                      {{ resumenMunicipioActivo?.municipio }}
                    </h4>
                  </div>
                </div>
                <button
                  @click="resumenMunicipioActivo = null"
                  class="p-3 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-full transition-all group"
                >
                  <X :size="20" class="text-white/30 group-hover:text-red-400" />
                </button>
              </div>

              <div v-if="resumenMunicipioActivo" class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                  <div
                    class="flex flex-col justify-center p-6 bg-white/5 border border-white/10 rounded-[1.5rem] hover:bg-white/10 transition-colors"
                  >
                    <span
                      class="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mb-2"
                      >Registros Totales</span
                    >
                    <div class="flex items-baseline gap-2">
                      <span class="text-4xl font-black text-white tabular-nums leading-none">
                        {{ resumenMunicipioActivo.total?.toLocaleString() }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="resumenMunicipioActivo.meta?.clave_muestra"
                    class="flex flex-col justify-center p-6 bg-blue-500/5 border border-blue-500/20 rounded-[1.5rem]"
                  >
                    <span
                      class="text-[10px] font-bold text-blue-400/60 uppercase tracking-[0.1em] mb-2"
                      >Clave de Zona</span
                    >
                    <div class="flex items-center gap-3">
                      <Database :size="18" class="text-blue-500/40" />
                      <span
                        class="text-2xl font-mono font-bold text-blue-100 leading-none truncate"
                      >
                        {{ resumenMunicipioActivo.meta.clave_muestra }}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  class="relative bg-black/20 rounded-[2rem] border border-white/5 overflow-hidden"
                >
                  <div
                    class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 overflow-y-auto pr-4 custom-scroll max-h-[180px] p-6"
                  >
                    <div
                      v-for="item in resumenMunicipioActivo.detalles"
                      :key="item.label"
                      class="flex flex-col border-l-2 border-white/5 pl-3 hover:border-blue-500/50 transition-all group"
                    >
                      <span
                        class="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-1 truncate group-hover:text-blue-400/50 transition-colors"
                      >
                        {{ item.label }}
                      </span>
                      <span class="text-[13px] font-bold text-slate-200 tabular-nums truncate">
                        {{ item.value || '—' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </main>

    <aside
      v-if="registroSeleccionado"
      class="absolute right-0 top-0 z-[1600] w-96 h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col"
    >
      <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3
          class="font-black text-slate-800 text-xs uppercase tracking-widest italic flex items-center gap-2"
        >
          <FileText :size="16" class="text-blue-600" /> Expediente del Registro
        </h3>
        <button
          @click="registroSeleccionado = null"
          class="p-2 text-slate-400 hover:text-red-500 transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-8 space-y-6 custom-scroll bg-white">
        <div v-if="cargandoDetalle" class="space-y-4">
          <div v-for="i in 5" :key="i" class="h-14 bg-slate-50 animate-pulse rounded-xl"></div>
        </div>
        <template v-else>
          <div v-for="(val, key) in camposFijosRegistro" :key="key" class="group">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {{ key }}
            </p>
            <p
              class="text-sm font-bold text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-blue-50 transition-colors"
            >
              {{ val }}
            </p>
          </div>
          <div class="h-px bg-slate-100 w-full my-6"></div>
          <div v-for="(v, k) in datosExtra" :key="k" class="group">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {{ k.replace(/_/g, ' ') }}
            </p>
            <p
              class="text-sm font-semibold text-slate-600 bg-slate-50/30 p-4 rounded-xl border border-slate-50 group-hover:bg-slate-50 transition-colors"
            >
              {{ v }}
            </p>
          </div>
        </template>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePadronStore } from '@/stores/padronStore'
import { useMunicipios } from '@/composables/useMunicipios'
import MapView from '@/components/MapView.vue'
import {
  Search,
  Building2,
  Hash,
  X,
  ArrowLeft,
  Database,
  FileText,
  MapPin,
  Crosshair,
  Map as MapIcon,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const store = usePadronStore()
const { todos: todosMunicipios, normalizar } = useMunicipios()

// ── Estado ─────────────────────────────────────────────────────────────────
const mapRef = ref(null)
const isFiltersOpen = ref(false)
const padronSeleccionadoId = ref(route.params.id || '')
const modoMapa = ref('estado')
const nivelActual = ref('estado')
const municipioSeleccionado = ref(null)
const datosCoropletas = ref([])
const resumenMunicipioActivo = ref(null)
const cargandoResumenMunicipio = ref(false)
const registroSeleccionado = ref(null)
const cargandoDetalle = ref(false)
const tieneCoordenadas = ref(false)

const busquedaMunicipio = ref('')
const dropdownAbierto = ref(false)
let _moveTimer = null

// ── Computadas ──────────────────────────────────────────────────────────────
const padronActivo = computed(
  () => store.padrones.find((p) => p.id === padronSeleccionadoId.value) ?? null,
)
const registrosActuales = computed(() =>
  modoMapa.value === 'clusters' ? store.clusters : store.beneficiarios,
)
const totalEnVista = computed(() => {
  if (modoMapa.value === 'clusters')
    return store.clusters.reduce((a, c) => a + (parseInt(c.count) || 0), 0).toLocaleString()
  return store.beneficiarios.length.toLocaleString()
})

const municipiosFiltrados = computed(() => {
  const q = normalizar(busquedaMunicipio.value)
  if (!q) return todosMunicipios
  return todosMunicipios.filter((m) => m._norm?.includes(q) || m.nombre.toLowerCase().includes(q))
})

const camposFijosRegistro = computed(() => {
  const r = registroSeleccionado.value
  if (!r) return {}
  const items = {
    'Clave única': r.clave_unica,
    Nombre: r.nombre_completo,
    Municipio: r.municipio,
    Sección: r.seccion,
  }
  return Object.fromEntries(Object.entries(items).filter(([, v]) => v))
})

const datosExtra = computed(() => {
  const d = registroSeleccionado.value?.datos_generales
  if (!d) return {}
  const obj = typeof d === 'string' ? JSON.parse(d) : d
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v))
})

// ── Métodos ────────────────────────────────────────────────────────────────
const elegirMunicipio = (mun) => {
  busquedaMunicipio.value = mun.nombre
  dropdownAbierto.value = false
  onMunicipioClick({ nombre: mun.nombre })
}

const cerrarDropdownDelay = () => setTimeout(() => (dropdownAbierto.value = false), 200)

const onMapMove = (coords) => {
  clearTimeout(_moveTimer)
  _moveTimer = setTimeout(async () => {
    if (!padronSeleccionadoId.value) return
    const { nivel } = coords
    const municipio = municipioSeleccionado.value?.nombre ?? null
    modoMapa.value = nivel === 'estado' ? 'estado' : nivel === 'municipio' ? 'clusters' : 'puntos'
    if (modoMapa.value !== 'estado') {
      await store.fetchMapaDatos(
        padronSeleccionadoId.value,
        { ...coords, municipio },
        modoMapa.value,
      )
    }
  }, 500)
}

const onZoomNivel = (nivel) => (nivelActual.value = nivel)

const onMunicipioClick = async ({ nombre }) => {
  municipioSeleccionado.value = { nombre }
  cargandoResumenMunicipio.value = true
  resumenMunicipioActivo.value = null

  if (mapRef.value?.limpiarSecciones) mapRef.value.limpiarSecciones()

  try {
    const data = await store.fetchResumenAgnostico(padronSeleccionadoId.value, nombre)
    if (data) {
      resumenMunicipioActivo.value = data
      await nextTick()
      if (data.hay_secciones) mapRef.value?.dibujarSecciones(data)
      mapRef.value?.zoomToMunicipio(nombre)
    }
  } finally {
    cargandoResumenMunicipio.value = false
  }
}

const onSeccionClick = (payload) => {
  resumenMunicipioActivo.value = {
    municipio: `SECCIÓN ${payload.seccion}`,
    total: payload.detalles?.length || 0,
    detalles: payload.detalles,
    seccion: payload.seccion,
    meta: { clave_muestra: payload.meta?.clave },
  }
}

const onSelectRegistro = async (r) => {
  registroSeleccionado.value = r
  cargandoDetalle.value = true
  const detalle = await store.fetchDetalleBeneficiario(padronSeleccionadoId.value, r.id)
  registroSeleccionado.value = detalle ?? r
  cargandoDetalle.value = false
}

const descargarPDF = () => alert('Generando reporte PDF...')

onMounted(async () => {
  if (store.padrones.length === 0) await store.fetchPadrones()
  if (padronSeleccionadoId.value) {
    const resumen = await store.fetchResumenAgnostico(padronSeleccionadoId.value)
    if (Array.isArray(resumen)) datosCoropletas.value = resumen
  }
})
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 5px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.2);
  border-radius: 10px;
}

.slide-up-banner-enter-active,
.slide-up-banner-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-banner-enter-from,
.slide-up-banner-leave-to {
  opacity: 0;
  transform: translate(-50%, 100%) scale(0.9);
}
</style>
