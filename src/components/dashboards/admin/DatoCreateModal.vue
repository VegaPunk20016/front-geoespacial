<template>
  <Transition name="modal" appear>
    <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="handleClose"></div>

      <div
        class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <!-- HEADER -->
        <div class="px-8 py-6 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h3 class="text-xl font-black text-slate-800 tracking-tight">Nuevo Registro</h3>
            <p class="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">
              Añadir a {{ nombrePadron }}
            </p>
          </div>
          <button
            @click="handleClose"
            class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X :size="20" class="text-slate-500" />
          </button>
        </div>

        <!-- BODY -->
        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <!-- SECCIÓN: Datos Base -->
          <section>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-1 h-4 bg-primary rounded-full"></div>
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-700">
                Información Geográfica y Base
              </h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Mapa -->
              <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1"
                  >Ubicar en Mapa</label
                >
                <MiniMapa
                  map-id="map-create"
                  :lat="formFijo.latitud"
                  :lng="formFijo.longitud"
                  :municipio-seleccionado="formFijo.municipio"
                  @update:location="sincronizarDesdeMapa"
                />
              </div>

              <!-- Nombre -->
              <div class="md:col-span-2 space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  Nombre Completo / Razón Social
                </label>
                <input
                  v-model="formFijo.nombre_completo"
                  type="text"
                  placeholder="Ej. Juan Pérez o Empresa S.A."
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                />
              </div>

              <!-- Municipio -->
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

              <!-- CP (readonly, autodetectado) -->
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

              <!-- Sección -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Sección</label>
                <input
                  v-model="formFijo.seccion"
                  type="text"
                  placeholder="Ej. 1234"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <!-- Lat / Lng -->
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Latitud</label>
                  <input
                    v-model.number="formFijo.latitud"
                    type="number"
                    step="any"
                    class="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
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
                    class="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- SECCIÓN: Campos Extra -->
          <section>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="w-1 h-4 bg-amber-500 rounded-full"></div>
                <h4 class="text-xs font-black uppercase tracking-widest text-slate-700">
                  Campos Personalizados (JSON)
                </h4>
              </div>
              <button
                @click="agregarCampoExtra"
                class="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus :size="12" /> AGREGAR CAMPO
              </button>
            </div>

            <div v-if="cargandoPlantilla" class="py-6 text-center">
              <Loader2 class="animate-spin inline-block text-slate-300" :size="20" />
            </div>

            <div
              v-else
              class="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div
                v-for="(valor, llave) in formExtra"
                :key="llave"
                class="relative group flex gap-2 items-end"
              >
                <div class="flex-1 space-y-1">
                  <label class="text-[9px] font-black text-slate-400 uppercase ml-1">
                    {{ llave.replace(/_/g, ' ') }}
                  </label>
                  <input
                    v-model="formExtra[llave]"
                    type="text"
                    class="w-full px-4 py-2 rounded-lg border border-white text-sm shadow-sm focus:border-slate-300 outline-none"
                  />
                </div>
                <button
                  @click="quitarCampo(llave)"
                  class="mb-1 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 :size="15" />
                </button>
              </div>

              <p
                v-if="Object.keys(formExtra).length === 0"
                class="md:col-span-2 text-center py-4 text-xs text-slate-400 italic"
              >
                Presiona "Agregar campo" para insertar datos adicionales.
              </p>
            </div>
          </section>
        </div>

        <!-- FOOTER -->
        <div class="px-8 py-6 bg-slate-50 border-t flex items-center justify-end gap-3">
          <button
            @click="handleClose"
            class="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="crearRegistro"
            :disabled="loading"
            class="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
          >
            <Loader2 v-if="loading" class="animate-spin" :size="14" />
            {{ loading ? 'Guardando...' : 'Crear Registro' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { X, Plus, Trash2, Loader2 } from 'lucide-vue-next'
import { usePadronStore } from '@/stores/padronStore'
import MiniMapa from './MiniMapa.vue'
import dataMun from '@/data/edomex_municipios.json'
import L from 'leaflet'

const props = defineProps({
  padronId: { type: String, required: true },
  nombrePadron: { type: String, default: 'Padrón' },
})

const emit = defineEmits(['close', 'created'])
const padronStore = usePadronStore()

const loading = ref(false)
const cargandoPlantilla = ref(false)

const formFijo = ref({
  nombre_completo: '',
  municipio: '',
  codigo_postal: '',
  seccion: '',
  latitud: null,
  longitud: null,
})

const formExtra = ref({})

// --- Carga plantilla de campos detectados en el padrón ---
onMounted(async () => {
  if (!props.padronId) return
  cargandoPlantilla.value = true
  try {
    const plantilla = await padronStore.fetchPlantillaExtra(props.padronId)
    if (plantilla && Object.keys(plantilla).length > 0) {
      formExtra.value = { ...plantilla }
    }
  } catch (e) {
    console.error('Error al cargar plantilla:', e)
  } finally {
    cargandoPlantilla.value = false
  }
})

// --- Municipios ordenados ---
const listaMunicipios = computed(() =>
  dataMun.features.map((f) => f.properties.nombre).sort((a, b) => a.localeCompare(b)),
)

// --- REGLA 1: Mapa → Formulario ---
const sincronizarDesdeMapa = (geoData) => {
  formFijo.value.latitud = geoData.lat
  formFijo.value.longitud = geoData.lng
  if (geoData.municipio) formFijo.value.municipio = geoData.municipio
  if (geoData.cp) formFijo.value.codigo_postal = geoData.cp
}

// --- REGLA 2: Dropdown municipio → centra mapa si no hay coords previas ---
watch(
  () => formFijo.value.municipio,
  (nuevoMun) => {
    if (!nuevoMun) return
    const munMatch = dataMun.features.find((f) => f.properties.nombre === nuevoMun)
    if (munMatch && (formFijo.value.latitud === null || formFijo.value.longitud === null)) {
      const layer = L.geoJSON(munMatch)
      const centro = layer.getBounds().getCenter()
      formFijo.value.latitud = parseFloat(centro.lat.toFixed(7))
      formFijo.value.longitud = parseFloat(centro.lng.toFixed(7))
    }
  },
)

// --- Gestión de campos extra ---
const agregarCampoExtra = () => {
  const key = prompt('Nombre del campo nuevo (ej: TELEFONO, CARGO):')
  if (!key) return
  const sanitizedKey = key.trim().toUpperCase().replace(/\s+/g, '_')
  if (formExtra.value[sanitizedKey] !== undefined) return alert('El campo ya existe.')
  formExtra.value[sanitizedKey] = ''
}

const quitarCampo = (key) => {
  const newObj = { ...formExtra.value }
  delete newObj[key]
  formExtra.value = newObj
}

const handleClose = () => emit('close')

// --- Crear registro ---
const crearRegistro = async () => {
  if (!formFijo.value.nombre_completo) return alert('El nombre es obligatorio.')
  if (!formFijo.value.latitud || !formFijo.value.longitud) {
    if (!confirm('¿Desea crear el registro sin coordenadas geográficas?')) return
  }

  loading.value = true
  try {
    const payload = {
      campos_fijos: { ...formFijo.value },
      datos_generales: {
        ...formExtra.value,
        CP_DETECTADO: formFijo.value.codigo_postal,
      },
    }

    await padronStore.editarBeneficiario(props.padronId, null, payload)
    emit('created')
    handleClose()
  } catch (e) {
    alert('Error al guardar: ' + (e.response?.data?.message || e.message))
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
