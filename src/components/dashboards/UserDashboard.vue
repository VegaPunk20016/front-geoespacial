<template>
  <div class="h-[calc(100vh-80px)] bg-gray-50 flex flex-col items-center justify-center p-6">
    <!-- Card principal -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8 text-center"
    >
      <!-- Icono -->
      <div
        class="w-16 h-16 bg-[#012737]/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
      >
        <Map :size="32" class="text-[#012737]" />
      </div>

      <!-- Título -->
      <h1 class="text-xl font-bold text-gray-800 mb-2">Bienvenido al Sistema de Padrones</h1>
      <p class="text-sm text-gray-500 mb-8">
        Consulta, explora y visualiza en el mapa los padrones disponibles.
      </p>

      <!-- Botón principal -->
      <button
        @click="router.push('/consulta')"
        class="w-full bg-[#012737] hover:bg-[#177DA6] text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md mb-3"
      >
        <Map :size="16" /> Explorar Padrones en el Mapa
      </button>

      <p class="text-xs text-gray-400">
        Selecciona un padrón, filtra por municipio y visualiza los registros geolocalizados.
      </p>
    </div>

    <!-- Stats rápidas si hay padrones cargados -->
    <div v-if="store.padrones.length" class="mt-6 grid grid-cols-2 gap-4 w-full max-w-lg">
      <div
        v-for="p in padronesMuestra"
        :key="p.id"
        @click="router.push(`/consulta/${p.id}`)"
        class="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-[#177DA6] hover:shadow-sm transition-all"
      >
        <p class="text-xs font-bold text-[#177DA6] uppercase tracking-wide mb-1">
          {{ p.categoria || 'General' }}
        </p>
        <p class="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
          {{ p.nombre_padron }}
        </p>
        <p class="text-[10px] text-gray-400 mt-1">{{ p.entidad_federativa || '—' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePadronStore } from '@/stores/padronStore'
import { Map } from 'lucide-vue-next'

const router = useRouter()
const store = usePadronStore()

// Mostrar máximo 4 padrones como accesos rápidos
const padronesMuestra = computed(() => store.padrones.slice(0, 4))

onMounted(async () => {
  if (store.status === 'idle' || store.status === 'error') {
    await store.fetchPadrones()
  }
})
</script>
