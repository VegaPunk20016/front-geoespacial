<template>
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
  >
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <div>
          <h3 class="text-lg font-bold text-gray-900">Importar Datos</h3>
          <p class="text-xs text-gray-500 mt-0.5">
            Destino: <strong class="text-[#177DA6]">{{ padron.nombre_padron }}</strong>
          </p>
        </div>
        <button
          @click="!isUploading && $emit('close')"
          :disabled="isUploading"
          class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6">
        <div
          v-if="errorMessage"
          class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2"
        >
          <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <div
          v-if="!isUploading"
          class="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 transition-colors"
          :class="{ 'bg-[#177DA6]/5 border-[#177DA6]': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="text-center">
            <FileUp class="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
            <div class="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
              <label
                for="file-upload"
                class="relative cursor-pointer rounded-md bg-white font-semibold text-[#177DA6] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#177DA6] focus-within:ring-offset-2 hover:text-[#126385]"
              >
                <span>Selecciona un archivo</span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  class="sr-only"
                  @change="handleFileSelect"
                />
              </label>
              <p class="pl-1">o arrástralo aquí</p>
            </div>
            <p v-if="selectedFile" class="mt-2 text-sm font-bold text-gray-900">
              📁 {{ selectedFile.name }} ({{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB)
            </p>
            <p v-else class="text-xs leading-5 text-gray-500 mt-2">
              Formatos permitidos: .CSV, .TXT, .XLSX, .XLS
            </p>
          </div>
        </div>

        <!-- Estado de carga -->
        <div v-else class="py-8 flex flex-col items-center justify-center text-center gap-4">
          <Loader2 class="h-12 w-12 text-[#177DA6] animate-spin" />
          <div>
            <h3 class="text-lg font-bold text-gray-900">Procesando Datos...</h3>
            <p class="text-sm text-gray-500 max-w-xs mt-1">
              El sistema está inyectando la información en la base de datos. Por favor, no cierres
              esta ventana.
            </p>
          </div>

          <!-- 🆕 Barra de progreso real (fix #8 adelantado) -->
          <div v-if="uploadProgress > 0" class="w-full max-w-xs">
            <div class="flex justify-between text-xs text-gray-500 mb-1">
              <span>Subiendo archivo...</span>
              <span>{{ uploadProgress }}%</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
              <div
                class="bg-[#177DA6] h-2 rounded-full transition-all duration-300"
                :style="{ width: `${uploadProgress}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="!isUploading"
        class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3"
      >
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="procesarArchivo"
          :disabled="!selectedFile"
          class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#177DA6] border border-transparent rounded-lg hover:bg-[#126385] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
        >
          Subir e Importar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePadronStore } from '@/stores/padronStore'
import { useToast } from '@/composables/useToast' // 🆕
import { X, FileUp, Loader2, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  padron: { type: Object, required: true },
})
const emit = defineEmits(['close', 'imported'])

const padronStore = usePadronStore()
const toast = useToast() // 🆕

const selectedFile = ref(null)
const isDragging = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')
const uploadProgress = ref(0) // 🆕

const handleFileSelect = (event) => {
  validarArchivo(event.target.files[0])
}

const handleDrop = (event) => {
  isDragging.value = false
  validarArchivo(event.dataTransfer.files[0])
}

const validarArchivo = (file) => {
  errorMessage.value = ''
  if (!file) return
  const allowedExtensions = ['.csv', '.txt', '.xlsx', '.xls']
  const isValid = allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  if (!isValid) {
    errorMessage.value = 'Formato no permitido. Por favor selecciona un archivo CSV, TXT o Excel.'
    selectedFile.value = null
    return
  }
  selectedFile.value = file
}

const procesarArchivo = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  errorMessage.value = ''
  uploadProgress.value = 0 // 🆕

  try {

    await padronStore.importarCsv(props.padron.id, selectedFile.value, (progress) => {
      uploadProgress.value = progress
    })
    toast.success('¡Importación completada con éxito!') // 🆕 reemplaza alert()
    emit('imported')
    emit('close')
  } catch (error) {
    errorMessage.value = padronStore.errorMessage || 'Error crítico al importar el archivo.'
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}
</script>
