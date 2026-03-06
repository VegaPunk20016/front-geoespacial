<template>
  <div class="flex items-start justify-center bg-gray-50 px-4 py-8 relative overflow-hidden">
    <div
      class="bg-[#177DA6] w-full max-w-[480px] rounded-2xl shadow-xl p-8 md:p-10 relative z-10 text-white"
    >
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold mb-2 tracking-tight">Crea una cuenta</h1>
        <p class="text-base opacity-90">Es fácil y rápido</p>
        <hr class="border-t border-white/20 mt-6 w-full" />
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            v-model="form.firstName"
            type="text"
            placeholder="Nombre"
            class="w-full bg-white px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-dark placeholder-gray-400 transition-all"
            required
          />
          <input
            v-model="form.lastName"
            type="text"
            placeholder="Primer Apellido"
            class="w-full bg-white px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-dark placeholder-gray-400 transition-all"
            required
          />
        </div>

        <input
          v-model="form.email"
          type="email"
          placeholder="Correo electrónico"
          class="w-full bg-white px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-dark placeholder-gray-400 transition-all"
          required
        />

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

        <div class="relative flex items-center">
          <input
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Confirmar contraseña"
            class="w-full bg-white px-4 py-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-dark placeholder-gray-400 pr-12 transition-all"
            required
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            class="absolute right-3 text-gray-400 hover:text-dark transition-colors"
          >
            <EyeOff v-if="!showConfirmPassword" :size="20" stroke-width="2" />
            <Eye v-else :size="20" stroke-width="2" />
          </button>
        </div>

        <p class="text-[11px] text-center opacity-80 mt-4">
          Al hacer clic en "Registrarte", aceptas la
          <a
            href="https://iidesoft.com.mx/aviso-de-privacidad/"
            class="underline hover:text-white transition-colors"
            >Política de privacidad</a
          >
        </p>

        <div class="min-h-[40px]">
          <Transition name="fade" mode="out-in">
            <div
              v-if="errorMessage"
              class="bg-red-500/20 border border-red-400 text-white px-4 py-2 rounded-md text-xs text-center"
            >
              {{ errorMessage }}
            </div>
            <div
              v-else-if="successMessage"
              class="bg-green-500/20 border border-green-400 text-white px-4 py-2 rounded-md text-xs text-center"
            >
              {{ successMessage }}
            </div>
          </Transition>
        </div>

        <div class="flex justify-center">
          <AppButton
            type="submit"
            variant="dark"
            label="Registrarte"
            :isLoading="isLoading"
            class="w-full"
          />
        </div>

        <div class="text-center mt-6">
          <router-link
            to="/login"
            class="text-sm font-medium hover:text-white/80 transition-colors"
          >
            ¿Ya tienes cuenta? <span class="underline">Inicia sesión</span>
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

const router = useRouter()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'Las contraseñas no coinciden.'
    return
  }

  isLoading.value = true

  try {
    const payload = {
      username: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      password: form.password,
    }

    await authService.register(payload)
    successMessage.value = '¡Cuenta creada con éxito!'

    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Error al registrarse.'
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
