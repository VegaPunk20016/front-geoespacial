<template>
  <div class="flex h-full overflow-hidden relative">
    <!-- Overlay mobile -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 md:hidden"
        style="background: rgba(1, 39, 55, 0.5)"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed md:relative inset-y-0 left-0 z-40 flex flex-col overflow-y-auto transition-transform duration-300 w-56 flex-shrink-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
      style="background: var(--color-dark)"
    >
      <div
        class="px-5 py-5 border-b flex items-center justify-between"
        style="border-color: rgba(255, 255, 255, 0.08)"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style="
              background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
            "
          >
            II
          </div>
          <div>
            <div class="text-sm font-bold text-white tracking-wide">IIDESOFT</div>
            <div
              class="text-[9px] uppercase tracking-widest mt-0.5"
              style="color: rgba(255, 255, 255, 0.35)"
            >
              Sistema Geoespacial
            </div>
          </div>
        </div>
        <button
          class="md:hidden p-1 rounded"
          style="color: rgba(255, 255, 255, 0.4); background: none; border: none; cursor: pointer"
          @click="sidebarOpen = false"
        >
          <X :size="16" />
        </button>
      </div>

      <div
        class="px-5 pt-5 pb-2 text-[9px] font-bold uppercase tracking-widest"
        style="color: rgba(255, 255, 255, 0.25)"
      >
        Módulos
      </div>

      <nav class="px-3 space-y-0.5">
        <button
          class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-left text-white"
          style="background: var(--color-primary)"
        >
          <Database :size="16" style="flex-shrink: 0" /> Padrones
        </button>
      </nav>

      <div class="mt-auto border-t p-3" style="border-color: rgba(255, 255, 255, 0.08)">
        <div
          class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg"
          style="background: rgba(255, 255, 255, 0.05)"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style="
              background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
            "
          >
            {{ userInitials }}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-semibold text-white truncate">
              {{ authStore.username || 'Administrador' }}
            </div>
            <div
              class="text-[9px] uppercase tracking-wider"
              style="color: rgba(255, 255, 255, 0.35)"
            >
              Admin
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0" style="background: var(--color-base)">
      <div
        class="h-14 flex-shrink-0 flex items-center gap-3 px-4 md:px-7 border-b"
        style="background: var(--color-base); border-color: var(--color-base-dark)"
      >
        <button
          class="md:hidden p-2 rounded-lg border"
          style="color: var(--color-muted); border-color: var(--color-base-dark); background: white"
          @click="sidebarOpen = true"
        >
          <Menu :size="16" />
        </button>
        <div class="flex items-center gap-2 text-xs" style="color: var(--color-muted)">
          <span class="hidden sm:inline">IIDESOFT</span>
          <span class="hidden sm:inline" style="opacity: 0.4">/</span>
          <span class="font-semibold" style="color: var(--color-ink)">Padrones</span>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-4 md:p-7">
        <TabPadrones />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Database, Menu, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import TabPadrones from './admin/TabPadrones.vue'

const authStore = useAuthStore()
const sidebarOpen = ref(false)
const userInitials = computed(() => {
  const n = authStore.username || ''
  return (
    n
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AD'
  )
})
</script>
