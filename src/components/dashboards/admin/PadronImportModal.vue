<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(1, 39, 55, 0.55); backdrop-filter: blur(4px)"
  >
    <div
      class="w-full max-w-lg rounded-xl border overflow-hidden shadow-2xl"
      style="background: white; border-color: var(--color-base-dark)"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <div>
          <h3 class="text-sm font-bold" style="color: var(--color-dark)">Importar Datos</h3>
          <p class="text-[11px] mt-0.5" style="color: var(--color-muted)">
            Destino: <strong style="color: var(--color-primary)">{{ padron.nombre_padron }}</strong>
          </p>
        </div>
        <button
          @click="!isUploading && $emit('close')"
          :disabled="isUploading"
          class="p-1.5 rounded-lg transition-colors disabled:opacity-40"
          style="color: var(--color-muted)"
          @mouseenter="
            (e) => !isUploading && (e.currentTarget.style.background = 'var(--color-base)')
          "
          @mouseleave="(e) => (e.currentTarget.style.background = 'transparent')"
        >
          <X :size="17" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6">
        <!-- Error -->
        <div
          v-if="errorMessage"
          class="flex items-start gap-2 text-xs px-4 py-3 rounded-lg border mb-4"
          style="background: #fee2e2; border-color: #fecaca; color: #991b1b"
        >
          <AlertCircle :size="13" class="shrink-0 mt-0.5" /> {{ errorMessage }}
        </div>

        <!-- Drop zone -->
        <div
          v-if="!isUploading"
          class="rounded-xl border-2 border-dashed transition-all px-6 py-12 text-center cursor-pointer"
          :style="
            isDragging
              ? 'border-color:var(--color-primary);background:#EEF7FA;'
              : 'border-color:var(--color-base-dark);background:var(--color-base);'
          "
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <div class="flex flex-col items-center gap-3">
            <div
              class="w-14 h-14 rounded-xl flex items-center justify-center"
              style="background: white; border: 1.5px solid var(--color-base-dark)"
            >
              <FileUp :size="24" style="color: var(--color-primary-light)" />
            </div>
            <div>
              <p class="text-sm font-semibold" style="color: var(--color-dark)">
                {{ selectedFile ? selectedFile.name : 'Arrastra tu archivo aquí' }}
              </p>
              <p class="text-xs mt-1" style="color: var(--color-muted)">
                {{
                  selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                    : 'o haz clic para seleccionarlo'
                }}
              </p>
            </div>
            <p
              v-if="!selectedFile"
              class="text-[10px] font-semibold uppercase tracking-widest"
              style="color: var(--color-muted)"
            >
              CSV · TXT · XLSX · XLS
            </p>
          </div>

          <input
            ref="fileInput"
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            class="sr-only"
            @change="handleFileSelect"
          />
        </div>

        <!-- Uploading -->
        <div v-else class="py-12 flex flex-col items-center text-center gap-4">
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center"
            style="background: var(--color-base); border: 1.5px solid var(--color-base-dark)"
          >
            <Loader2 :size="26" class="animate-spin" style="color: var(--color-primary)" />
          </div>
          <div>
            <p class="text-sm font-bold" style="color: var(--color-dark)">Procesando datos...</p>
            <p class="text-xs mt-1.5 max-w-xs" style="color: var(--color-muted)">
              El sistema está inyectando la información en la base de datos. Por favor no cierres
              esta ventana.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        v-if="!isUploading"
        class="flex justify-end gap-2 px-6 py-4 border-t"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-xs font-semibold rounded-lg border"
          style="border-color: var(--color-base-dark); color: var(--color-muted); background: white"
        >
          Cancelar
        </button>
        <button
          @click="procesarArchivo"
          :disabled="!selectedFile"
          class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50"
          style="background: var(--color-primary)"
        >
          Subir e importar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { X, FileUp, Loader2, AlertCircle } from 'lucide-vue-next'
import { usePadronStore } from '@/stores/padronStore'

const props = defineProps({ padron: { type: Object, required: true } })
const emit = defineEmits(['close', 'imported'])

const padronStore = usePadronStore()
const selectedFile = ref(null)
const isDragging = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')

const handleFileSelect = (e) => validarArchivo(e.target.files[0])
const handleDrop = (e) => {
  isDragging.value = false
  validarArchivo(e.dataTransfer.files[0])
}

const validarArchivo = (file) => {
  errorMessage.value = ''
  if (!file) return
  const ext = ['.csv', '.txt', '.xlsx', '.xls']
  if (!ext.some((e) => file.name.toLowerCase().endsWith(e))) {
    errorMessage.value = 'Formato no permitido. Usa CSV, TXT o Excel.'
    selectedFile.value = null
    return
  }
  selectedFile.value = file
}

const procesarArchivo = async () => {
  if (!selectedFile.value) return
  isUploading.value = true
  errorMessage.value = ''
  try {
    await padronStore.importarCsv(props.padron.id, selectedFile.value)
    emit('imported')
    emit('close')
  } catch {
    errorMessage.value = padronStore.errorMessage || 'Error crítico al importar el archivo.'
  } finally {
    isUploading.value = false
  }
}
</script>
