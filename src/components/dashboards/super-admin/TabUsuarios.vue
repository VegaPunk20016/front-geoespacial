<template>
  <div class="p-6 font-sans min-h-full" style="background-color: #f1f1eb">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#e5e5df]"
    >
      <div>
        <h1 class="text-2xl font-black text-[#012737] tracking-tight">Gestión de Usuarios</h1>
        <p class="text-sm text-[#6b7280]">Panel administrativo de accesos y roles del sistema.</p>
      </div>
      <button
        @click="userStore.fetchUsers()"
        class="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e5df] rounded-xl text-xs font-bold text-[#6b7280] hover:bg-gray-50 transition-all shadow-sm active:scale-95"
      >
        <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" /> Actualizar Lista
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="bg-white p-5 rounded-2xl border border-[#e5e5df] shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-widest text-[#6b7280] mb-1">
          Total Activos
        </p>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-[#012737]">{{ activeUsersCount }}</span>
          <span
            class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase"
            >Cuentas OK</span
          >
        </div>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-[#e5e5df] shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-widest text-[#6b7280] mb-1">
          Administradores
        </p>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-[#177DA6]">{{ adminCount }}</span>
          <span
            class="text-[10px] font-bold text-[#177DA6] bg-[#e0f0f7] px-2 py-0.5 rounded-full uppercase"
            >Staff</span
          >
        </div>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-[#e5e5df] shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-widest text-[#6b7280] mb-1">
          Desactivados
        </p>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-black text-gray-400">{{ inactiveUsersCount }}</span>
          <span
            class="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase"
            >Bajas</span
          >
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-3xl border border-[#e5e5df] shadow-sm overflow-hidden">
      <div class="px-6 py-4 bg-[#fdfcfa] border-b border-[#e5e5df]">
        <h3 class="text-sm font-bold text-[#012737]">Directorio de Usuarios</h3>
        <p class="text-[11px] text-[#6b7280]">
          Visualizando {{ users.length }} registros en total.
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left min-w-[600px]">
          <thead>
            <tr class="bg-[#fdfcfa] border-b border-[#e5e5df]">
              <th
                v-for="h in ['Usuario', 'Correo', 'Rol', 'Estado', 'Acciones']"
                :key="h"
                class="px-6 py-4 text-[10px] font-black text-[#6b7280] uppercase tracking-widest"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#f0ede7]">
            <!-- Skeleton -->
            <tr v-if="isLoading" v-for="i in 3" :key="i">
              <td colspan="5" class="px-6 py-8">
                <div class="h-4 bg-gray-50 rounded animate-pulse w-full"></div>
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="users.length === 0">
              <td colspan="5" class="px-6 py-14 text-center text-sm text-[#6b7280]">
                Sin usuarios registrados.
              </td>
            </tr>

            <!-- Rows -->
            <UserTableRow
              v-else
              v-for="user in users"
              :key="user.id"
              :user="user"
              @edit="handleEdit"
              @delete="handleDelete"
              @restore="handleRestore"
            />
          </tbody>
        </table>
      </div>
    </div>

    <UserEditModal
      v-if="isModalOpen"
      :user="selectedUser"
      @close="isModalOpen = false"
      @save="onSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw } from 'lucide-vue-next'
import { useUserStore } from '@/stores/userStore'
import { userService } from '@/services/userService'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import UserTableRow from './UserTableRow.vue'
import UserEditModal from './UserEditModal.vue'

const userStore = useUserStore()
const toast = useToast()
const { confirm } = useConfirm()
const { users, isLoading } = storeToRefs(userStore)

// deleted_at puede ser null o un objeto CI4 { date, timezone_type, timezone }
const isInactive = (u) => u.deleted_at !== null && u.deleted_at !== undefined

const activeUsersCount = computed(() => users.value.filter((u) => !isInactive(u)).length)
const inactiveUsersCount = computed(() => users.value.filter((u) => isInactive(u)).length)
// El campo es "role" (no "role_name")
const adminCount = computed(
  () =>
    users.value.filter((u) => !isInactive(u) && ['admin', 'super_admin'].includes(u.role)).length,
)

const isModalOpen = ref(false)
const selectedUser = ref(null)

const handleEdit = (user) => {
  selectedUser.value = { ...user }
  isModalOpen.value = true
}

const onSave = async ({ username, password, role_id, roleChanged }) => {
  try {
    // 1. Actualiza username y/o password si cambiaron
    const basicPayload = {}
    if (username) basicPayload.username = username
    if (password) basicPayload.password = password

    if (Object.keys(basicPayload).length) {
      await userStore.updateUser(selectedUser.value.email, basicPayload)
    }

    // 2. Actualiza el rol solo si cambió — el backend usa un endpoint separado
    //    que espera role_id (int): PATCH /users/set-role/:email { role_id }
    if (roleChanged) {
      await userService.setRole(selectedUser.value.email, role_id)
    }

    toast.success('Usuario actualizado correctamente.')
    isModalOpen.value = false
    await userStore.fetchUsers() // refresca para que el rol se refleje en la tabla
  } catch (err) {
    toast.error(err?.response?.data?.messages?.error || 'Error al actualizar el usuario.')
  }
}

const handleDelete = async (email) => {
  const ok = await confirm({
    title: '¿Desactivar usuario?',
    message: 'El usuario ya no podrá entrar al sistema, pero sus datos se conservarán.',
    confirmText: 'Sí, desactivar',
    cancelText: 'Cancelar',
    variant: 'danger',
  })
  if (ok) {
    await userStore.deleteUser(email)
    toast.success('Usuario desactivado.')
  }
}

const handleRestore = async (user) => {
  const ok = await confirm({
    title: '¿Reactivar acceso?',
    message: `Se restaurarán todos los permisos para ${user.username}.`,
    confirmText: 'Sí, reactivar',
    cancelText: 'Cancelar',
    variant: 'info',
  })
  if (ok) {
    try {
      // Llamamos directamente al servicio para no tocar el array local.
      // El backend usa withDeleted() para encontrar al usuario y limpia deleted_at.
      await userService.updateUser(user.email, { username: user.username })
      toast.success('Cuenta reactivada con éxito.')
      // Refrescamos la lista completa desde el servidor
      await userStore.fetchUsers()
    } catch (err) {
      toast.error('Error al reactivar el usuario.')
    }
  }
}

onMounted(() => userStore.fetchUsers())
</script>
