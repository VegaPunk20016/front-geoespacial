<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium max-w-sm w-full"
          :class="variantClasses[toast.type]"
        >
          <component :is="variantIcons[toast.type]" class="w-4 h-4 mt-0.5 shrink-0" />
          <span class="flex-1">{{ toast.message }}</span>
          <button
            @click="remove(toast.id)"
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const variantClasses = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const variantIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
