<template>
  <div
    class="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden font-sans"
    style="background-color: #f1f1eb"
  >
    <div
      class="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden flex-shrink-0"
      style="background: linear-gradient(135deg, #012737 0%, #0d3a4f 55%, #2b7194 100%)"
    >
      <div
        class="absolute w-[500px] h-[500px] rounded-full bg-white/5 -top-32 -right-24 pointer-events-none"
      />
      <div class="relative z-10">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-10 bg-white/10 border border-white/20"
        >
          <span class="text-[10px] uppercase tracking-widest font-semibold text-blue-200"
            >| Sistema de Análisis Territorial |</span
          >
        </div>
        <h1 class="text-5xl font-extrabold leading-tight text-white mb-5 tracking-tighter">
          Transforma datos<br />oficiales en<br />
          <span class="text-blue-300">decisiones</span>
        </h1>
        <p class="text-sm leading-relaxed max-w-sm text-white/60">
          Sistema integrado de bases de datos georreferenciadas — DENUE · INEGI · Electoral — con
          visualización y análisis mediante mapas interactivos.
        </p>
      </div>

      <div class="relative z-10 flex items-center gap-8">
        <div
          v-for="stat in [
            { v: '32', t: 'Entidades' },
            { v: 'JWT', t: 'Seguridad', c: true },
            { v: 'CI4', t: 'Backend' },
          ]"
          :key="stat.t"
          class="flex items-center gap-8"
        >
          <div>
            <div
              class="text-3xl font-extrabold tracking-tighter"
              :class="stat.c ? 'text-blue-300' : 'text-white'"
            >
              {{ stat.v }}
            </div>
            <div class="text-[10px] uppercase tracking-widest mt-1 text-white/40">{{ stat.t }}</div>
          </div>
          <div v-if="stat.t !== 'Backend'" class="w-px h-9 bg-white/10" />
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 min-h-full">
      <div class="w-full max-w-sm py-6">
        <div class="flex items-center gap-3 mb-10">
          <img src="/Logo-O.ico" alt="IIDESOFT" class="w-8 h-8" />
          <span class="font-bold text-[#012737] tracking-wider text-lg">IIDESOFT</span>
        </div>

        <h2 class="text-3xl font-bold text-[#012737] mb-1 tracking-tight">Bienvenido</h2>
        <p class="text-[#6b7280] text-sm mb-8">Inicia sesión en tu cuenta de acceso</p>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div class="space-y-1.5">
            <label
              class="block text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-0.5"
              >Correo electrónico</label
            >
            <input
              v-model="form.email"
              type="email"
              placeholder="usuario@iidesoft.com"
              required
              class="input-iidesoft"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[10px] font-bold text-[#6b7280] uppercase tracking-widest ml-0.5"
                >Contraseña</label
              >
              <RouterLink
                to="/forgot-password"
                class="text-[10px] font-bold text-[#2b7194] hover:underline uppercase tracking-wide"
                >¿Olvidaste tu contraseña?</RouterLink
              >
            </div>
            <div class="relative flex items-center">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                class="input-iidesoft pr-12"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 text-gray-400 hover:text-[#012737]"
              >
                <EyeOff v-if="!showPassword" :size="18" /> <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <div class="min-h-[40px]">
            <Transition name="fade" mode="out-in">
              <div
                v-if="isPending"
                class="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 shadow-sm"
              >
                <AlertCircle class="text-amber-600 shrink-0" :size="20" />
                <div>
                  <p
                    class="text-amber-800 text-[11px] font-bold uppercase tracking-tight leading-tight"
                  >
                    Acceso en revisión
                  </p>
                  <p class="text-amber-700 text-[11px] mt-1 leading-normal">
                    Tu cuenta aún no ha sido activada por un administrador. Recibirás un correo
                    cuando el acceso sea aprobado.
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
            </Transition>
          </div>

          <AppButton
            type="submit"
            variant="dark"
            :isLoading="isLoading"
            class="w-full !bg-[#012737] !py-3.5 !rounded-lg !text-sm !font-bold !tracking-wide shadow-lg shadow-[#012737]/20 transition-all active:scale-[0.98]"
          >
            <template #default>Entrar al sistema</template>
          </AppButton>
        </form>

        <div class="mt-8 pt-6 border-t border-gray-200/50 text-center">
          <span class="text-sm text-[#6b7280]">¿No tienes cuenta?</span>
          <RouterLink to="/register" class="font-bold text-[#2b7194] underline ml-1"
            >Regístrate</RouterLink
          >
        </div>

        <div class="mt-12 text-center">
          <p class="text-[10px] font-bold text-[#b0a89a] tracking-[0.2em] uppercase">
            IIDESOFT · SISTEMA GEOESPACIAL · V2.0
          </p>
        </div>
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
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const form = reactive({ email: '', password: '' })
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const isPending = ref(false) // Nueva variable para errores de validación

const handleLogin = async () => {
  errorMessage.value = ''
  isPending.value = false
  isLoading.value = true

  try {
    const response = await authService.login({ email: form.email, password: form.password })
    const token = response.token
    if (token) {
      authStore.login(token)
      router.push('/dashboard')
    } else throw new Error('No se recibió el token.')
  } catch (error) {
    const message = error.response?.data?.message || ''

    // DETECCIÓN DE CUENTA PENDIENTE (Amber)
    if (
      message.toLowerCase().includes('validar') ||
      message.toLowerCase().includes('pendiente') ||
      message.toLowerCase().includes('activada')
    ) {
      isPending.value = true
    } else {
      errorMessage.value = message || 'Credenciales inválidas.'
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
