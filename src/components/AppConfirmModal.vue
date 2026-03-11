<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-[#012737]/60 backdrop-blur-sm" @click="cancel" />

        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <!-- Header con icono -->
          <div class="p-6 pb-4 flex flex-col items-center text-center">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              :class="iconBgClass"
            >
              <component :is="iconComponent" class="w-6 h-6" :class="iconColorClass" />
            </div>
            <h3 class="text-lg font-bold text-gray-900">
              {{ options.title || '¿Estás seguro?' }}
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ options.message || 'Esta acción no se puede deshacer.' }}
            </p>
          </div>

          <!-- Acciones -->
          <div class="px-6 pb-6 flex gap-3">
            <button
              @click="cancel"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              {{ options.cancelText || 'Cancelar' }}
            </button>
            <button
              @click="accept"
              class="flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="confirmBtnClass"
            >
              {{ options.confirmText || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { AlertTriangle, Trash2, Info } from 'lucide-vue-next'
import { useConfirm } from '@/composables/useConfirm'

const { isOpen, options, accept, cancel } = useConfirm()

const variant = computed(() => options.value.variant || 'danger')

const iconComponent = computed(
  () =>
    ({
      danger: Trash2,
      warning: AlertTriangle,
      info: Info,
    })[variant.value],
)

const iconBgClass = computed(
  () =>
    ({
      danger: 'bg-red-100',
      warning: 'bg-yellow-100',
      info: 'bg-blue-100',
    })[variant.value],
)

const iconColorClass = computed(
  () =>
    ({
      danger: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
    })[variant.value],
)

const confirmBtnClass = computed(
  () =>
    ({
      danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      warning: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400',
      info: 'bg-[#177DA6] hover:bg-[#126385] focus:ring-[#177DA6]',
    })[variant.value],
)
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
