<template>
  <tr class="transition-colors hover:bg-[#fafaf8]" :class="{ 'opacity-50': isInactive }">
    <!-- Usuario -->
    <td class="px-6 py-4">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          :style="`background:${avatarBg};color:${avatarColor};`"
        >
          {{ initials }}
        </div>
        <span class="text-sm font-semibold text-[#012737]">{{ user.username }}</span>
      </div>
    </td>

    <!-- Correo -->
    <td class="px-6 py-4 text-xs text-[#6b7280]">{{ user.email }}</td>

    <!-- Rol -->
    <td class="px-6 py-4">
      <span
        class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
        :style="rolStyle"
      >
        {{ rolLabel }}
      </span>
    </td>

    <!-- Estado -->
    <td class="px-6 py-4">
      <span
        v-if="isInactive"
        class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-gray-100 text-gray-500"
      >
        Inactivo
      </span>
      <span
        v-else
        class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-600"
      >
        Activo
      </span>
    </td>

    <!-- Acciones -->
    <td class="px-6 py-4">
      <div class="flex items-center gap-1.5">
        <!-- Editar (solo activos) -->
        <button
          v-if="!isInactive"
          @click="$emit('edit', user)"
          class="p-1.5 rounded-lg transition-all hover:bg-[#e0f0f7]"
          style="color: #6b7280"
          title="Editar"
        >
          <Pencil :size="14" />
        </button>

        <!-- Desactivar (solo activos) -->
        <button
          v-if="!isInactive"
          @click="$emit('delete', user.email)"
          class="p-1.5 rounded-lg transition-all hover:bg-red-50"
          style="color: #6b7280"
          title="Desactivar"
        >
          <UserX :size="14" />
        </button>

        <!-- Reactivar (solo inactivos) -->
        <button
          v-if="isInactive"
          @click="$emit('restore', user)"
          class="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
          title="Reactivar"
        >
          <RotateCcw :size="12" /> Reactivar
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import { Pencil, UserX, RotateCcw } from 'lucide-vue-next'

const props = defineProps({ user: { type: Object, required: true } })
defineEmits(['edit', 'delete', 'restore'])

// deleted_at puede ser null o un objeto CI4 { date, timezone_type, timezone }
const isInactive = computed(
  () => props.user.deleted_at !== null && props.user.deleted_at !== undefined,
)

// Campo "role" (no "role_name")
const roleMap = {
  super_admin: { label: 'Super Admin', bg: '#EDE9E3', color: '#3B2F1E' },
  admin: { label: 'Admin', bg: '#E0F0F7', color: '#177DA6' },
  user: { label: 'Usuario', bg: '#E8E5DF', color: '#4A6572' },
}
const roleKey = computed(() => props.user.role || 'user')
const rolLabel = computed(() => roleMap[roleKey.value]?.label ?? roleKey.value)
const rolStyle = computed(() => {
  const r = roleMap[roleKey.value] ?? roleMap.user
  return `background:${r.bg};color:${r.color};`
})

// Avatar
const initials = computed(() =>
  (props.user.username || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2),
)
const avatarPalette = [
  { bg: '#E0F0F7', color: '#177DA6' },
  { bg: '#DDF0EC', color: '#1A7A6E' },
  { bg: '#EDE9E3', color: '#5C4D3C' },
  { bg: '#DCFCE7', color: '#166534' },
]
const idx = computed(() => (props.user.email?.charCodeAt(0) ?? 0) % avatarPalette.length)
const avatarBg = computed(() => avatarPalette[idx.value].bg)
const avatarColor = computed(() => avatarPalette[idx.value].color)
</script>
