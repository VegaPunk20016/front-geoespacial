<template>
  <div class="flex items-start justify-center bg-gray-50 px-4 py-8 relative overflow-hidden">
    <div
      class="bg-[#177DA6] w-full max-w-[400px] rounded-2xl shadow-xl p-8 md:p-10 relative z-10 text-white"
    >
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold mb-2 tracking-tight">Recuperar acceso</h1>
        <p class="text-sm opacity-90">
          Ingresa tu correo para recibir las instrucciones de cambio de contraseña.
        </p>
        <hr class="border-t border-white/20 mt-6 w-full" />
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-1">
          <input
            v-model="email"
            type="email"
            placeholder="Correo electrónico"
            class="w-full bg-white px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-dark placeholder-gray-400 transition-all"
            required
          />
        </div>

        <div class="min-h-[40px]">
          <Transition name="fade" mode="out-in">
            <div
              v-if="message"
              :class="isError ? 'bg-red-500/20 border-red-400' : 'bg-green-500/20 border-green-400'"
              class="border text-white px-4 py-2 rounded-md text-xs text-center"
            >
              {{ message }}
            </div>
          </Transition>
        </div>

        <div class="flex justify-center">
          <AppButton
            type="submit"
            variant="dark"
            label="Enviar correo"
            :isLoading="isLoading"
            class="w-full"
          />
        </div>

        <div class="text-center mt-6">
          <router-link
            to="/login"
            class="text-sm font-medium hover:text-white/80 transition-colors flex items-center justify-center gap-2"
          >
            <span>←</span> Volver al inicio de sesión
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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
    // Llamada al endpoint: api/users/forgot-password
    const response = await authService.sendForgotPassword(email.value)
    isError.value = false
    message.value = response.message || 'Se ha enviado un correo para el cambio de contraseña.'
    email.value = ''
  } catch (error) {
    isError.value = true
    message.value = error.response?.data?.message || 'Error al intentar enviar el correo.'
  } finally {
    isLoading.value = false
  }
}
</script>
