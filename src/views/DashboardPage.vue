<template>
  <component :is="currentDashboard" />
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'

import SuperAdminDashboard from '../components/dashboards/SuperAdminDashboard.vue'
import UserDashboard from '../components/dashboards/UserDashboard.vue'
import AdminDashboard from '../components/dashboards/AdminDashboard.vue'

const authStore = useAuthStore()

// Pilar: Clean Code & Seguridad - Inyección basada en rol
// 1. Definimos el Map
const dashboardRegistry = new Map([
  ['super_admin', SuperAdminDashboard],
  ['admin', AdminDashboard],
  ['user', UserDashboard],
])

const currentDashboard = computed(() => {
  const role = authStore.userRole
  return dashboardRegistry.get(role) || UserDashboard
})
</script>
