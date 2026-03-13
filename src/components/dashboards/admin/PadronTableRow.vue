<template>
  <tr style="border-bottom: 1px solid #f0ede7" class="transition-colors hover:bg-[#FAFAF8]">
    <!-- Nombre -->
    <td class="px-5 py-4">
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
    </td>

    <!-- Categoría -->
    <td class="px-5 py-4">
      <span class="text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide" :style="catStyle">
        {{ padron.categoria || '—' }}
      </span>
    </td>

    <!-- Entidad -->
    <td class="px-5 py-4 text-xs" style="color: var(--color-muted)">
      {{ padron.entidad_federativa || '—' }}
    </td>

    <!-- Fecha -->
    <td class="px-5 py-4 text-xs" style="color: var(--color-muted)">
      {{ formatDate(padron.created_at) }}
    </td>

    <!-- Acciones -->
    <td class="px-5 py-4">
      <div class="flex items-center gap-1.5 justify-end">
        <button
          @click="$emit('ver-datos', padron)"
          class="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all"
          style="border-color: var(--color-base-dark); color: var(--color-muted); background: white"
          @mouseenter="
            (e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)'
              e.currentTarget.style.color = 'var(--color-primary)'
            }
          "
          @mouseleave="
            (e) => {
              e.currentTarget.style.borderColor = 'var(--color-base-dark)'
              e.currentTarget.style.color = 'var(--color-muted)'
            }
          "
        >
          Ver
        </button>
        <button
          @click="$emit('importar', padron)"
          class="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all"
          style="border-color: var(--color-primary); color: var(--color-primary); background: white"
          @mouseenter="
            (e) => {
              e.currentTarget.style.background = 'var(--color-primary)'
              e.currentTarget.style.color = 'white'
            }
          "
          @mouseleave="
            (e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.color = 'var(--color-primary)'
            }
          "
        >
          Importar
        </button>
        <button
          @click="$emit('eliminar', padron)"
          class="p-1.5 rounded-lg transition-all"
          style="color: var(--color-muted); background: transparent"
          @mouseenter="
            (e) => {
              e.currentTarget.style.background = '#FEE2E2'
              e.currentTarget.style.color = '#991B1B'
            }
          "
          @mouseleave="
            (e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--color-muted)'
            }
          "
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'

const props = defineProps({ padron: { type: Object, required: true } })
defineEmits(['ver-datos', 'importar', 'eliminar'])

const catPalette = {
  Agrícola: { bg: '#DDF0EC', color: '#1A7A6E' },
  INEGI: { bg: '#E0F0F7', color: '#177DA6' },
  Electoral: { bg: '#EDE9E3', color: '#5C4D3C' },
  Social: { bg: '#DCFCE7', color: '#166534' },
}
const catStyle = computed(() => {
  const c = catPalette[props.padron.categoria] ?? { bg: '#E8E5DF', color: '#4A6572' }
  return `background:${c.bg};color:${c.color};`
})

const formatDate = (raw) => {
  // CI4 devuelve { date: "2026-03-06 ...", timezone_type, timezone }
  const str = typeof raw === 'object' && raw !== null ? raw.date : raw
  if (!str) return '—'
  const d = new Date(str.replace(' ', 'T'))
  return isNaN(d)
    ? '—'
    : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
