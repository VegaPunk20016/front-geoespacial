<template>
  <div class="h-screen w-full flex flex-col relative overflow-hidden bg-slate-50">
    <div
      class="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-[95%] md:max-w-xl px-2 md:px-4 pointer-events-auto"
    >
      <div
        class="bg-white rounded-full shadow-2xl flex items-center px-4 md:px-5 py-2 md:py-3 border border-gray-200 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all"
      >
        <Search size="18" class="text-blue-500 mr-2 md:mr-3" />
        <input
          v-model="busqueda"
          @input="onInputBusqueda"
          placeholder="Buscar municipio..."
          class="flex-1 bg-transparent outline-none text-slate-800 font-bold text-xs md:text-sm"
        />
        <div
          v-if="buscando"
          class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"
        ></div>
        <button v-if="busqueda" @click="limpiarBusqueda">
          <X size="18" class="text-gray-400" />
        </button>
      </div>

      <div
        v-if="resultadosBusqueda.length > 0"
        class="absolute top-14 md:top-16 left-2 right-2 md:left-4 md:right-4 bg-white rounded-2xl shadow-xl border overflow-hidden"
      >
        <div
          v-for="res in resultadosBusqueda"
          :key="res.municipio_estandarizado"
          @click="seleccionarResultado(res)"
          class="px-5 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0 group"
        >
          <div>
            <p class="text-sm font-bold text-slate-800">{{ res.municipio_estandarizado }}</p>
            <p class="text-[10px] text-blue-600 font-black uppercase tracking-tighter">
              {{ Number(res.total_registros).toLocaleString() }} registros
            </p>
          </div>
          <MapPin size="16" class="text-gray-300 group-hover:text-blue-500" />
        </div>
      </div>
    </div>

    <div
      class="absolute top-20 md:top-24 left-2 md:left-6 z-[1000] flex flex-col gap-2 md:gap-3 pointer-events-none"
    >
      <button
        @click="router.back()"
        class="bg-slate-900 text-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl flex items-center gap-2 md:gap-3 hover:bg-blue-600 transition-all pointer-events-auto w-fit"
      >
        <ArrowLeft size="16" class="md:w-5 md:h-5" />
        <span class="font-bold text-xs md:text-sm">Regresar</span>
      </button>

      <div
        class="bg-white/90 backdrop-blur-md px-3 md:px-5 py-2 md:py-4 rounded-2xl md:rounded-3xl shadow-xl border border-white pointer-events-auto w-fit md:w-72"
      >
        <p
          class="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1"
        >
          Carga Actual
        </p>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span class="text-xl md:text-3xl font-black text-slate-800 tracking-tighter">{{
            totalContador
          }}</span>
        </div>
      </div>
    </div>

    <main class="flex-1 relative z-0">
      <MapView
        :registros="modoActual === 'puntos' ? store.beneficiarios : store.clusters"
        :modo="modoActual"
        :datos-coropletas="datosCoropletas"
        :seleccionado="registroSeleccionado"
        :municipio-filtro="municipioSeleccionado?.nombre || null"
        @view-change="onMapMove"
        @select="(r) => (registroSeleccionado = r)"
        @municipio-click="(m) => (municipioSeleccionado = m)"
      />
    </main>

    <div
      class="absolute bottom-0 md:top-0 right-0 z-[3000] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl transition-transform duration-500 ease-in-out border-t md:border-t-0 md:border-l flex flex-col w-full h-[75vh] md:h-full md:w-96 rounded-t-[2.5rem] md:rounded-t-none"
      :class="[
        registroSeleccionado || statsAgnosticas
          ? 'translate-y-0 md:translate-x-0'
          : 'translate-y-full md:translate-x-full',
      ]"
    >
      <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 md:hidden shrink-0"></div>

      <div
        v-if="statsAgnosticas && !registroSeleccionado"
        class="p-6 md:p-8 h-full overflow-y-auto custom-scrollbar"
      >
        <div class="flex justify-between items-start mb-6">
          <h3 class="font-black text-2xl md:text-3xl text-slate-800 uppercase leading-tight">
            {{ statsAgnosticas.municipio }}
          </h3>
          <button
            @click="limpiarFiltroMunicipio"
            class="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <X size="20" />
          </button>
        </div>

        <div
          class="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[2rem] text-white mb-8 shadow-xl shadow-blue-200"
        >
          <p class="text-[10px] font-black uppercase opacity-70 tracking-widest mb-1">
            Total Municipio
          </p>
          <p class="text-4xl md:text-5xl font-black">
            {{ Number(statsAgnosticas.stats.total_registros).toLocaleString() }}
          </p>
        </div>

        <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
          Análisis del Padrón
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 pb-10">
          <div v-for="(val, key) in statsAgnosticas.stats" :key="key">
            <div
              v-if="key.startsWith('sum_') && val > 0"
              class="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors"
            >
              <div class="flex justify-between items-end mb-2">
                <span class="text-[10px] font-black text-slate-500 uppercase">{{
                  key.replace('sum_', '').replace(/_/g, ' ')
                }}</span>
                <span class="text-sm font-black text-slate-800">{{
                  Number(val).toLocaleString()
                }}</span>
              </div>
              <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  class="bg-blue-600 h-full transition-all duration-1000"
                  :style="{
                    width: Math.min((val / statsAgnosticas.stats.total_registros) * 100, 100) + '%',
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="registroSeleccionado"
        class="p-6 md:p-8 h-full overflow-y-auto custom-scrollbar"
      >
        <div class="flex justify-between items-start mb-6">
          <h3 class="font-black text-xl md:text-2xl text-slate-800 leading-tight">
            {{ registroSeleccionado.nombre_completo }}
          </h3>
          <button @click="registroSeleccionado = null" class="p-2 bg-gray-100 rounded-full">
            <X size="20" />
          </button>
        </div>
        <div class="grid grid-cols-1 gap-3 pb-10">
          <div
            v-for="(v, k) in parseExtra(registroSeleccionado.datos_generales)"
            :key="k"
            class="bg-slate-50 p-4 rounded-2xl border border-slate-100"
          >
            <p class="text-[9px] font-black text-gray-400 uppercase mb-1">
              {{ k.replace(/_/g, ' ') }}
            </p>
            <p class="text-sm font-bold text-slate-800">{{ v }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePadronStore } from '@/stores/padronStore'
