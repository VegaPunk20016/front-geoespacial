<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, X } from 'lucide-vue-next'
import AppButton from './AppButton.vue'
import { useAuthStore } from '../stores/authStore'

const isMenuOpen = ref(false)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))

const goToLogin = () => {
  isMenuOpen.value = false
  router.push('/login')
}
const goToRegister = () => {
  isMenuOpen.value = false
  router.push('/register')
}
const goToDashboard = () => {
  isMenuOpen.value = false
  router.push('/dashboard')
}
const handleLogout = () => {
  isMenuOpen.value = false
  authStore.logout()
  router.push('/login')
}

const handleResize = () => {
  if (window.innerWidth >= 768 && isMenuOpen.value) isMenuOpen.value = false
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<template>
  <nav
    class="relative left-1/2 -translate-x-1/2 z-50 w-full max-w-[850px] px-4 transition-all duration-300"
  >
    <div
      class="flex items-center w-full backdrop-blur-md border rounded-full px-5 py-1.5"
      :class="isAuthPage ? 'justify-center' : 'justify-between'"
      style="
        background: rgba(23, 125, 166, 0.1);
        border-color: rgba(255, 255, 255, 0.22);
        box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
      "
    >
      <!-- Logo -->
      <div
        class="flex h-[40px] w-[40px] md:h-[55px] md:w-[55px] items-center justify-center cursor-pointer transition-transform hover:scale-105"
        @click="router.push('/')"
      >
        <img src="/Logo-O.ico" alt="Logo Iidesoft" class="w-full h-auto drop-shadow-md" />
      </div>

      <template v-if="!isAuthPage">
        <!-- Hamburguesa mobile -->
        <button
          class="md:hidden p-1.5 rounded-lg transition-colors"
          style="color: var(--color-dark); background: rgba(0, 0, 0, 0.05)"
          @click="isMenuOpen = !isMenuOpen"
        >
          <Menu v-if="!isMenuOpen" :size="20" />
          <X v-else :size="20" />
        </button>

        <!-- Botones desktop -->
        <div
          class="hidden md:flex items-center gap-2 p-1.5 rounded-2xl shadow-inner"
          style="background: rgba(23, 125, 166, 0.18)"
        >
          <template v-if="!authStore.isAuthenticated">
            <AppButton
              label="Inicia Sesión"
              variant="base"
              class="!py-1.5 !px-4 text-xs"
              @click="goToLogin"
            />
            <AppButton
              label="Registrarse"
              variant="dark"
              class="!py-1.5 !px-4 text-xs"
              @click="goToRegister"
            />
          </template>
          <template v-else>
            <AppButton
              label="Dashboard"
              variant="base"
              class="!py-1.5 !px-4 text-xs"
              @click="goToDashboard"
            />
            <AppButton
              label="Cerrar Sesión"
              variant="dark"
              class="!py-1.5 !px-4 text-xs"
              @click="handleLogout"
            />
          </template>
        </div>
      </template>
    </div>

    <!-- Menú mobile -->
    <Transition name="slide-down">
      <div
        v-if="isMenuOpen && !isAuthPage"
        class="absolute top-[65px] left-4 right-4 p-4 rounded-2xl shadow-xl md:hidden flex flex-col gap-2 border"
        style="background: white; border-color: var(--color-base-dark)"
      >
        <template v-if="!authStore.isAuthenticated">
          <AppButton
            label="Inicia Sesión"
            variant="base"
            class="w-full !py-2 text-sm"
            @click="goToLogin"
          />
          <AppButton
            label="Registrarse"
            variant="dark"
            class="w-full !py-2 text-sm"
            @click="goToRegister"
          />
        </template>
        <template v-else>
          <AppButton
            label="Dashboard"
            variant="base"
            class="w-full !py-2 text-sm"
            @click="goToDashboard"
          />
          <AppButton
            label="Cerrar Sesión"
            variant="dark"
            class="w-full !py-2 text-sm"
            @click="handleLogout"
          />
        </template>
      </div>
    </Transition>
  </nav>
</template>
