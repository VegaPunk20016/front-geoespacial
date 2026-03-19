<template>
  <section
    class="relative overflow-hidden rounded-3xl mx-4 md:mx-8 mb-8"
    style="background: linear-gradient(160deg, var(--color-primary) 0%, var(--color-dark) 100%)"
  >
    <!-- Glow de fondo decorativo -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[80%] rounded-full opacity-20"
        style="background: radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%)"
      ></div>
    </div>

    <!-- Contenido -->
    <div class="relative z-10 flex flex-col items-center text-center gap-5 py-20 px-6">
      <h2 class="text-2xl md:text-4xl font-bold text-white leading-tight max-w-xl">
        Comienza a Analizar Datos Territoriales
      </h2>
      <p class="text-sm md:text-base text-white/70 max-w-md">
        Accede a la plataforma más completa de análisis geoespacial del Estado de México
      </p>
      <button
        @click="$router.push('/login')"
        class="mt-2 flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all"
        style="
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
        "
        @mouseenter="(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')"
        @mouseleave="(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')"
      >
        <CircleArrowRight :size="18" />
        Comenzar Ahora
      </button>
    </div>
  </section>
</template>

<script setup>
import { CircleArrowRight } from 'lucide-vue-next'
</script>
