<template>
  <div>
    <!-- Page header -->
    <div
      class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 pb-5 border-b"
      style="border-color: var(--color-base-dark)"
    >
      <div>
        <h1
          class="text-lg md:text-xl font-extrabold"
          style="color: var(--color-dark); letter-spacing: -0.03em"
        >
          Catálogo de Padrones
        </h1>
        <p class="text-xs mt-1" style="color: var(--color-muted)">
          Bases de datos georreferenciadas registradas en el sistema.
        </p>
      </div>
      <button
        @click="isCreateModalOpen = true"
        class="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all"
        style="background: var(--color-primary); white-space: nowrap"
      >
        <Plus :size="13" /> Nuevo Padrón
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <div
        class="rounded-lg p-4 border"
        style="background: white; border-color: var(--color-base-dark)"
      >
        <p
          class="text-[10px] font-bold uppercase tracking-widest mb-2"
          style="color: var(--color-muted)"
        >
          Total padrones
        </p>
        <div class="flex items-baseline gap-2">
          <span
            class="text-2xl font-extrabold"
            style="color: var(--color-dark); letter-spacing: -0.04em"
            >{{ status === 'loading' ? '—' : padrones.length }}</span
          >
          <span
            class="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style="background: #ddf0ec; color: #1a7a6e"
            >catálogos</span
          >
        </div>
      </div>
      <div
        class="rounded-lg p-4 border"
        style="background: white; border-color: var(--color-base-dark)"
      >
        <p
          class="text-[10px] font-bold uppercase tracking-widest mb-2"
          style="color: var(--color-muted)"
        >
          Entidades cubiertas
        </p>
        <div class="flex items-baseline gap-2">
          <span
            class="text-2xl font-extrabold"
            style="color: var(--color-primary); letter-spacing: -0.04em"
            >{{ status === 'loading' ? '—' : uniqueEntidades }}</span
          >
          <span
            class="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style="background: #e0f0f7; color: var(--color-primary)"
            >estados</span
          >
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="status === 'error'"
      class="flex items-start gap-3 p-4 mb-4 rounded-lg border"
      style="background: #fee2e2; border-color: #fecaca; color: #991b1b"
    >
      <AlertCircle :size="16" class="shrink-0 mt-0.5" />
      <div class="flex-1">
        <p class="text-sm font-semibold">Error al cargar los padrones</p>
        <p class="text-xs mt-0.5 opacity-80">{{ errorMessage }}</p>
      </div>
      <button @click="padronStore.fetchPadrones()" class="text-xs underline">Reintentar</button>
    </div>

    <!-- Tabla / Cards -->
    <div
      class="rounded-xl border overflow-hidden"
      style="background: white; border-color: var(--color-base-dark)"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 md:px-5 py-3.5 border-b"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <div>
          <p class="text-sm font-bold" style="color: var(--color-dark)">Padrones Registrados</p>
          <p class="text-[11px] mt-0.5" style="color: var(--color-muted)">
            {{ padrones.length }} catálogos en el sistema
          </p>
        </div>
        <button
          @click="padronStore.fetchPadrones()"
          class="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border"
          style="
            border-color: var(--color-base-dark);
            color: var(--color-muted);
            background: white;
            white-space: nowrap;
          "
        >
          <RefreshCw :size="13" /> Actualizar
        </button>
      </div>

      <!-- Mobile: cards -->
      <div class="md:hidden divide-y" style="divide-color: #f0ede7">
        <div v-if="status === 'loading'" v-for="i in 3" :key="i" class="p-4 space-y-2">
          <div class="w-40 h-3 rounded animate-pulse" style="background: var(--color-base-dark)" />
          <div
            class="w-56 h-2.5 rounded animate-pulse"
            style="background: var(--color-base-dark)"
          />
          <div
            class="w-24 h-2.5 rounded animate-pulse"
            style="background: var(--color-base-dark)"
          />
        </div>
        <div v-else-if="padrones.length === 0 && status !== 'error'" class="py-12 text-center">
          <Database :size="28" class="mx-auto mb-2" style="color: var(--color-base-dark)" />
          <p class="text-xs" style="color: var(--color-muted)">No hay padrones registrados.</p>
        </div>
        <div
          v-else
          v-for="padron in padrones"
          :key="padron.id"
          class="p-4"
          style="border-bottom: 1px solid #f0ede7"
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold" style="color: var(--color-ink)">
                {{ padron.nombre_padron }}
              </p>
              <p
                v-if="padron.descripcion"
                class="text-[11px] mt-0.5 line-clamp-1"
                style="color: var(--color-muted)"
              >
                {{ padron.descripcion }}
              </p>
            </div>
            <span
              class="text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0"
              :style="catStyle(padron)"
              >{{ padron.categoria || '—' }}</span
            >
          </div>
          <div class="flex items-center justify-between">
            <div class="text-[11px]" style="color: var(--color-muted)">
              {{ padron.entidad_federativa || '—' }} · {{ formatDate(padron.created_at) }}
            </div>
            <div class="flex items-center gap-1.5">
              <button
                @click="handleVerDatos(padron)"
                class="px-2.5 py-1 text-[11px] font-semibold rounded-lg border"
                style="border-color: var(--color-base-dark); color: var(--color-muted)"
              >
                Ver
              </button>
              <button
                @click="handleOpenImportModal(padron)"
                class="px-2.5 py-1 text-[11px] font-semibold rounded-lg border"
                style="border-color: var(--color-primary); color: var(--color-primary)"
              >
                Importar
              </button>
              <button
                @click="handleDeletePadron(padron)"
                class="p-1.5 rounded-lg"
                style="background: #fee2e2; color: #991b1b"
              >
                <Trash2 :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop: tabla -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full min-w-[680px]">
          <thead>
            <tr style="background: #fdfcfa; border-bottom: 1.5px solid var(--color-base-dark)">
              <th
                v-for="h in ['Nombre del Padrón', 'Categoría', 'Entidad', 'Fecha', 'Acciones']"
                :key="h"
                class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                style="color: var(--color-muted)"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="status === 'loading'" v-for="i in 4" :key="i">
              <td class="px-5 py-4">
                <div
                  class="w-40 h-3 rounded mb-1.5 animate-pulse"
                  style="background: var(--color-base-dark)"
                />
                <div
                  class="w-56 h-2.5 rounded animate-pulse"
                  style="background: var(--color-base-dark)"
                />
              </td>
              <td class="px-5 py-4">
                <div
                  class="w-16 h-4 rounded animate-pulse"
                  style="background: var(--color-base-dark)"
                />
              </td>
              <td class="px-5 py-4">
                <div
                  class="w-28 h-3 rounded animate-pulse"
                  style="background: var(--color-base-dark)"
                />
              </td>
              <td class="px-5 py-4">
                <div
                  class="w-20 h-3 rounded animate-pulse"
                  style="background: var(--color-base-dark)"
                />
              </td>
              <td class="px-5 py-4">
                <div
                  class="w-24 h-6 rounded animate-pulse float-right"
                  style="background: var(--color-base-dark)"
                />
              </td>
            </tr>
            <tr v-else-if="padrones.length === 0 && status !== 'error'">
              <td colspan="5" class="py-14 text-center">
                <Database :size="28" class="mx-auto mb-2" style="color: var(--color-base-dark)" />
                <p class="text-xs" style="color: var(--color-muted)">
                  No hay padrones registrados en el sistema.
                </p>
              </td>
            </tr>
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
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Database, Plus, AlertCircle, RefreshCw, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { usePadronStore } from '@/stores/padronStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import PadronTableRow from './PadronTableRow.vue'
import PadronCreateModal from './PadronCreateModal.vue'
import PadronImportModal from './PadronImportModal.vue'

