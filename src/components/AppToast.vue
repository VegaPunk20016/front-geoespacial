<template>
  <Teleport to="body">
    <div
      class="fixed z-[100] flex flex-col gap-2 pointer-events-none"
      style="
        bottom: 1.25rem;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 2rem);
        max-width: 360px;
      "
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg w-full"
          style="background: white"
          :style="borderStyle(toast.type)"
        >
          <div
            class="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
            :style="iconBg(toast.type)"
          >
            <CheckCircle2 v-if="toast.type === 'success'" :size="14" style="color: #166534" />
            <AlertCircle v-else-if="toast.type === 'error'" :size="14" style="color: #991b1b" />
            <Info v-else :size="14" style="color: var(--color-primary)" />
          </div>
          <p class="text-xs font-medium flex-1 leading-relaxed" style="color: var(--color-ink)">
            {{ toast.message }}
          </p>
          <button
            @click="removeToast(toast.id)"
            style="
              color: var(--color-muted);
              background: none;
              border: none;
              cursor: pointer;
              display: flex;
              margin-top: 2px;
            "
          >
            <X :size="13" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
const { toasts, removeToast } = useToast()
const borderStyle = (t) =>
  t === 'success'
    ? 'border-color:#BBF7D0;'
    : t === 'error'
      ? 'border-color:#FECACA;'
      : 'border-color:var(--color-base-dark);'
const iconBg = (t) =>
  t === 'success'
    ? 'background:#DCFCE7;'
    : t === 'error'
      ? 'background:#FEE2E2;'
      : 'background:#E0F0F7;'
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
