<template>
  <div>
    <header class="mb-8">
      <h1 class="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
      <p class="text-sm text-gray-500 mt-1">Administra cuentas y accesos del sistema.</p>
    </header>

    <!-- Estado: Error -->
    <div
      v-if="hasError"
      class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700"
    >
      <AlertCircle :size="20" class="shrink-0" />
      <div>
        <p class="font-bold text-sm">Error al cargar usuarios</p>
        <p class="text-xs mt-0.5">{{ errorMessage }}</p>
      </div>
      <button @click="userStore.fetchUsers()" class="ml-auto text-xs underline hover:text-red-900">
        Reintentar
      </button>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left min-w-[600px]">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                v-for="h in ['Usuario', 'Correo', 'Rol', '']"
                :key="h"
                class="px-6 py-4 text-xs font-bold text-gray-500 uppercase"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <!-- Estado: Loading -->
            <tr v-if="isLoading">
              <td colspan="4" class="py-10 text-center">
                <Loader2 class="animate-spin mx-auto text-[#177DA6]" />
              </td>
            </tr>

            <!-- Estado: Empty -->
            <tr v-else-if="users.length === 0 && !hasError">
              <td colspan="4" class="py-12 text-center text-gray-500">
                <Users class="mx-auto text-gray-300 mb-3" :size="48" />
                No hay usuarios registrados en el sistema.
              </td>
            </tr>

            <!-- Estado: Success -->
            <UserTableRow
              v-else
              v-for="user in users"
              :key="user.id"
              :user="user"
              @edit="handleOpenModal"
              @delete="handleDelete"
            />
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de edición -->
    <UserEditModal
      v-if="isModalOpen"
      :user="selectedUser"
      :is-saving="isSaving"
      @close="handleCloseModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Users, Loader2, AlertCircle } from 'lucide-vue-next'

import { useUserStore } from '@/stores/userStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

import UserTableRow from './UserTableRow.vue'
import UserEditModal from './UserEditModal.vue'

// ─── STORE & COMPOSABLES ──────────────────────────────────────────────────────
const userStore = useUserStore()
const toast = useToast()
const { confirm } = useConfirm()

// ─── ESTADO DEL STORE (Pilar 2 — Single Source of Truth) ─────────────────────
const { users, isLoading, hasError, errorMessage, isSaving } = storeToRefs(userStore)

// ─── ESTADO LOCAL DEL MODAL (solo UI, no datos) ──────────────────────────────
const isModalOpen = ref(false)
const selectedUser = ref(null)

// ─── ACCIONES ─────────────────────────────────────────────────────────────────
const handleOpenModal = (user) => {
  selectedUser.value = { ...user }
  isModalOpen.value = true
}

const handleCloseModal = () => {
  isModalOpen.value = false
  selectedUser.value = null
  userStore.resetActionStatus()
}

const handleSave = async (formData) => {
  try {
    await userStore.updateUser(selectedUser.value.email, formData)
    toast.success('Usuario actualizado correctamente.')
    handleCloseModal()
  } catch {
    toast.error(userStore.actionError || 'Error al actualizar el usuario.')
  }
}

const handleDelete = async (email) => {
  const ok = await confirm({
    title: '¿Eliminar usuario?',
    message: `La cuenta ${email} será eliminada permanentemente del sistema.`,
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar',
    variant: 'danger',
  })
  if (!ok) return

  try {
    await userStore.deleteUser(email)
    toast.success(`Usuario ${email} eliminado correctamente.`)
  } catch {
    toast.error(userStore.actionError || 'Error al eliminar el usuario.')
  }
}

// ─── CICLO DE VIDA ────────────────────────────────────────────────────────────
onMounted(() => {
  // Solo fetcha si no hay datos previos — evita refetch innecesario al cambiar tabs
  if (userStore.status === 'idle') {
    userStore.fetchUsers()
  }
})
</script>
