<template>
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    style="background: rgba(1, 39, 55, 0.55); backdrop-filter: blur(4px)"
  >
    <div
      class="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border overflow-hidden shadow-2xl"
      style="background: white; border-color: var(--color-base-dark)"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-5 py-4 border-b"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <div>
          <h3 class="text-sm font-bold" style="color: var(--color-dark)">Editar Usuario</h3>
          <p class="text-[11px] mt-0.5" style="color: var(--color-muted)">{{ user?.email }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-1.5 rounded-lg"
          style="color: var(--color-muted); background: none; border: none; cursor: pointer"
        >
          <X :size="17" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4">
        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Nombre de usuario</label
          >
          <input
            v-model="form.username"
            type="text"
            class="g-input"
            placeholder="Nombre completo"
          />
        </div>

        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
            >Rol</label
          >
          <!-- El value es el role_id (int) que espera el backend -->
          <select v-model="form.role_id" class="g-input" style="cursor: pointer">
            <option :value="3">Usuario</option>
            <option :value="2">Admin</option>
            <option :value="1">Super Admin</option>
          </select>
        </div>

        <div>
          <label
            class="block text-[11px] font-bold uppercase tracking-widest mb-1.5"
            style="color: var(--color-muted)"
          >
            Nueva contraseña <span style="font-weight: 400">(opcional)</span>
          </label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPass ? 'text' : 'password'"
              class="g-input"
              placeholder="Dejar en blanco para no cambiar"
              style="padding-right: 2.75rem"
            />
            <button
              type="button"
              @click="showPass = !showPass"
              class="absolute right-3 top-1/2 -translate-y-1/2"
              style="
                color: var(--color-muted);
                background: none;
                border: none;
                cursor: pointer;
                display: flex;
              "
            >
              <EyeOff v-if="!showPass" :size="15" /><Eye v-else :size="15" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex gap-2 px-5 py-4 border-t"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <button
          @click="$emit('close')"
          class="flex-1 py-2.5 text-xs font-semibold rounded-lg border"
          style="border-color: var(--color-base-dark); color: var(--color-muted); background: white"
        >
          Cancelar
        </button>
        <button
          @click="handleSave"
          :disabled="isSaving"
          class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg text-white disabled:opacity-60"
          style="background: var(--color-primary)"
        >
          <Loader2 v-if="isSaving" :size="13" class="animate-spin" />
          {{ isSaving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watchEffect } from 'vue'
import { X, Eye, EyeOff, Loader2 } from 'lucide-vue-next'

// Mapa role string → role_id int (debe coincidir con tu tabla `roles` en BD)
const ROLE_ID_MAP = { super_admin: 1, admin: 2, user: 3 }

const props = defineProps({
  user: { type: Object, required: true },
  isSaving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'save'])

const showPass = ref(false)
const form = reactive({ username: '', role_id: 3, password: '' })

watchEffect(() => {
  if (props.user) {
    form.username = props.user.username || ''
    // Convierte el role string del backend al role_id int para el select
    form.role_id = ROLE_ID_MAP[props.user.role] ?? 3
    form.password = ''
  }
})

const handleSave = () => {
  // Payload separado: datos básicos + role_id para que el padre
  // pueda llamar updateUser y setRole por separado si el rol cambió
  const roleChanged = form.role_id !== (ROLE_ID_MAP[props.user.role] ?? 3)

  emit('save', {
    username: form.username,
    password: form.password || null,
    role_id: form.role_id,
    roleChanged, // flag para que TabUsuarios sepa si debe llamar setRole
  })
}
</script>
