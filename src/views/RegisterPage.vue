<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen p-6 font-sans"
    style="background-color: #f1f1eb"
  >
    <div class="w-full max-w-sm">
      <div class="flex items-center gap-3 mb-10">
        <img src="/Logo-O.ico" alt="Logo" class="w-8 h-8 opacity-90" />
        <span class="font-bold text-[#012737] tracking-wider text-lg">IIDESOFT</span>
      </div>

      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[#012737] mb-1 tracking-tight">Crea una cuenta</h1>
        <p class="text-[#6b7280] text-sm">Es fácil y rápido. Completa tus datos a continuación.</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label
              class="block text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-0.5"
              >Nombre</label
            >
            <input
              v-model="form.firstName"
              type="text"
              placeholder="Ej. Juan"
              class="input-iidesoft"
              required
            />
          </div>
          <div class="space-y-1.5">
            <label
              class="block text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-0.5"
              >Apellido</label
            >
            <input
              v-model="form.lastName"
              type="text"
              placeholder="Ej. Pérez"
              class="input-iidesoft"
              required
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-0.5"
            >Correo electrónico</label
          >
          <input
            v-model="form.email"
            type="email"
            placeholder="usuario@iidesoft.com"
            class="input-iidesoft"
            required
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-0.5"
            >Contraseña</label
          >
          <div class="relative flex items-center">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="input-iidesoft pr-12"
              required
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 text-gray-400"
            >
              <EyeOff v-if="!showPassword" :size="18" /> <Eye v-else :size="18" />
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-0.5"
            >Confirmar contraseña</label
          >
          <div class="relative flex items-center">
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="input-iidesoft pr-12"
              required
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 text-gray-400"
            >
              <EyeOff v-if="!showConfirmPassword" :size="18" /> <Eye v-else :size="18" />
            </button>
          </div>
        </div>

        <div class="min-h-[40px]">
          <Transition name="fade" mode="out-in">
            <div
              v-if="isEmailTaken"
              class="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 shadow-sm"
            >
              <AlertCircle class="text-amber-600 shrink-0" :size="20" />
              <div>
                <p
                  class="text-amber-800 text-[12px] font-bold uppercase tracking-tight leading-tight"
                >
                  Correo ya registrado
                </p>
                <p class="text-amber-700 text-[11px] mt-1 leading-normal">
                  Esta cuenta ya existe. Si la desactivaste anteriormente o no puedes acceder, por
                  favor
                  <a href="mailto:admin@iidesoft.com" class="font-bold underline text-amber-900"
                    >contacta al administrador</a
                  >
                  para reactivarla.
                </p>
              </div>
            </div>

            <div
              v-else-if="errorMessage"
              class="text-red-600 text-[11px] font-semibold flex items-center gap-2 px-1"
            >
              <span class="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              {{ errorMessage }}
            </div>

            <div
              v-else-if="successMessage"
              class="text-emerald-600 text-[11px] font-semibold flex items-center gap-2 px-1"
            >
              <span class="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
              {{ successMessage }}
            </div>
          </Transition>
        </div>

        <AppButton
          type="submit"
          variant="dark"
          :isLoading="isLoading"
          class="w-full !bg-[#012737] !py-3.5 !rounded-lg !font-bold"
        >
          <template #default>Registrarte al sistema</template>
        </AppButton>

        <div class="text-center mt-8 pt-6 border-t border-gray-200/50">
          <router-link to="/login" class="text-sm text-[#6b7280]">
            ¿Ya tienes cuenta?
            <span class="font-bold text-[#2b7194] underline ml-1">Inicia sesión</span>
          </router-link>
        </div>
      </form>

      <div class="mt-16 text-center">
        <p class="text-[10px] font-bold text-[#6b7280]/60 tracking-[0.2em] uppercase">
          IIDESOFT · SISTEMA GEOESPACIAL · V2.0
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, AlertCircle } from 'lucide-vue-next'
import AppButton from '../components/AppButton.vue'
import { authService } from '../services/authService'

const router = useRouter()
const form = reactive({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isEmailTaken = ref(false)

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  isEmailTaken.value = false

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
    setTimeout(() => router.push('/login'), 1500)
  } catch (error) {
    // CAPTURA DEL ERROR 400 DE CORREO ÚNICO
    const apiMessages = error.response?.data?.messages

    if (apiMessages?.email && apiMessages.email.includes('unique value')) {
      isEmailTaken.value = true
    } else {
      errorMessage.value = error.response?.data?.message || 'Error al registrarse.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
@reference "tailwindcss";

.input-iidesoft {
  @apply w-full bg-[#ebf2ff] px-4 py-2.5 rounded-sm text-[#012737] focus:outline-none focus:ring-2 focus:ring-[#012737]/10 placeholder-gray-400/60 transition-all text-sm border-none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
