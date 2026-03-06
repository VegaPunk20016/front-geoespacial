<template>
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
  >
    <div
      class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
    >
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <div>
          <h3 class="text-lg font-bold text-gray-900">Crear Nuevo Padrón</h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Define los metadatos para generar la tabla dinámica.
          </p>
        </div>
        <button
          @click="!isSaving && $emit('close')"
          :disabled="isSaving"
          class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1">
        <div
          v-if="errorMessage"
          class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2"
        >
          <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1"
              >Nombre del Padrón *</label
            >
            <input
              v-model="formData.nombre_padron"
              type="text"
              required
              :disabled="isSaving"
              placeholder="Ej. Apoyos Agrícolas 2026"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#177DA6]/50 focus:border-[#177DA6] outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
            <textarea
              v-model="formData.descripcion"
              rows="2"
              :disabled="isSaving"
              placeholder="Breve detalle de los datos a importar..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#177DA6]/50 focus:border-[#177DA6] outline-none transition-all resize-none disabled:bg-gray-50 disabled:text-gray-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1"
                >Entidad Federativa *</label
              >
              <select
                v-model="formData.entidad_federativa"
                required
                :disabled="isSaving"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#177DA6]/50 focus:border-[#177DA6] outline-none bg-white transition-all disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="" disabled>Seleccionar estado...</option>
                <option value="Nacional">Nacional</option>
                <option value="Estado de México">Estado de México</option>
                <option value="Ciudad de México">Ciudad de México</option>
                <option value="Jalisco">Jalisco</option>
                <option value="Nuevo León">Nuevo León</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
              <input
                v-model="formData.categoria"
                type="text"
                :disabled="isSaving"
                placeholder="Ej. Salud, Economía, etc."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#177DA6]/50 focus:border-[#177DA6] outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1"
              >Clave Interna (Opcional)</label
            >
            <input
              v-model="formData.clave_interna"
              type="text"
              :disabled="isSaving"
              placeholder="Folio o identificador de dependencia"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#177DA6]/50 focus:border-[#177DA6] outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </form>
      </div>

      <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
        <button
          type="button"
          @click="$emit('close')"
          :disabled="isSaving"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#177DA6] disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>

        <button
          @click="handleSubmit"
          :disabled="isSaving || !esFormularioValido"
          class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#177DA6] border border-transparent rounded-lg hover:bg-[#126385] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#177DA6] disabled:opacity-70 disabled:cursor-not-allowed transition-colors min-w-[120px]"
        >
          <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
          <Save v-else class="w-4 h-4 mr-2" />
          {{ isSaving ? 'Creando Tabla...' : 'Guardar Padrón' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Pilar 3: Composition API estricta
import { ref, computed } from 'vue'
import { usePadronStore } from '@/stores/padronStore' // Pilar 2: Store Global
import { X, Save, Loader2, AlertCircle } from 'lucide-vue-next'

const emit = defineEmits(['close', 'created'])
const padronStore = usePadronStore()

// Estados Locales de la UI
const isSaving = ref(false)
const errorMessage = ref('')

// El objeto de datos que enviaremos
const formData = ref({
  nombre_padron: '',
  descripcion: '',
  entidad_federativa: '',
  categoria: '',
  clave_interna: '',
})

// Validación sencilla reactiva (para apagar el botón si faltan datos)
const esFormularioValido = computed(() => {
  return formData.value.nombre_padron.trim() !== '' && formData.value.entidad_federativa !== ''
})

const handleSubmit = async () => {
  if (!esFormularioValido.value) return

  // Iniciamos la Máquina de Estados local del Modal
  isSaving.value = true
  errorMessage.value = ''

  try {
    // Le pasamos el paquete al Store para que hable con el Servicio
    await padronStore.crearPadron(formData.value)

    // Si todo salió bien en CodeIgniter, cerramos el modal y avisamos
    emit('created')
    emit('close')
  } catch (error) {
    // Si el backend se queja, mostramos el error elegantemente
    errorMessage.value = padronStore.errorMessage || 'Error de conexión al crear el padrón.'
  } finally {
    // Apagamos el spinner sin importar qué pasó
    isSaving.value = false
  }
}
</script>
