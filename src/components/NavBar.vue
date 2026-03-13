<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'

const isMenuOpen = ref(false)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))

const navLinks = [
  { name: 'Inicio', path: '/' },
  // Agrega más links si es necesario
]

const closeMenu = () => (isMenuOpen.value = false)

const handleAction = (action) => {
  closeMenu()
  action()
}

const handleResize = () => {
  if (window.innerWidth >= 768 && isMenuOpen.value) isMenuOpen.value = false
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<template>
  <nav
    class="sticky top-0 w-full z-50 transition-all duration-300 border-b border-white/10 backdrop-blur-md bg-opacity-80"
    style="background-color: color-mix(in srgb, var(--color-primary), transparent 15%)"
  >
    <div class="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
      <div
        @click="router.push('/')"
        class="flex items-center gap-3 cursor-pointer group transition-transform active:scale-95"
      >
        <div class="relative">
          <img
            src="/Logo-O.ico"
            alt="Logo"
            class="h-9 w-9 drop-shadow-xl group-hover:rotate-6 transition-transform duration-300"
          />
          <div
            class="absolute -inset-1 bg-white/20 blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          ></div>
        </div>
        <span class="font-black text-white text-lg tracking-wider hidden sm:block uppercase">
          Iidesoft
        </span>
      </div>

      <template v-if="!isAuthPage">
        <div class="hidden md:flex items-center gap-4">
          <template v-if="!authStore.isAuthenticated">
            <button
              @click="router.push('/login')"
              class="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
            >
              <LogIn :size="18" />
              Inicia Sesión
            </button>
            <button
              @click="router.push('/register')"
              class="px-6 py-2 text-sm font-bold rounded-full shadow-lg shadow-white/5 hover:shadow-white/10 transform hover:-translate-y-0.5 transition-all"
              style="background: white; color: var(--color-primary)"
            >
              Registrarse
            </button>
          </template>

          <template v-else>
            <button
              @click="(authStore.logout(), router.push('/login'))"
              class="p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-200 border border-red-500/20 transition-all"
              title="Cerrar Sesión"
            >
              <LogOut :size="20" />
            </button>
          </template>
        </div>

        <button
          @click="isMenuOpen = !isMenuOpen"
          class="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
        >
          <Menu v-if="!isMenuOpen" :size="24" />
          <X v-else :size="24" />
        </button>
      </template>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="isMenuOpen && !isAuthPage"
        class="absolute top-full left-0 w-full md:hidden border-b border-white/10 shadow-2xl overflow-hidden"
        style="background: var(--color-primary)"
      >
        <div class="flex flex-col p-4 gap-3">
          <template v-if="!authStore.isAuthenticated">
            <button
              @click="handleAction(() => router.push('/login'))"
              class="w-full py-3.5 px-4 rounded-xl text-white font-medium bg-white/5 border border-white/10 flex items-center gap-3"
            >
              <LogIn :size="20" /> Inicia Sesión
            </button>
            <button
              @click="handleAction(() => router.push('/register'))"
              class="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2"
              style="background: white; color: var(--color-primary)"
            >
              <UserPlus :size="20" /> Registrarse
            </button>
          </template>
          <template v-else>
            <button
              @click="
                handleAction(() => {
                  ;(authStore.logout(), router.push('/login'))
                })
              "
              class="w-full py-3.5 px-4 rounded-xl font-bold text-red-200 bg-red-500/20 border border-red-500/20 flex items-center gap-3"
            >
              <LogOut :size="20" /> Cerrar Sesión
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
/* Sutil gradiente para profundidad */
nav {
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
</style>
