<template>
  <div class="flex h-full" style="background: var(--color-base)">
    <!-- Panel izquierdo — mismo lenguaje que la landing -->
    <div
      class="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden"
      style="
        background: linear-gradient(
          135deg,
          var(--color-dark) 0%,
          #0d3a4f 55%,
          var(--color-primary) 100%
        );
      "
    >
      <!-- Círculos decorativos (mismos que la landing) -->
      <div
        style="
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: rgba(99, 165, 191, 0.08);
          top: -120px;
          right: -100px;
          pointer-events: none;
        "
      />
      <div
        style="
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          bottom: 60px;
          left: -80px;
          pointer-events: none;
        "
      />

      <!-- Parte superior -->
      <div class="relative z-10">
        <!-- Badge — igual que la landing -->
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-10"
          style="background: rgba(99, 165, 191, 0.15); border: 1px solid rgba(99, 165, 191, 0.25)"
        >
          <span
            class="text-[10px] uppercase tracking-widest font-semibold"
            style="color: var(--color-primary-light)"
          >
            | Sistema de Análisis Territorial |
          </span>
        </div>

        <h1
          class="text-5xl font-extrabold leading-tight text-white mb-5"
          style="letter-spacing: -0.04em"
        >
          Transforma datos<br />oficiales en<br />
          <span style="color: var(--color-primary-light)">decisiones</span>
        </h1>
        <p class="text-sm leading-relaxed max-w-sm" style="color: rgba(255, 255, 255, 0.55)">
          Sistema integrado de bases de datos georreferenciadas — DENUE · INEGI · Electoral — con
          visualización y análisis mediante mapas interactivos.
        </p>
      </div>

      <!-- Mini-stats -->
      <div class="relative z-10 flex items-center gap-8">
        <div>
          <div class="text-3xl font-extrabold text-white" style="letter-spacing: -0.04em">32</div>
          <div
            class="text-[10px] uppercase tracking-widest mt-1"
            style="color: rgba(255, 255, 255, 0.35)"
          >
            Entidades
          </div>
        </div>
        <div style="width: 1px; height: 36px; background: rgba(255, 255, 255, 0.12)" />
        <div>
          <div
            class="text-3xl font-extrabold"
            style="color: var(--color-primary-light); letter-spacing: -0.04em"
          >
            JWT
          </div>
          <div
            class="text-[10px] uppercase tracking-widest mt-1"
            style="color: rgba(255, 255, 255, 0.35)"
          >
            Seguridad
          </div>
        </div>
        <div style="width: 1px; height: 36px; background: rgba(255, 255, 255, 0.12)" />
        <div>
          <div class="text-3xl font-extrabold text-white" style="letter-spacing: -0.04em">CI4</div>
          <div
            class="text-[10px] uppercase tracking-widest mt-1"
            style="color: rgba(255, 255, 255, 0.35)"
          >
            Backend
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho — formulario -->
    <div
      class="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto"
      style="background: var(--color-base)"
    >
      <div class="w-full max-w-sm">
        <!-- Logo + nombre (mobile y desktop) -->
        <div class="flex items-center gap-2.5 mb-8">
          <img src="/Logo-O.ico" alt="IIDESOFT" class="w-8 h-8" />
          <span
            class="font-bold text-base tracking-wide"
            style="color: var(--color-dark); letter-spacing: 0.02em"
          >
            IIDESOFT
          </span>
        </div>

        <h2
          class="text-2xl font-extrabold mb-1"
          style="color: var(--color-dark); letter-spacing: -0.03em"
        >
          Bienvenido
        </h2>
        <p class="text-sm mb-7" style="color: var(--color-muted)">
          Inicia sesión en tu cuenta de acceso
        </p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email -->
          <div>
            <label
              class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
              style="color: var(--color-muted)"
            >
              Correo electrónico
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="usuario@iidesoft.com"
              required
              class="g-input"
            />
          </div>

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label
                class="block text-[11px] font-bold uppercase tracking-widest"
                style="color: var(--color-muted)"
              >
                Contraseña
              </label>
              <RouterLink
                to="/forgot-password"
                class="text-xs font-medium transition-opacity hover:opacity-70"
                style="color: var(--color-primary)"
              >
                ¿Olvidaste tu contraseña?
              </RouterLink>
            </div>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                class="g-input"
                style="padding-right: 2.75rem"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style="
                  color: var(--color-muted);
                  background: none;
                  border: none;
                  cursor: pointer;
                  display: flex;
                "
              >
                <EyeOff v-if="!showPassword" :size="17" />
                <Eye v-else :size="17" />
              </button>
            </div>
          </div>

          <!-- Error -->
          <Transition name="fade">
            <div
              v-if="errorMessage"
              class="text-sm px-4 py-2.5 rounded-lg border flex items-center gap-2"
              style="background: #fee2e2; border-color: #fecaca; color: #991b1b"
            >
              <AlertCircle :size="14" class="shrink-0" />
              {{ errorMessage }}
            </div>
          </Transition>

          <!-- Submit -->
          <AppButton
            type="submit"
            variant="dark"
            label="Entrar al sistema"
            :isLoading="isLoading"
            class="w-full !py-3 text-sm"
          />
        </form>

        <!-- Registro -->
        <div
          class="mt-6 pt-5 text-center text-sm border-t"
          style="border-color: var(--color-base-dark)"
        >
          <span style="color: var(--color-muted)">¿No tienes cuenta?</span>
          <RouterLink
            to="/register"
            class="font-semibold ml-1 transition-opacity hover:opacity-70"
            style="color: var(--color-primary)"
          >
            Regístrate
          </RouterLink>
        </div>

        <!-- Pie de firma institucional -->
        <div class="mt-8 text-center">
          <span
            class="text-[10px] uppercase tracking-widest font-semibold"
            style="color: #b0a89a; letter-spacing: 0.12em"
          >
            IIDESOFT · Sistema Geoespacial · v2.0
          </span>
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

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true
  try {
    const response = await authService.login({ email: form.email, password: form.password })
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
