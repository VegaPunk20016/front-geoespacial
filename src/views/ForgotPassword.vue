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
      <RouterLink
        to="/login"
        class="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-opacity hover:opacity-70"
        style="color: var(--color-muted)"
      >
        <ArrowLeft :size="13" /> Volver al inicio de sesión
      </RouterLink>
      <h2
        class="text-2xl font-extrabold mb-1"
        style="color: var(--color-dark); letter-spacing: -0.03em"
      >
        Recuperar acceso
      </h2>
      <p class="text-sm mb-7" style="color: var(--color-muted)">
        Ingresa tu correo y te enviaremos las instrucciones para recuperar tu cuenta.
      </p>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Correo electrónico</label
          >
          <input
            v-model="email"
            type="email"
            placeholder="usuario@iidesoft.com"
            required
            class="g-input"
          />
        </div>
        <Transition name="fade">
          <div
            v-if="message"
            class="text-sm px-4 py-2.5 rounded-lg border"
            :style="
              isError
                ? 'background:#FEE2E2;border-color:#FECACA;color:#991B1B;'
                : 'background:#DCFCE7;border-color:#BBF7D0;color:#166534;'
            "
          >
            {{ message }}
          </div>
        </Transition>
        <AppButton
          type="submit"
          variant="dark"
          label="Enviar instrucciones"
          :isLoading="isLoading"
          class="w-full !py-3 text-sm"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import AppButton from '../components/AppButton.vue'
import { authService } from '../services/authService'

const email = ref('')
const isLoading = ref(false)
const message = ref('')
const isError = ref(false)
const handleSubmit = async () => {
  isLoading.value = true
  message.value = ''
  try {
    const res = await authService.sendForgotPassword(email.value)
    isError.value = false
    message.value = res.message || 'Se ha enviado un correo con instrucciones.'
    email.value = ''
  } catch (error) {
    isError.value = true
    message.value = error.response?.data?.message || 'Error al enviar el correo.'
  } finally {
    isLoading.value = false
  }
}
</script>
