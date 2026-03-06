<template>
  <div class="h-[calc(100vh-80px)] bg-gray-50 flex flex-col md:flex-row overflow-hidden relative">
    <aside
      class="w-full md:w-64 bg-[#012737] text-white flex flex-col shrink-0 overflow-y-auto z-10"
    >
      <div class="p-6 border-b border-white/10">
        <h2 class="text-xl font-bold text-white">IIDESOFT Core</h2>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <button
          @click="activeTab = 'usuarios'"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
          :class="
            activeTab === 'usuarios'
              ? 'bg-[#177DA6] text-white shadow-sm'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          "
        >
          <Users :size="18" /> Usuarios
        </button>

        <button
          @click="activeTab = 'padrones'"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
          :class="
            activeTab === 'padrones'
              ? 'bg-[#177DA6] text-white shadow-sm'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          "
        >
          <Database :size="18" /> Padrones
        </button>
      </nav>
    </aside>

    <main class="flex-1 p-6 md:p-8 overflow-y-auto relative">
      <div v-if="activeTab === 'usuarios'">
        <header class="mb-8">
          <h1 class="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p class="text-sm text-gray-500 mt-1">Administra cuentas y accesos del sistema.</p>
        </header>

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
                <tr v-if="isLoadingUsers">
                  <td colspan="4" class="py-10 text-center">
                    <Loader2 class="animate-spin mx-auto text-[#177DA6]" />
                  </td>
                </tr>
                <UserTableRow
                  v-for="user in users"
                  :key="user.id"
                  :user="user"
                  @edit="handleOpenUserModal"
                  @delete="handleDeleteUser"
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'padrones'">
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
          <div v-if="status === 'error'" class="p-6 text-center text-red-600 bg-red-50">
            <AlertCircle class="mx-auto mb-2" :size="32" />
            <p class="font-bold">Error al cargar la información</p>
            <p class="text-sm mt-1">{{ errorMessage }}</p>
            <button @click="cargarPadrones" class="mt-4 underline text-sm hover:text-red-800">
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
                <tr v-if="status === 'loading'">
                  <td colspan="5" class="py-12 text-center">
                    <Loader2 class="animate-spin mx-auto text-[#177DA6] mb-2" :size="32" />
                    <span class="text-sm text-gray-500">Cargando catálogos...</span>
                  </td>
                </tr>
                <tr v-else-if="padrones.length === 0">
                  <td colspan="5" class="py-12 text-center text-gray-500">
                    <Database class="mx-auto text-gray-300 mb-3" :size="48" />
                    No hay padrones registrados en el sistema.
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
      </div>
    </main>

    <UserEditModal
      v-if="isUserModalOpen"
      :user="selectedUser"
      :is-saving="isSavingUser"
      @close="isUserModalOpen = false"
      @save="handleSaveUserUpdate"
    />

    <PadronCreateModal
      v-if="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @created="cargarPadrones"
    />
    <PadronImportModal
      v-if="isImportModalOpen"
      :padron="selectedPadron"
      @close="isImportModalOpen = false"
      @imported="cargarPadrones"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Users, Database, Loader2, Plus, AlertCircle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

// --- IMPORTS DE USUARIOS ---
import { userService } from '@/services/userService'
import UserTableRow from './super-admin/UserTableRow.vue'
import UserEditModal from './super-admin/UserEditModal.vue'

// --- IMPORTS DE PADRONES ---
import { usePadronStore } from '@/stores/padronStore'
import PadronTableRow from './admin/PadronTableRow.vue'
import PadronCreateModal from './admin/PadronCreateModal.vue'
import PadronImportModal from './admin/PadronImportModal.vue'

// ================= ESTADO GLOBAL (TABS) =================
const activeTab = ref('usuarios') // Inicia mostrando usuarios por defecto

// ================= LÓGICA DE USUARIOS =================
const users = ref([])
const isLoadingUsers = ref(true)
const isUserModalOpen = ref(false)
const isSavingUser = ref(false)
const selectedUser = ref(null)

const fetchUsers = async () => {
  isLoadingUsers.value = true
  try {
    const data = await userService.getUsers()
    users.value = data.data || data.users || data
  } finally {
    isLoadingUsers.value = false
  }
}

const handleOpenUserModal = (user) => {
  selectedUser.value = { ...user }
  isUserModalOpen.value = true
}

const handleSaveUserUpdate = async (formData) => {
  isSavingUser.value = true
  try {
    await userService.updateUser(selectedUser.value.email, formData)
    await fetchUsers()
    isUserModalOpen.value = false
  } catch (e) {
    alert('Error al actualizar usuario')
  } finally {
    isSavingUser.value = false
  }
}

const handleDeleteUser = async (email) => {
  if (!confirm(`¿Eliminar a ${email}?`)) return
  try {
    await userService.deleteUser(email)
    users.value = users.value.filter((u) => u.email !== email)
  } catch (e) {
    alert('Error al eliminar usuario')
  }
}

// ================= LÓGICA DE PADRONES =================
const padronStore = usePadronStore()
const { padrones, status, errorMessage } = storeToRefs(padronStore)

const isCreateModalOpen = ref(false)
const isImportModalOpen = ref(false)
const selectedPadron = ref(null)

const cargarPadrones = () => {
  if (status.value === 'idle' || status.value === 'error') {
    padronStore.fetchPadrones()
  }
}

const handleOpenImportModal = (padron) => {
  selectedPadron.value = { ...padron }
  isImportModalOpen.value = true
}

const handleDeletePadron = async (padron) => {
  if (
    !confirm(
      `¿Eliminar definitivamente el padrón "${padron.nombre_padron}" y todos sus datos geográficos? Esta acción destruirá la tabla en la base de datos.`,
    )
  )
    return
  try {
    // Aquí iría tu llamada al delete endpoint: await padronStore.eliminarPadron(padron.id, true)
  } catch (e) {
    alert('Error al eliminar el padrón')
  }
}

// ================= CICLO DE VIDA =================
onMounted(() => {
  // Al montar, cargamos ambos recursos para que la transición entre pestañas sea instantánea
  fetchUsers()
  cargarPadrones()
})

const router = useRouter()

const handleVerDatos = (padron) => {
  router.push({
    name: 'PadronDataView',
    params: { id: padron.id },
  })
}
</script>
