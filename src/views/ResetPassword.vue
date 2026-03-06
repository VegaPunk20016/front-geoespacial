<template>
  <div class="flex items-start justify-center bg-gray-50 px-4 py-8 relative overflow-hidden">
    <div
      class="bg-[#177DA6] w-full max-w-[400px] rounded-2xl shadow-xl p-8 md:p-10 relative z-10 text-white"
    >
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold mb-2 tracking-tight">Nueva Contraseña</h1>
        <p class="text-sm opacity-90">Ingresa tu nueva clave de acceso para recuperar tu cuenta.</p>
        <hr class="border-t border-white/20 mt-6 w-full" />
      </div>

      <form @submit.prevent="handleReset" class="space-y-4">
        <div class="relative flex items-center">
          <input
            v-model="form.password"
            :type="showPass ? 'text' : 'password'"
            placeholder="Nueva contraseña"
            class="w-full bg-white px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#012737] placeholder-gray-400"
            required
          />
          <button
            type="button"
            @click="showPass = !showPass"
            class="absolute right-3 text-gray-400 hover:text-[#012737]"
          >
            <EyeOff v-if="!showPass" :size="20" />
            <Eye v-else :size="20" />
          </button>
        </div>

        <input
          v-model="form.confirmPassword"
          type="password"
          placeholder="Confirmar nueva contraseña"
          class="w-full bg-white px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#012737] placeholder-gray-400"
          required
        />

        <div class="min-h-[45px] flex items-center justify-center">
          <Transition name="fade" mode="out-in">
            <div
              v-if="statusMessage"
              :class="isError ? 'bg-red-500/20 border-red-400' : 'bg-green-500/20 border-green-400'"
              class="w-full border text-white px-4 py-2 rounded-md text-[11px] text-center"
            >
              {{ statusMessage }}
            </div>
          </Transition>
        </div>

        <AppButton
          type="submit"
          variant="dark"
          label="Actualizar contraseña"
          :isLoading="isLoading"
          class="w-full"
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

const form = reactive({
  password: '',
  confirmPassword: '',
})

// Pilar: Seguridad - Validamos que el token venga en la URL (?token=...)
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
    // Pilar: Fuente Única de Verdad - Usamos el token de la URL y el servicio
    const token = route.query.token
    await authService.resetPassword(token, form.password)

    isError.value = false
    statusMessage.value = '¡Éxito! Tu contraseña ha sido cambiada.'

    // Redirigir después de un breve delay para que el usuario vea el éxito
    setTimeout(() => router.push('/login'), 2000)
  } catch (error) {
    isError.value = true
    statusMessage.value = error.response?.data?.message || 'El token ha expirado o no es válido.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
