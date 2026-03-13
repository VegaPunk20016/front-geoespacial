<template>
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    style="background: rgba(1, 39, 55, 0.55); backdrop-filter: blur(4px)"
  >
    <div
      class="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border overflow-hidden shadow-2xl"
      style="background: white; border-color: var(--color-base-dark)"
    >
      <div
        class="flex items-center justify-between px-5 py-4 border-b"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <div>
          <h3 class="text-sm font-bold" style="color: var(--color-dark)">Nuevo Padrón</h3>
          <p class="text-[11px] mt-0.5" style="color: var(--color-muted)">
            Registra un nuevo catálogo geoespacial
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="p-1.5 rounded-lg"
          style="color: var(--color-muted); background: none; border: none; cursor: pointer"
        >
          <X :size="17" />
        </button>
      </div>

      <div class="p-5 space-y-4 overflow-y-auto max-h-[60vh] sm:max-h-none">
        <div
          v-if="error"
          class="text-xs px-3 py-2.5 rounded-lg border flex items-center gap-2"
          style="background: #fee2e2; border-color: #fecaca; color: #991b1b"
        >
          <AlertCircle :size="13" class="shrink-0" />{{ error }}
        </div>

        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Nombre del padrón *</label
          >
          <input
            v-model="form.nombre_padron"
            type="text"
            placeholder="Ej: Apoyos Agrícolas 2026"
            class="g-input"
            required
          />
        </div>

        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Clave interna (Opcional)</label
          >
          <input
            v-model="form.clave_interna"
            type="text"
            placeholder="Ej: PAD-001"
            class="g-input"
          />
        </div>

        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Categoría *</label
          >
          <input
            v-model="form.categoria"
            type="text"
            placeholder="Ej: Agrícola, Electoral..."
            class="g-input"
          />
        </div>

        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Entidad federativa *</label
          >
          <select v-model="form.entidad_federativa" class="g-input appearance-none">
            <option value="Estado de México">Estado de México</option>
          </select>
        </div>

        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Descripción</label
          >
          <textarea
            v-model="form.descripcion"
            rows="3"
            placeholder="Descripción breve..."
            class="g-input resize-none"
          />
        </div>
      </div>

      <div
        class="flex gap-2 px-5 py-4 border-t"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <button
          @click="$emit('close')"
          class="flex-1 py-2.5 text-xs font-semibold rounded-lg border"
          style="border-color: var(--color-base-dark); color: var(--color-muted); background: white"
        >
          Cancelar
        </button>
        <button
          @click="handleCreate"
          :disabled="isLoading"
          class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg text-white disabled:opacity-60"
          style="background: var(--color-primary)"
        >
          <Loader2 v-if="isLoading" :size="13" class="animate-spin" />
          {{ isLoading ? 'Creando...' : 'Crear padrón' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { X, Loader2, AlertCircle } from 'lucide-vue-next'
import { usePadronStore } from '@/stores/padronStore'

const emit = defineEmits(['close', 'created'])
const padronStore = usePadronStore()
const isLoading = ref(false)
const error = ref('')

const form = reactive({
  nombre_padron: '',
  clave_interna: '', // Nuevo campo
  categoria: 'General', // Valor por defecto
  entidad_federativa: 'Estado de México', // Valor predeterminado para el dropdown
  descripcion: '',
})

const handleCreate = async () => {
  if (!form.nombre_padron.trim()) {
    error.value = 'El nombre del padrón es obligatorio.'
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    await padronStore.crearPadron(form)
    emit('created')
    emit('close')
  } catch (e) {
    error.value = padronStore.errorMessage || 'Error al crear el padrón.'
  } finally {
    isLoading.value = false
  }
}
</script>
