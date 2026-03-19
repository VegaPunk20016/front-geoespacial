<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('close')"></div>

      <div
        class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div class="px-8 py-6 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h3 class="text-xl font-black text-slate-800 tracking-tight">Editar Registro</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              ID: {{ dato.id }}
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X :size="20" class="text-slate-500" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <section>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-1 h-4 bg-primary rounded-full"></div>
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-700">
                Ubicación e Información Base
              </h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1"
                  >Ubicación Geográfica</label
                >
                <MiniMapa
                  map-id="map-update"
                  :lat="formFijo.latitud"
                  :lng="formFijo.longitud"
                  :municipio-seleccionado="formFijo.municipio"
                  @update:location="sincronizarDesdeMapa"
                />
              </div>

              <div class="md:col-span-2 space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1"
                  >Nombre Completo</label
                >
                <input
                  v-model="formFijo.nombre_completo"
                  type="text"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Municipio</label>
                <select
                  v-model="formFijo.municipio"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium transition-all"
                >
                  <option value="">Seleccionar municipio...</option>
                  <option v-for="mun in listaMunicipios" :key="mun" :value="mun">{{ mun }}</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1"
                  >Código Postal</label
                >
                <input
                  v-model="formFijo.codigo_postal"
                  type="text"
                  readonly
                  placeholder="Autodetectado..."
                  class="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-primary outline-none cursor-default"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Sección</label>
                <input
                  v-model="formFijo.seccion"
                  type="text"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Latitud</label>
                  <input
                    v-model.number="formFijo.latitud"
                    type="number"
                    step="any"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1"
                    >Longitud</label
                  >
                  <input
                    v-model.number="formFijo.longitud"
                    type="number"
                    step="any"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h4 class="text-xs font-black uppercase tracking-widest text-slate-700">
                  Datos Adicionales (JSON)
                </h4>
              </div>
              <button
                @click="agregarCampoNuevo"
                class="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus :size="12" /> AGREGAR CAMPO
              </button>
            </div>

            <div
              class="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-300 space-y-4"
            >
              <div
                v-for="(valor, llave) in formExtra"
                :key="llave"
                class="flex gap-3 items-end group"
              >
                <div class="flex-1 space-y-1.5">
                  <label class="text-[9px] font-black text-slate-400 uppercase ml-1">{{
                    llave
                  }}</label>
                  <input
                    v-model="formExtra[llave]"
                    type="text"
                    class="w-full px-4 py-2 rounded-lg border border-white focus:border-slate-300 outline-none text-sm transition-all shadow-sm"
                  />
                </div>
                <button
                  @click="eliminarCampoExtra(llave)"
                  class="mb-1 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 :size="16" />
                </button>
              </div>

              <div v-if="Object.keys(formExtra).length === 0" class="text-center py-6">
                <p class="text-xs text-slate-400 italic">No hay atributos adicionales.</p>
              </div>
            </div>
          </section>
        </div>

        <div class="px-8 py-6 bg-slate-50 border-t flex items-center justify-end gap-3">
          <button
            @click="$emit('close')"
            class="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="ejecutarGuardado"
            :disabled="loading"
            class="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
          >
            <Loader2 v-if="loading" class="animate-spin" :size="14" />
            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { X, Plus, Trash2, Loader2 } from 'lucide-vue-next'
import { usePadronStore } from '@/stores/padronStore'
import MiniMapa from './MiniMapa.vue'
import dataMun from '@/data/edomex_municipios.json'
import L from 'leaflet'

const props = defineProps({
  padronId: { type: String, required: true },
  dato: { type: Object, required: true },
  show: { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'updated'])
const padronStore = usePadronStore()
const loading = ref(false)

const formFijo = ref({
  nombre_completo: '',
  municipio: '',
  codigo_postal: '',
  seccion: '',
  latitud: null,
  longitud: null,
})

const formExtra = ref({})

// Lista de municipios para el Dropdown
const listaMunicipios = computed(() => {
  return dataMun.features.map((f) => f.properties.nombre).sort((a, b) => a.localeCompare(b))
})

onMounted(() => {
  // Inicializar campos fijos
  formFijo.value = {
    nombre_completo: props.dato.nombre_completo || '',
    municipio: props.dato.municipio || '',
    seccion: props.dato.seccion || '',
    latitud: props.dato.latitud || null,
    longitud: props.dato.longitud || null,
    codigo_postal: '',
  }

  // Inicializar JSON dinámico y recuperar CP guardado si existe
  if (props.dato.datos_generales) {
    try {
      const data =
        typeof props.dato.datos_generales === 'string'
          ? JSON.parse(props.dato.datos_generales)
          : props.dato.datos_generales
      formExtra.value = { ...data }

      if (data.CP_DETECTADO) formFijo.value.codigo_postal = data.CP_DETECTADO
    } catch (e) {
      console.error('Error al parsear JSON', e)
      formExtra.value = {}
    }
  }
})

// REGLA 1: Sincronización inteligente desde el MiniMapa (Pin movido o CP detectado)
const sincronizarDesdeMapa = (geoData) => {
  formFijo.value.latitud = geoData.lat
  formFijo.value.longitud = geoData.lng

  // Si el mapa detectó un municipio real, lo seleccionamos
  if (geoData.municipio) {
    formFijo.value.municipio = geoData.municipio
  }

  // Si el mapa detectó un CP, lo asignamos
  if (geoData.cp) {
    formFijo.value.codigo_postal = geoData.cp
  }
}

// REGLA 2: Sincronización desde Dropdown hacia Mapa (Agnóstico)
// Al cambiar el municipio en la lista, si no hay coordenadas, sugerimos el centro
watch(
  () => formFijo.value.municipio,
  (nuevoMun) => {
    if (!nuevoMun) return

    const munMatch = dataMun.features.find((f) => f.properties.nombre === nuevoMun)
    // Solo reubicamos si la latitud es nula o la default (agnóstico)
    if (munMatch && (!formFijo.value.latitud || !formFijo.value.longitud)) {
      const layer = L.geoJSON(munMatch)
      const centro = layer.getBounds().getCenter()
      formFijo.value.latitud = parseFloat(centro.lat.toFixed(7))
      formFijo.value.longitud = parseFloat(centro.lng.toFixed(7))
    }
  },
)

const agregarCampoNuevo = () => {
  const nombre = prompt('Nombre del nuevo atributo (ej: TELEFONO, EDAD):')
  if (nombre) {
    const key = nombre.toUpperCase().replace(/\s+/g, '_')
    formExtra.value[key] = ''
  }
}

const eliminarCampoExtra = (key) => {
  if (confirm(`¿Eliminar el atributo "${key}"?`)) {
    delete formExtra.value[key]
  }
}

const ejecutarGuardado = async () => {
  loading.value = true
  try {
    // Persistencia: Guardamos el CP detectado en el JSON de respaldo
    const payloadExtra = { ...formExtra.value }
    if (formFijo.value.codigo_postal) {
      payloadExtra.CP_DETECTADO = formFijo.value.codigo_postal
    }

    await padronStore.editarBeneficiario(props.padronId, props.dato.id, {
      campos_fijos: formFijo.value,
      datos_generales: payloadExtra,
    })
    emit('updated')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
