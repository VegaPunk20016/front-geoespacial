<template>
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
  >
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
        <h3 class="text-lg font-bold text-[#012737]">Editar Usuario</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-red-500 transition-colors">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSave" class="p-5 space-y-4">
        <div v-for="field in formFields" :key="field.id">
          <label class="block text-xs font-semibold text-gray-600 uppercase mb-1">{{
            field.label
          }}</label>
          <input
            v-model="localForm[field.model]"
            :type="field.type"
            :required="field.required"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#177DA6]/20 focus:border-[#177DA6] outline-none transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 uppercase mb-1"
            >Rol del Sistema</label
          >
          <select
            v-model="localForm.role_id"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#177DA6]/20 focus:border-[#177DA6] outline-none transition-all"
          >
            <option :value="1">Super Admin</option>
            <option :value="2">Admin</option>
            <option :value="3">Usuario</option>
          </select>
        </div>

        <div class="flex gap-3 pt-4 mt-2 border-t border-gray-100">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSaving"
            class="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#177DA6] hover:bg-[#012737] rounded-lg flex justify-center items-center gap-2 transition-colors"
          >
            <Loader2 v-if="isSaving" class="animate-spin" :size="16" />
            {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  user: { type: Object, required: true },
  isSaving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const localForm = reactive({
  username: '',
  email: '',
  role_id: 3,
})

const formFields = [
  { id: 1, label: 'Nombre de Usuario', model: 'username', type: 'text', required: true },
  { id: 2, label: 'Correo Electrónico', model: 'email', type: 'email', required: true },
]

// Sincronizar props con el estado local al abrir
watch(
  () => props.user,
  (newVal) => {
    localForm.username = newVal.username
    localForm.email = newVal.email
    localForm.role_id =
      newVal.role_id ||
      (newVal.role_name === 'super_admin' ? 1 : newVal.role_name === 'admin' ? 2 : 3)
  },
  { immediate: true },
)

const handleSave = () => emit('save', { ...localForm })
</script>