import MapView from '@/components/MapView.vue'
import { Search, X, MapPin, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = usePadronStore()

const modoActual = ref('clusters')
const registroSeleccionado = ref(null)
const municipioSeleccionado = ref(null)
const datosCoropletas = ref([])
const statsAgnosticas = ref(null)
const busqueda = ref('')
const resultadosBusqueda = ref([])
const buscando = ref(false)

const totalContador = computed(() => {
  const data = modoActual.value === 'clusters' ? store.clusters : store.beneficiarios
  if (modoActual.value === 'clusters') {
    return data.reduce((acc, c) => acc + parseInt(c.count || 0), 0).toLocaleString()
  }
  return data.length.toLocaleString()
})

const onMapMove = async (coords) => {
  const modo = coords.zoom >= 14 ? 'puntos' : 'clusters'
  modoActual.value = modo
  const filtros = { ...coords, municipio: municipioSeleccionado.value?.nombre || null }
  await store.fetchMapaDatos(route.params.id, filtros, modo)
}

const onInputBusqueda = () => {
  if (busqueda.value.length < 2) return
  buscando.value = true
  clearTimeout(window.stimer)
  window.stimer = setTimeout(async () => {
    resultadosBusqueda.value = await store.buscarPersona(route.params.id, busqueda.value)
    buscando.value = false
  }, 400)
}

const seleccionarResultado = (res) => {
  municipioSeleccionado.value = { nombre: res.municipio_estandarizado }
  limpiarBusqueda()
}

const onMunicipioClick = (m) => {
  registroSeleccionado.value = null // Cerrar persona si se abre municipio
  municipioSeleccionado.value = m
}

const limpiarFiltroMunicipio = () => {
  municipioSeleccionado.value = null
  statsAgnosticas.value = null
}

const limpiarBusqueda = () => {
  busqueda.value = ''
  resultadosBusqueda.value = []
}
const parseExtra = (d) => {
  try {
    return typeof d === 'string' ? JSON.parse(d) : d
  } catch {
    return {}
  }
}

watch(
  () => municipioSeleccionado.value,
  async (n) => {
    if (n) {
      statsAgnosticas.value = await store.fetchResumenAgnostico(route.params.id, n.nombre)
    } else {
      statsAgnosticas.value = null
    }
  },
)

onMounted(async () => {
  datosCoropletas.value = await store.fetchResumenAgnostico(route.params.id)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
