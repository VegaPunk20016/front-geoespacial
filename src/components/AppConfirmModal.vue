<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style="background: rgba(1, 39, 55, 0.55); backdrop-filter: blur(4px)"
      >
        <div
          class="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl border overflow-hidden shadow-2xl"
          style="background: white; border-color: var(--color-base-dark)"
        >
          <div class="px-5 pt-5 pb-4">
            <!-- Ícono -->
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              :style="options.variant === 'danger' ? 'background:#FEE2E2;' : 'background:#E0F0F7;'"
            >
              <AlertTriangle
                v-if="options.variant === 'danger'"
                :size="20"
                style="color: #991b1b"
              />
              <HelpCircle v-else :size="20" style="color: var(--color-primary)" />
            </div>

            <!-- Título -->
            <h3 class="text-sm font-bold mb-1" style="color: var(--color-dark)">
              {{ options.title || 'Confirmación' }}
            </h3>

            <!-- Mensaje -->
            <p class="text-xs leading-relaxed" style="color: var(--color-muted)">
              {{ options.message || '¿Deseas continuar?' }}
            </p>
          </div>

          <!-- Botones -->
          <div class="flex gap-2 px-5 pb-5">
            <button
              @click="cancel"
              class="flex-1 py-2.5 text-xs font-semibold rounded-lg border transition-all"
              style="
                border-color: var(--color-base-dark);
                color: var(--color-muted);
                background: white;
              "
            >
              {{ options.cancelText || 'Cancelar' }}
            </button>
            <button
              @click="accept"
              class="flex-1 py-2.5 text-xs font-semibold rounded-lg text-white transition-all"
              :style="
                options.variant === 'danger'
                  ? 'background:#DC2626;'
                  : 'background:var(--color-primary);'
              "
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
import { AlertTriangle, HelpCircle } from 'lucide-vue-next'
import { useConfirm } from '@/composables/useConfirm'

// El composable expone: isOpen, options (objeto), accept, cancel
const { isOpen, options, accept, cancel } = useConfirm()
</script>
