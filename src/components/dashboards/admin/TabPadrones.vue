<template>
  <div>
    <header class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Gestión de Padrones</h1>
        <p class="text-sm text-gray-500 mt-1">
          Administra los catálogos y cargas masivas de datos geoespaciales.
        </p>
      </div>
      <button
        @click="isCreateModalOpen = true"
        class="bg-[#177DA6] hover:bg-[#126385] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
      >
        <Plus :size="16" /> Nuevo Padrón
      </button>
    </header>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <!-- Estado: Error -->
      <div v-if="status === 'error'" class="p-6 text-center text-red-600 bg-red-50">
        <AlertCircle class="mx-auto mb-2" :size="32" />
        <p class="font-bold">Error al cargar la información</p>
        <p class="text-sm mt-1">{{ errorMessage }}</p>
        <button
          @click="padronStore.fetchPadrones()"
          class="mt-4 underline text-sm hover:text-red-800"
        >
          Reintentar
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left min-w-[800px]">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                v-for="h in [
                  'Nombre del Padrón',
                  'Categoría',
                  'Entidad',
                  'Fecha Creación',
                  'Acciones',
                ]"
                :key="h"
                class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <!-- Estado: Loading -->
            <tr v-if="status === 'loading'">
              <td colspan="5" class="py-12 text-center">
                <Loader2 class="animate-spin mx-auto text-[#177DA6] mb-2" :size="32" />
                <span class="text-sm text-gray-500">Cargando catálogos...</span>
              </td>
            </tr>

            <!-- Estado: Empty -->
            <tr v-else-if="padrones.length === 0">
              <td colspan="5" class="py-12 text-center text-gray-500">
                <Database class="mx-auto text-gray-300 mb-3" :size="48" />
                No hay padrones registrados en el sistema.
              </td>
            </tr>

            <!-- Estado: Success -->
            <PadronTableRow
              v-else
              v-for="padron in padrones"
              :key="padron.id"
              :padron="padron"
              @ver-datos="handleVerDatos"
              @importar="handleOpenImportModal"
              @eliminar="handleDeletePadron"
            />
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modales -->
    <PadronCreateModal
      v-if="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="padronStore.fetchPadrones()"
    />
    <PadronImportModal
      v-if="isImportModalOpen"
      :padron="selectedPadron"
      @close="isImportModalOpen = false"
      @imported="padronStore.fetchPadrones()"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Database, Loader2, Plus, AlertCircle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { usePadronStore } from '@/stores/padronStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

import PadronTableRow from './PadronTableRow.vue'
import PadronCreateModal from './PadronCreateModal.vue'
import PadronImportModal from './PadronImportModal.vue'

// ─── STORE & COMPOSABLES ──────────────────────────────────────────────────────
const padronStore = usePadronStore()
const router = useRouter()
const toast = useToast()
const { confirm } = useConfirm()

// ─── ESTADO DEL STORE (Pilar 2 — Single Source of Truth) ─────────────────────
const { padrones, status, errorMessage } = storeToRefs(padronStore)

// ─── ESTADO LOCAL DE MODALES (solo UI, no datos) ─────────────────────────────
const isCreateModalOpen = ref(false)
const isImportModalOpen = ref(false)
const selectedPadron = ref(null)

// ─── ACCIONES ─────────────────────────────────────────────────────────────────
const handleVerDatos = (padron) => {
  router.push({ name: 'PadronDataView', params: { id: padron.id } })
}

const handleOpenImportModal = (padron) => {
  selectedPadron.value = { ...padron }
  isImportModalOpen.value = true
}

const handleDeletePadron = async (padron) => {
  const ok = await confirm({
    title: `¿Eliminar "${padron.nombre_padron}"?`,
    message: 'Se destruirá la tabla y todos sus datos geográficos. Esta acción es irreversible.',
    confirmText: 'Sí, eliminar definitivamente',
    cancelText: 'Cancelar',
    variant: 'danger',
  })
  if (!ok) return

  try {
    await padronStore.eliminarPadron(padron.id, true)
    toast.success(`Padrón "${padron.nombre_padron}" eliminado correctamente.`)
  } catch {
    toast.error(padronStore.errorMessage || 'Error al eliminar el padrón del servidor.')
  }
}

// ─── CICLO DE VIDA ────────────────────────────────────────────────────────────
onMounted(() => {
  if (padronStore.status === 'idle') {
    padronStore.fetchPadrones()
  }
})
</script>
