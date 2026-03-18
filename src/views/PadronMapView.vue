<template>
  <div class="h-screen w-full flex flex-col relative overflow-hidden bg-slate-50">
    <div class="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-md px-4">
      <div
        class="bg-white rounded-full shadow-2xl flex items-center px-4 py-2.5 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all"
      >
        <Search :size="16" class="text-blue-500 mr-2 shrink-0" />
        <input
          v-model="busqueda"
          @input="onInputBusqueda"
          placeholder="Buscar municipio..."
          class="flex-1 bg-transparent outline-none text-slate-800 font-bold text-sm"
        />
        <button v-if="busqueda" @click="limpiarBusqueda" class="text-gray-400">
          <X :size="16" />
        </button>
      </div>

      <div
        v-if="resultadosBusqueda.length"
        class="absolute top-14 left-4 right-4 bg-white rounded-2xl shadow-xl border overflow-hidden z-10"
      >
        <div
          v-for="res in resultadosBusqueda"
          :key="res.municipio_estandarizado"
          @click="seleccionarMunicipio(res)"
          class="px-5 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b last:border-0"
        >
          <span class="text-sm font-bold text-slate-800">{{ res.municipio_estandarizado }}</span>
          <MapPin :size="14" class="text-blue-500" />
        </div>
      </div>
    </div>

    <div class="absolute top-20 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
      <button
        @click="router.back()"
        class="bg-slate-900 text-white p-3 rounded-xl shadow-xl flex items-center gap-2 hover:bg-blue-600 transition-all pointer-events-auto w-fit"
      >
        <ArrowLeft :size="16" />
        <span class="font-bold text-xs">Regresar</span>
      </button>

      <div
        class="bg-white/90 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border border-white pointer-events-auto w-fit min-w-[160px]"
      >
        <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
          Nivel Actual
        </p>
        <div class="flex items-center gap-2">
          <component :is="nivelIcon" :size="14" :class="nivelColor" />
          <span class="text-sm font-black text-slate-800 capitalize">{{ nivelLabel }}</span>
        </div>
        <p class="text-[10px] text-blue-600 mt-1 font-bold">
          {{ totalContador }} registros en vista
        </p>
      </div>

      <!-- Indicador de consulta en progreso -->
      <Transition name="fade">
        <div
          v-if="store.mapLoading"
          class="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl pointer-events-auto w-fit"
        >
          <div
            class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"
          ></div>
          <span class="text-xs font-black tracking-widest uppercase">Consultando</span>
        </div>
      </Transition>
    </div>

    <div class="absolute top-20 right-4 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
      <button
        v-for="btn in botonesNivel"
        :key="btn.nivel"
        @click="irANivel(btn.nivel)"
        :class="[
          'w-10 h-10 rounded-xl shadow-lg flex items-center justify-center transition-all',
          nivelActual === btn.nivel ? 'bg-blue-600 text-white' : 'bg-white text-slate-500',
        ]"
      >
        <component :is="btn.icon" :size="16" />
      </button>
    </div>

    <main class="flex-1 relative z-0">
      <MapView
        ref="mapRef"
        :registros="registrosActuales"
        :modo="modoMapa"
        :datos-coropletas="datosCoropletas"
        :municipio-filtro="municipioSeleccionado?.nombre"
        @view-change="onMapMove"
        @zoom-nivel="onZoomNivel"
        @select="onSelectRegistro"
        @municipio-click="onMunicipioClick"
      />
    </main>

    <aside
      class="absolute bottom-0 right-0 z-[3000] bg-white shadow-2xl transition-transform duration-500 border-l w-full md:w-96 md:h-full"
      :class="
        panelVisible ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'
      "
    >
      <div v-if="statsAgnosticas && !registroSeleccionado" class="p-6">
        <div class="flex justify-between items-start mb-6">
          <h3 class="font-black text-2xl text-slate-800">{{ statsAgnosticas.municipio }}</h3>
          <button @click="limpiarMunicipio" class="p-2 bg-slate-100 rounded-full">
            <X :size="16" />
          </button>
        </div>
        <div class="bg-blue-600 p-5 rounded-2xl text-white">
          <p class="text-[10px] font-bold uppercase opacity-80 mb-1">Total Municipio</p>
          <p class="text-4xl font-black">
            {{ Number(statsAgnosticas.stats?.total_registros || 0).toLocaleString() }}
          </p>
        </div>
      </div>

      <div v-else-if="registroSeleccionado" class="p-6">
        <div class="flex justify-between items-start mb-6">
          <h3 class="font-black text-lg text-slate-800">
            {{ registroSeleccionado.nombre_completo }}
          </h3>
          <button @click="registroSeleccionado = null" class="p-2 bg-slate-100 rounded-full">
            <X :size="16" />
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePadronStore } from '@/stores/padronStore'
import MapView from '@/components/MapView.vue'
import { Search, X, MapPin, ArrowLeft, Map, Building2, Crosshair } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = usePadronStore()

