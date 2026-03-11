<template>
  <div class="flex h-full overflow-hidden">
    <!-- ── Sidebar ── -->
    <aside
      class="w-56 flex-shrink-0 flex flex-col overflow-y-auto"
      style="background: var(--color-dark)"
    >
      <!-- Brand -->
      <div class="px-5 py-5 border-b" style="border-color: rgba(255, 255, 255, 0.08)">
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
      </div>

      <!-- Nav section label -->
      <div
        class="px-5 pt-5 pb-2 text-[9px] font-bold uppercase tracking-widest"
        style="color: rgba(255, 255, 255, 0.25)"
      >
        Principal
      </div>

      <!-- Nav items -->
      <nav class="px-3 space-y-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
          :style="
            activeTab === tab.id
              ? 'background:var(--color-primary);color:white;'
              : 'color:rgba(255,255,255,0.55);background:transparent;'
          "
          @mouseenter="
            (e) => {
              if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
            }
          "
          @mouseleave="
            (e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
              }
            }
          "
        >
          <component :is="tab.icon" :size="16" style="flex-shrink: 0" />
          {{ tab.label }}
        </button>
      </nav>

      <!-- Spacer + user chip -->
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
              Super Admin
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- ── Main ── -->
    <div class="flex-1 flex flex-col overflow-hidden" style="background: var(--color-base)">
      <!-- Topbar -->
      <div
        class="h-14 flex-shrink-0 flex items-center justify-between px-7 border-b"
        style="background: var(--color-base); border-color: var(--color-base-dark)"
      >
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-xs" style="color: var(--color-muted)">
          <span>IIDESOFT</span>
          <span style="opacity: 0.4">/</span>
          <span class="font-semibold" style="color: var(--color-ink)">
            {{ tabs.find((t) => t.id === activeTab)?.label }}
          </span>
        </div>
        <!-- Tab switcher -->
        <div class="flex gap-0.5 p-1 rounded-lg" style="background: var(--color-base-dark)">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all"
            :style="
              activeTab === tab.id
                ? 'background:white;color:var(--color-dark);font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.08);'
                : 'background:transparent;color:var(--color-muted);'
            "
          >
            <component :is="tab.icon" :size="12" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Contenido scrollable -->
      <div class="flex-1 overflow-y-auto p-7">
        <component :is="currentTabComponent" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Users, Database } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import TabUsuarios from './super-admin/TabUsuarios.vue'
import TabPadrones from './admin/TabPadrones.vue'

const authStore = useAuthStore()

const tabs = [
  { id: 'usuarios', label: 'Usuarios', icon: Users, component: TabUsuarios },
  { id: 'padrones', label: 'Padrones', icon: Database, component: TabPadrones },
]

const activeTab = ref('usuarios')
const currentTabComponent = computed(
  () => tabs.find((t) => t.id === activeTab.value)?.component ?? TabUsuarios,
)
const userInitials = computed(() => {
  const n = authStore.username || ''
  return (
    n
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'SA'
  )
})
</script>
