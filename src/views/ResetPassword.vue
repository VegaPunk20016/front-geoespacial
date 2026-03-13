<template>
  <div
    class="flex items-center justify-center min-h-full p-6"
    style="background: var(--color-base)"
  >
    <div class="w-full max-w-sm py-6">
      <div class="flex items-center gap-2.5 mb-8">
        <img src="/Logo-O.ico" alt="IIDESOFT" class="w-8 h-8" />
        <span
          class="font-bold text-base tracking-wide"
          style="color: var(--color-dark); letter-spacing: 0.02em"
          >IIDESOFT</span
        >
      </div>
      <h2
        class="text-2xl font-extrabold mb-1"
        style="color: var(--color-dark); letter-spacing: -0.03em"
      >
        Nueva contraseña
      </h2>
      <p class="text-sm mb-7" style="color: var(--color-muted)">
        Ingresa tu nueva clave de acceso.
      </p>
      <form @submit.prevent="handleReset" class="space-y-4">
        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Nueva contraseña</label
          >
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPass ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
              required
              class="g-input"
              style="padding-right: 2.75rem"
            />
            <button
              type="button"
              @click="showPass = !showPass"
              class="absolute right-3 top-1/2 -translate-y-1/2"
              style="
                color: var(--color-muted);
                background: none;
                border: none;
                cursor: pointer;
                display: flex;
              "
            >
              <EyeOff v-if="!showPass" :size="17" /><Eye v-else :size="17" />
            </button>
          </div>
        </div>
        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Confirmar contraseña</label
          >
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="Repite tu contraseña"
            required
            class="g-input"
          />
        </div>
        <Transition name="fade">
          <div
            v-if="statusMessage"
            class="text-sm px-4 py-2.5 rounded-lg border"
            :style="
              isError
                ? 'background:#FEE2E2;border-color:#FECACA;color:#991B1B;'
                : 'background:#DCFCE7;border-color:#BBF7D0;color:#166534;'
            "
          >
            {{ statusMessage }}
          </div>
        </Transition>
        <AppButton
          type="submit"
          variant="dark"
          label="Actualizar contraseña"
          :isLoading="isLoading"
          class="w-full !py-3 text-sm"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import AppButton from '../components/AppButton.vue'
import { authService } from '../services/authService'

const route = useRoute()
const router = useRouter()
const isLoading = ref(false)
const statusMessage = ref('')
const isError = ref(false)
const showPass = ref(false)
const form = reactive({ password: '', confirmPassword: '' })

onMounted(() => {
  if (!route.query.token) {
    isError.value = true
    statusMessage.value = 'Enlace de recuperación inválido.'
    setTimeout(() => router.push('/login'), 2000)
  }
})
const handleReset = async () => {
  if (form.password !== form.confirmPassword) {
    isError.value = true
    statusMessage.value = 'Las contraseñas no coinciden.'
    return
  }
  isLoading.value = true
  statusMessage.value = ''
  try {
    await authService.resetPassword(route.query.token, form.password)
    isError.value = false
    statusMessage.value = '¡Éxito! Contraseña actualizada. Redirigiendo...'
    setTimeout(() => router.push('/login'), 2000)
  } catch (error) {
    isError.value = true
    statusMessage.value = error.response?.data?.message || 'El token ha expirado o no es válido.'
  } finally {
    isLoading.value = false
  }
}
</script>
