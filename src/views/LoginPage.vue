<template>
  <div class="flex items-start justify-center bg-gray-50 px-4 py-8 relative overflow-hidden">
    <div
      class="bg-[#177DA6] w-full max-w-[400px] rounded-2xl shadow-xl p-8 md:p-10 relative z-10 text-white"
    >
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold mb-2 tracking-tight">Bienvenido</h1>
        <p class="text-base opacity-90">Inicia sesión en tu cuenta</p>
        <hr class="border-t border-white/20 mt-6 w-full" />
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-1">
          <input
            v-model="form.email"
            type="email"
            placeholder="Correo electrónico"
            class="w-full bg-white px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-dark placeholder-gray-400 transition-all"
            required
          />
        </div>

        <div class="relative flex items-center">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Contraseña"
            class="w-full bg-white px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-dark placeholder-gray-400 pr-12 transition-all"
            required
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 text-gray-400 hover:text-dark transition-colors"
          >
            <EyeOff v-if="!showPassword" :size="20" stroke-width="2" />
            <Eye v-else :size="20" stroke-width="2" />
          </button>
        </div>

        <div class="flex justify-end mt-2">
          <RouterLink
            to="/forgot-password"
            class="text-xs hover:text-white/80 transition-colors underline opacity-80"
          >
            ¿Olvidaste tu contraseña?
          </RouterLink>
        </div>

        <Transition name="fade">
          <div
            v-if="errorMessage"
            class="bg-red-500/20 border border-red-400 text-white px-4 py-2 rounded-md text-sm text-center"
          >
            {{ errorMessage }}
          </div>
        </Transition>

        <div class="flex justify-center pt-2">
          <AppButton
            type="submit"
            variant="dark"
            label="Entrar"
            :isLoading="isLoading"
            class="w-full"
          />
        </div>

        <div class="text-center mt-6">
          <router-link
            to="/register"
            class="text-sm font-medium hover:text-white/80 transition-colors"
          >
            ¿No tienes cuenta? <span class="underline">Regístrate</span>
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import AppButton from '../components/AppButton.vue'
import { authService } from '../services/authService'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const payload = { email: form.email, password: form.password }
    const response = await authService.login(payload)

    const token = response.token

    if (token) {
      authStore.login(token)
      router.push('/dashboard')
    } else {
      throw new Error('No se recibió el token.')
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Credenciales inválidas.'
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
