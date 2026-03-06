<template>
  <tr class="hover:bg-gray-50/80 transition-colors group">
    <td class="px-6 py-4">
      <div class="flex flex-col">
        <span class="text-sm font-bold text-gray-900">{{ padron.nombre_padron }}</span>
        <span class="text-xs text-gray-500 truncate max-w-xs mt-0.5" :title="padron.descripcion">
          {{ padron.descripcion || 'Sin descripción' }}
        </span>
      </div>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
      <span
        class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#177DA6]/10 text-[#177DA6] border border-[#177DA6]/20"
      >
        {{ padron.categoria || 'General' }}
      </span>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
      <div class="flex items-center text-sm text-gray-600">
        <MapPin class="w-4 h-4 mr-1.5 text-gray-400" />
        {{ padron.entidad_federativa }}
      </div>
    </td>

    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      <div class="flex items-center">
        <Calendar class="w-4 h-4 mr-1.5 text-gray-400" />
        {{ formatearFecha(padron.created_at) }}
      </div>
    </td>

    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <div class="flex items-center gap-2 justify-end">
        <button
          @click="$emit('ver-datos', padron)"
          class="flex items-center gap-1.5 text-gray-600 hover:text-[#177DA6] bg-white hover:bg-gray-100 border border-transparent hover:border-gray-200 px-3 py-1.5 rounded-md transition-all shadow-sm group-hover:shadow"
          title="Ver registros del padrón"
        >
          <Eye class="w-4 h-4" />
          <span>Ver</span>
        </button>

        <button
          @click="$emit('importar', padron)"
          class="flex items-center gap-1.5 text-[#177DA6] hover:text-[#012737] bg-white hover:bg-gray-100 border border-transparent hover:border-gray-200 px-3 py-1.5 rounded-md transition-all shadow-sm group-hover:shadow"
          title="Cargar archivo CSV"
        >
          <FileUp class="w-4 h-4" />
          <span>Importar</span>
        </button>

        <button
          @click="$emit('eliminar', padron)"
          class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Eliminar padrón"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
// Pilar 3: Composition API pura
import { defineProps, defineEmits } from 'vue'
import { MapPin, Calendar, FileUp, Trash2, Eye } from 'lucide-vue-next'

// Definimos lo que recibimos del padre (El objeto de datos)
const props = defineProps({
  padron: {
    type: Object,
    required: true,
  },
})

// Agregamos 'ver-datos' a la lista de gritos al padre
defineEmits(['importar', 'eliminar', 'ver-datos'])

// Utilidad local para que la fecha se vea bonita (ej. "6 mar 2026")
const formatearFecha = (fechaOriginal) => {
  if (!fechaOriginal) return 'N/A'

  try {
    let textoFecha = ''
    if (typeof fechaOriginal === 'object' && fechaOriginal.date) {
      textoFecha = fechaOriginal.date
    } else {
      textoFecha = String(fechaOriginal)
    }
    const fechaSegura = textoFecha.replace(' ', 'T')
    const fecha = new Date(fechaSegura)

    if (isNaN(fecha.getTime())) return 'Fecha inválida'
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (error) {
    return 'Error'
  }
}
</script>
