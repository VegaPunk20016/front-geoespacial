<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, X } from 'lucide-vue-next'
import AppButton from './AppButton.vue'
import { useAuthStore } from '../stores/authStore' // 1. Importamos el Store

const isMenuOpen = ref(false)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore() // 2. Inicializamos el Store

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))

// Funciones de navegación
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

// 3. Función para cerrar sesión desde la Navbar
const handleLogout = () => {
  isMenuOpen.value = false
  authStore.logout() // Borramos el token del store y localStorage
  router.push('/login') // Redirigimos
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
      class="flex items-center w-full bg-[#177DA6]/10 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] backdrop-blur-md border border-white/20 rounded-full px-5 py-1.5"
      :class="isAuthPage ? 'justify-center' : 'justify-between'"
    >
      <div
        class="flex h-[40px] w-[40px] md:h-[55px] md:w-[55px] items-center justify-center cursor-pointer transition-transform hover:scale-105"
        @click="router.push('/')"
      >
        <img src="/Logo-O.ico" alt="Logo Iidesoft" class="w-full h-auto drop-shadow-md" />
      </div>

      <template v-if="!isAuthPage">
        <button
          class="md:hidden text-[#012737] p-1.5 rounded-lg bg-black/5 hover:bg-black/10"
          @click="isMenuOpen = !isMenuOpen"
        >
          <Menu v-if="!isMenuOpen" :size="20" />
          <X v-else :size="20" />
        </button>

        <div
          class="hidden md:flex items-center gap-2 bg-[#177DA6]/20 p-1.5 rounded-2xl shadow-inner"
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

    <Transition name="slide-down">
      <div
        v-if="isMenuOpen && !isAuthPage"
        class="absolute top-[65px] left-4 right-4 bg-white p-4 rounded-2xl shadow-xl md:hidden flex flex-col gap-2 border border-gray-100"
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

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
