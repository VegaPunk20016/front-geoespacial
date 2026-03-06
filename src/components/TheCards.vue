<script setup>
import PublicLayout from '../layouts/PublicLayout.vue'

// Importamos tus secciones
import TheHero from '../components/TheHero.vue'
import FeaturesSection from '../components/FeaturesSection.vue'
import CallToAction from '../components/CallToAction.vue'
</script>

<template>
  <PublicLayout>
    <div class="flex flex-col gap-16 md:gap-24">
      <TheHero />
      <FeaturesSection />
      <CallToAction />
    </div>
  </PublicLayout>
</template>