// ESTADO
const mapRef = ref(null)
const nivelActual = ref('estado')
const modoMapa = ref('estado')
const registroSeleccionado = ref(null)
const municipioSeleccionado = ref(null)
const datosCoropletas = ref([])
const statsAgnosticas = ref(null)
const tieneCoordenadas = ref(true)

// BUSCADOR
const busqueda = ref('')
const resultadosBusqueda = ref([])

// NIVELES SIMPLIFICADOS
const botonesNivel = computed(() => {
  const base = [
    { nivel: 'estado', icon: Map },
    { nivel: 'municipio', icon: Building2 },
  ]
  if (tieneCoordenadas.value) base.push({ nivel: 'punto', icon: Crosshair })
  return base
})

const nivelConfig = {
  estado: { label: 'Estado', icon: Map, color: 'text-slate-400' },
  municipio: { label: 'Municipio', icon: Building2, color: 'text-blue-500' },
  punto: { label: 'Detalle', icon: Crosshair, color: 'text-emerald-500' },
}

const nivelLabel = computed(() => nivelConfig[nivelActual.value]?.label)
const nivelIcon = computed(() => nivelConfig[nivelActual.value]?.icon)
const nivelColor = computed(() => nivelConfig[nivelActual.value]?.color)

const panelVisible = computed(() => !!statsAgnosticas.value || !!registroSeleccionado.value)

const registrosActuales = computed(() => {
  if (modoMapa.value === 'clusters') return store.clusters
  if (modoMapa.value === 'puntos') return store.beneficiarios
  return []
})

const totalContador = computed(() => {
  const total =
    modoMapa.value === 'clusters'
      ? store.clusters.reduce((a, c) => a + (parseInt(c.count) || 0), 0)
      : store.beneficiarios.length
  return total.toLocaleString()
})

// ACCIONES
const onMapMove = async (coords) => {
  const { nivel } = coords
  const municipio = municipioSeleccionado.value?.nombre || null

  if (nivel === 'estado') {
    modoMapa.value = 'estado'
  } else if (nivel === 'municipio') {
    modoMapa.value = 'clusters'
    await store.fetchMapaDatos(route.params.id, { ...coords, municipio }, 'clusters')
  } else if (nivel === 'punto' && tieneCoordenadas.value) {
    modoMapa.value = 'puntos'
    await store.fetchMapaDatos(route.params.id, { ...coords, municipio }, 'puntos')
  }
}

const onZoomNivel = (nivel) => (nivelActual.value = nivel)

const onMunicipioClick = async (props) => {
  municipioSeleccionado.value = props
  statsAgnosticas.value = await store.fetchResumenAgnostico(route.params.id, props.nombre)
  if (nivelActual.value === 'estado') mapRef.value?.zoomToMunicipio(props.nombre)
}

const irANivel = (nivel) => {
  if (nivel === 'estado') {
    limpiarMunicipio()
    mapRef.value?.resetView()
  } else if (nivel === 'municipio' && municipioSeleccionado.value) {
    mapRef.value?.zoomToMunicipio(municipioSeleccionado.value.nombre)
  }
}

const limpiarMunicipio = () => {
  municipioSeleccionado.value = null
  statsAgnosticas.value = null
  registroSeleccionado.value = null
}

const onSelectRegistro = (r) => {
  registroSeleccionado.value = r
  // Aquí podrías disparar el fetch del detalle si es necesario
}

// Búsqueda...
const onInputBusqueda = async () => {
  if (busqueda.value.length < 2) return
  resultadosBusqueda.value = await store.buscarPersona(route.params.id, busqueda.value)
}

const seleccionarMunicipio = (res) => {
  const nombre = res.municipio_estandarizado
  busqueda.value = ''
  resultadosBusqueda.value = []
  onMunicipioClick({ nombre })
}

onMounted(async () => {
  const resumen = await store.fetchResumenAgnostico(route.params.id)
  if (Array.isArray(resumen)) {
    datosCoropletas.value = resumen
    tieneCoordenadas.value = resumen.some((r) => r.tiene_coordenadas)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
