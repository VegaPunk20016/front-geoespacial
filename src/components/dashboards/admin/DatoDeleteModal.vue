<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('close')"></div>

      <div
        class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
      >
        <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle :size="40" class="text-red-500" />
        </div>

        <h3 class="text-xl font-black text-slate-800 mb-2">¿Eliminar registro?</h3>
        <p class="text-sm text-slate-500 leading-relaxed mb-8">
          Estás a punto de eliminar permanentemente a
          <span class="font-bold text-slate-700"
            >"{{ dato.nombre_completo || dato.clave_unica || 'este registro' }}"</span
          >. Esta acción no se puede deshacer.
        </p>

        <div class="flex flex-col gap-3">
          <button
            @click="confirmarEliminacion"
            :disabled="loading"
            class="w-full py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.1em] hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Loader2 v-if="loading" class="animate-spin" :size="16" />
            {{ loading ? 'Eliminando...' : 'Sí, eliminar permanentemente' }}
          </button>

          <button
            @click="$emit('close')"
            :disabled="loading"
            class="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-[0.1em] hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { AlertTriangle, Loader2 } from 'lucide-vue-next'
import { usePadronStore } from '@/stores/padronStore'

const props = defineProps({
  padronId: { type: String, required: true },
  dato: { type: Object, required: true },
  // Se añade la prop show para controlar la transición desde el padre
  show: { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'deleted'])
const padronStore = usePadronStore()
const loading = ref(false)

const confirmarEliminacion = async () => {
  loading.value = true
  try {
    // Usamos el método que ya tienes en tu padronService (eliminarBeneficiario)
    await padronStore.eliminarBeneficiario(props.padronId, props.dato.id)
    emit('deleted')
  } catch (error) {
    console.error('Error al eliminar:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
