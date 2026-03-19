<template>
  <div class="h-[calc(100vh-80px)] overflow-y-auto relative" style="background: var(--color-base)">
    <!-- Fondo decorativo -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
        style="background: radial-gradient(circle, var(--color-primary) 0%, transparent 70%)"
      ></div>
      <div
        class="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-[0.06]"
        style="background: radial-gradient(circle, var(--color-dark) 0%, transparent 70%)"
      ></div>
    </div>

    <div class="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col gap-10">
      <!-- Header de bienvenida -->
      <div class="text-center space-y-3 animate-fade-up">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
          style="
            background: var(--color-primary) / 10;
            color: var(--color-primary);
            border: 1px solid var(--color-primary) / 20;
          "
        >
          <span
            class="w-1.5 h-1.5 rounded-full animate-pulse"
            style="background: var(--color-primary)"
          ></span>
          Sistema activo
        </div>
        <h1
          class="text-3xl md:text-4xl font-bold"
          style="color: var(--color-dark); letter-spacing: -0.04em"
        >
          Análisis Territorial
        </h1>
        <p class="text-sm md:text-base max-w-md mx-auto" style="color: var(--color-muted)">
          Selecciona un padrón para visualizarlo en el mapa interactivo del Estado de México
        </p>
      </div>

      <!-- Estado cargando -->
      <div v-if="store.status === 'loading'" class="flex flex-col items-center gap-4 py-8">
        <div
          class="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style="border-color: var(--color-primary); border-top-color: transparent"
        ></div>
        <p class="text-sm" style="color: var(--color-muted)">Cargando padrones...</p>
      </div>

      <!-- Grid de padrones -->
      <div v-else-if="store.padrones.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="(p, i) in padronesMuestra"
          :key="p.id"
          @click="router.push(`/consulta/${p.id}`)"
          class="padron-card group relative overflow-hidden rounded-2xl p-6 cursor-pointer"
          :style="{ animationDelay: `${i * 60}ms` }"
        >
          <!-- Fondo de la card -->
          <div
            class="absolute inset-0 transition-opacity duration-300"
            style="
              background: linear-gradient(
                135deg,
                var(--color-dark) 0%,
                var(--color-primary-dark) 100%
              );
            "
          ></div>
          <div
            class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style="
              background: linear-gradient(
                135deg,
                var(--color-primary-dark) 0%,
                var(--color-primary) 100%
              );
            "
          ></div>

          <!-- Patrón decorativo -->
          <div class="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none">
            <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="96" cy="32" r="60" stroke="white" stroke-width="1" />
              <circle cx="96" cy="32" r="40" stroke="white" stroke-width="1" />
              <circle cx="96" cy="32" r="20" stroke="white" stroke-width="1" />
            </svg>
          </div>

          <!-- Contenido -->
          <div class="relative z-10 flex flex-col gap-4 h-full">
            <div class="flex items-start justify-between">
              <!-- Ícono -->
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center"
                style="background: rgba(255, 255, 255, 0.15)"
              >
                <MapPin :size="18" class="text-white" />
              </div>
              <!-- Badge categoría -->
              <span
                class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                style="background: rgba(255, 255, 255, 0.15); color: rgba(255, 255, 255, 0.85)"
              >
                {{ p.categoria || 'General' }}
              </span>
            </div>

            <div class="flex-1">
              <h3 class="text-base font-bold text-white leading-tight line-clamp-2 mb-1">
                {{ p.nombre_padron }}
              </h3>
              <p class="text-[11px] text-white/55">
                {{ p.entidad_federativa || 'Estado de México' }}
              </p>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-3 border-t border-white/10">
              <span class="text-[10px] text-white/50 font-medium">
                {{ formatDate(p.created_at) }}
              </span>
              <div
                class="flex items-center gap-1 text-white/70 group-hover:text-white transition-colors"
              >
                <span class="text-[11px] font-semibold">Ver mapa</span>
                <ArrowRight :size="13" class="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ver todos -->
      <div v-if="store.padrones.length > 4" class="text-center">
        <p class="text-xs" style="color: var(--color-muted)">
          Mostrando 4 de {{ store.padrones.length }} padrones disponibles
        </p>
      </div>

      <!-- Stats rápidas -->
      <div
        v-if="store.padrones.length"
        class="grid grid-cols-3 gap-3 animate-fade-up"
        style="animation-delay: 300ms"
      >
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-xl p-4 text-center border"
          style="background: white; border-color: var(--color-base-dark)"
        >
          <p
            class="text-2xl font-black mb-1"
            style="color: var(--color-dark); letter-spacing: -0.04em"
          >
            {{ stat.value }}
          </p>
          <p
            class="text-[10px] font-semibold uppercase tracking-wide"
            style="color: var(--color-muted)"
          >
            {{ stat.label }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePadronStore } from '@/stores/padronStore'
import { MapPin, ArrowRight, Database } from 'lucide-vue-next'

const router = useRouter()
const store = usePadronStore()

const padronesMuestra = computed(() => store.padrones.slice(0, 4))

const stats = computed(() => [
  {
    value: store.padrones.length,
    label: 'Padrones',
  },
  {
    value: new Set(store.padrones.map((p) => p.entidad_federativa).filter(Boolean)).size || '—',
    label: 'Entidades',
  },
  {
    value: new Set(store.padrones.map((p) => p.categoria).filter(Boolean)).size || '—',
    label: 'Categorías',
  },
])

const formatDate = (raw) => {
  const str = typeof raw === 'object' && raw !== null ? raw.date : raw
  if (!str) return '—'
  const d = new Date(str.replace(' ', 'T'))
  return isNaN(d) ? '—' : d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
}

onMounted(async () => {
  if (store.status === 'idle' || store.status === 'error') {
    await store.fetchPadrones()
  }
})
</script>

<style scoped>
.padron-card {
  animation: fadeUp 0.4s ease both;
  min-height: 200px;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
