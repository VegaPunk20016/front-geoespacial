<script setup>
import Footer from './components/TheFooter.vue'
import NavBar from './components/NavBar.vue'
import AppToast from './components/AppToast.vue'
import AppConfirmModal from './components/AppConfirmModal.vue'
</script>

<template>
  <div class="h-screen flex flex-col bg-base overflow-x-hidden overflow-y-auto">
    <NavBar />
    <main class="grow w-full max-w-[1200px] mx-auto px-6 py-6 md:py-4">
      <router-view />
    </main>
    <Footer />

    <AppToast />
    <AppConfirmModal />
  </div>
</template>
