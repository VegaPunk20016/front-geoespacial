<template>
  <div class="flex flex-col gap-12 md:gap-16">
    <HeroSection />
    <FeaturesSection />
    <CtaSection />
  </div>
</template>

<script setup>
import HeroSection from '../components/LandingPage/HeroSection.vue'
import FeaturesSection from '../components/LandingPage/FeaturesSection.vue'
import CtaSection from '../components/LandingPage/CtaSection.vue'
</script>
