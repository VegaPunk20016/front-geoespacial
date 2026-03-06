<template>
  <tr class="hover:bg-gray-50 transition-colors group">
    <td class="px-6 py-4">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full bg-[#177DA6]/10 text-[#177DA6] flex items-center justify-center font-bold text-xs uppercase"
        >
          {{ avatarLetter }}
        </div>
        <span class="font-medium text-gray-800 text-sm">{{ user.username || 'Sin nombre' }}</span>
      </div>
    </td>
    <td class="px-6 py-4 text-sm text-gray-600">{{ user.email }}</td>
    <td class="px-6 py-4">
      <span
        class="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
      >
        {{ user.role_name || user.role || 'Usuario' }}
      </span>
    </td>
    <td class="px-6 py-4 text-right">
      <div
        class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          @click="$emit('edit', user)"
          class="p-1.5 text-gray-400 hover:text-[#177DA6] transition-colors rounded hover:bg-gray-100"
        >
          <Edit2 :size="16" />
        </button>
        <button
          @click="$emit('delete', user.email)"
          class="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue'
import { Edit2, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  user: { type: Object, required: true },
})

const avatarLetter = computed(() =>
  (props.user.username?.charAt(0) || props.user.email?.charAt(0) || '?').toUpperCase(),
)

defineEmits(['edit', 'delete'])
</script>