const router = useRouter()
const padronStore = usePadronStore()
const toast = useToast()
const { confirm } = useConfirm()
const { padrones, status, errorMessage } = storeToRefs(padronStore)

const uniqueEntidades = computed(
  () => new Set(padrones.value.map((p) => p.entidad_federativa)).size,
)
const isCreateModalOpen = ref(false)
const isImportModalOpen = ref(false)
const selectedPadron = ref(null)

const handleOpenImportModal = (padron) => {
  selectedPadron.value = { ...padron }
  isImportModalOpen.value = true
}
const handleVerDatos = (padron) =>
  router.push({ name: 'PadronDataView', params: { id: padron.id } })

const handleDeletePadron = async (padron) => {
  const ok = await confirm({
    title: '¿Eliminar padrón?',
    message: `"${padron.nombre_padron}" y todos sus datos serán eliminados permanentemente.`,
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await padronStore.eliminarPadron(padron.id, true)
    toast.success(`Padrón "${padron.nombre_padron}" eliminado.`)
  } catch {
    toast.error(padronStore.errorMessage || 'Error al eliminar el padrón.')
  }
}

const catPalette = {
  Agrícola: { bg: '#DDF0EC', color: '#1A7A6E' },
  INEGI: { bg: '#E0F0F7', color: '#177DA6' },
  Electoral: { bg: '#EDE9E3', color: '#5C4D3C' },
  Social: { bg: '#DCFCE7', color: '#166534' },
}
const catStyle = (p) => {
  const c = catPalette[p.categoria] ?? { bg: '#E8E5DF', color: '#4A6572' }
  return `background:${c.bg};color:${c.color};`
}

const formatDate = (raw) => {
  if (!raw) return '—'
  const str = typeof raw === 'object' && raw !== null ? raw.date : raw
  if (!str) return '—'
  const d = new Date(str.replace(' ', 'T'))
  return isNaN(d)
    ? '—'
    : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
  if (status.value === 'idle' || status.value === 'error') padronStore.fetchPadrones()
})
</script>
