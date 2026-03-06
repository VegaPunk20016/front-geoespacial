<template>
  <div class="h-[calc(100vh-80px)] flex bg-white overflow-hidden relative">
    <aside
      class="absolute md:relative z-40 w-80 h-full bg-white border-r border-gray-200 shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out flex flex-col"
      :class="isFiltersOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <div class="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 class="text-base font-bold text-gray-800 flex items-center gap-2">
          <Filter :size="18" class="text-[#177DA6]" /> Filtros DENUE
        </h2>
        <button
          @click="isFiltersOpen = false"
          class="md:hidden text-gray-400 hover:text-gray-800 p-1"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5 space-y-5">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</label>
          <select
            class="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-2 focus:ring-[#177DA6]/20 focus:border-[#177DA6] p-2.5"
          >
            <option>Todos los estados</option>
            <option>Ciudad de México</option>
            <option>Estado de México</option>
            <option>Jalisco</option>
          </select>
        </div>
      </div>

      <div class="p-5 border-t border-gray-100 bg-white">
        <button
          class="w-full bg-[#012737] hover:bg-[#177DA6] text-white py-2.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          <Search :size="16" /> Buscar Establecimientos
        </button>
      </div>
    </aside>

    <main class="flex-1 relative bg-[#e5e7eb] overflow-hidden">
      <button
        @click="isFiltersOpen = true"
        class="md:hidden absolute top-4 left-4 z-[400] bg-white p-2.5 rounded-md shadow-lg text-gray-700 hover:text-[#177DA6]"
      >
        <Filter :size="20" />
      </button>

      <div class="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button
          class="bg-white p-2.5 rounded-md shadow-lg text-gray-700 hover:text-[#177DA6] transition-colors"
          title="Capas"
        >
          <Layers :size="20" />
        </button>
        <button
          @click="resetView"
          class="bg-white p-2.5 rounded-md shadow-lg text-gray-700 hover:text-[#177DA6] transition-colors"
          title="Centrar en México"
        >
          <Crosshair :size="20" />
        </button>
      </div>

      <div class="w-full h-full z-0 relative">
        <l-map ref="mapRef" v-model:zoom="zoom" :center="center" :useGlobalLeaflet="false">
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> IIDESOFT"
          ></l-tile-layer>

          <l-marker :lat-lng="[19.4326, -99.1332]">
            <l-popup>
              <div class="text-center">
                <p class="font-bold text-[#177DA6] mb-1">IIDESOFT Centro</p>
                <p class="text-xs text-gray-600">Marcador de prueba DENUE</p>
              </div>
            </l-popup>
          </l-marker>
        </l-map>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Filter, X, Search, Layers, Crosshair } from 'lucide-vue-next'

// --- IMPORTACIONES DE LEAFLET ---
// ¡CRÍTICO! El CSS debe estar aquí para que el mapa no se rompa
import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'

// Estado de la interfaz
const isFiltersOpen = ref(false)

// Estado del Mapa
const mapRef = ref(null)
const zoom = ref(5) // Nivel de zoom inicial (5 es perfecto para ver todo el país)
const center = ref([23.6345, -102.5528]) // Coordenadas exactas del centro de México

// Función para volver al centro
const resetView = () => {
  zoom.value = 5
  center.value = [23.6345, -102.5528]
}
</script>

<style>
/* Ajuste de seguridad: Leaflet por defecto usa z-indexes muy altos (400, 500, 1000).
   Forzamos a que respete nuestros modales y sidebars de Tailwind */
.leaflet-container {
  z-index: 10 !important;
}
</style>
