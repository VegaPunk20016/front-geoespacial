<template>
  <div class="min-h-[calc(100vh-80px)] bg-gray-50 p-6 md:p-8">
    <header class="mb-8">
      <h1 class="text-2xl font-bold text-gray-800">Panel de Administración</h1>
      <p class="text-sm text-gray-500 mt-1">Resumen operativo y métricas del sistema.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div
        class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
      >
        <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Users :size="24" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Usuarios Activos</p>
          <h3 class="text-2xl font-bold text-gray-800">1,248</h3>
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"
        >
          <MapPin :size="24" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Consultas DENUE</p>
          <h3 class="text-2xl font-bold text-gray-800">8,592</h3>
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
      >
        <div
          class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"
        >
          <Download :size="24" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Reportes Generados</p>
          <h3 class="text-2xl font-bold text-gray-800">342</h3>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 class="text-lg font-bold text-gray-800 mb-4">Actividad Reciente</h2>
      <div class="space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
        >
          <div class="w-2 h-2 mt-2 rounded-full bg-[#177DA6]"></div>
          <div>
            <p class="text-sm font-medium text-gray-800">Nuevo reporte exportado</p>
            <p class="text-xs text-gray-500">
              El usuario analista@iidesoft.com exportó datos de CDMX.
            </p>
          </div>
          <span class="ml-auto text-xs text-gray-400">Hace 2 horas</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Users, MapPin, Download } from 'lucide-vue-next'
</script>
