<template>
  <component :is="currentDashboard" />
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard.vue'
import AdminDashboard from '@/components/dashboards/AdminDashboard.vue'
import UserDashboard from '@/components/dashboards/UserDashboard.vue'

const authStore = useAuthStore()

const dashboardRegistry = new Map([
  ['super_admin', SuperAdminDashboard],
  ['admin', AdminDashboard],
  ['user', UserDashboard],
])

const currentDashboard = computed(() => dashboardRegistry.get(authStore.userRole) ?? UserDashboard)
</script>
