<template>
  <section class="px-4 md:px-8 max-w-[1100px] mx-auto w-full">
    <!-- Encabezado -->
    <div class="text-center mb-10">
      <h2 class="text-2xl md:text-4xl font-bold" style="color: var(--color-dark)">
        Funcionalidades del Sistema
      </h2>
      <p class="mt-2 text-sm md:text-base" style="color: var(--color-muted)">
        Herramientas profesionales para análisis territorial
      </p>
    </div>

    <!-- Grid de cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        v-for="(feature, i) in features"
        :key="feature.title"
        class="feature-card rounded-2xl p-6 flex flex-col gap-4 cursor-default"
        :style="{ animationDelay: `${i * 80}ms` }"
      >
        <!-- Ícono -->
        <div class="icon-wrap w-12 h-12 rounded-xl flex items-center justify-center">
          <component :is="feature.icon" :size="24" class="text-white" />
        </div>

        <!-- Texto -->
        <div class="flex flex-col gap-1.5">
          <h3 class="text-base font-bold text-white leading-snug">{{ feature.title }}</h3>
          <p class="text-sm text-white/70 leading-relaxed">{{ feature.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Database, Map, TrendingUp, ShieldCheck } from 'lucide-vue-next'

const features = [
  {
    icon: Database,
    title: 'Consulta de datos masivos',
    desc: 'Importación masiva de bases de datos geoespaciales.',
  },
  {
    icon: Map,
    title: 'Mapas Interactivos',
    desc: 'Visualización en OpenStreetMap con capas dinámicas.',
  },
  {
    icon: TrendingUp,
    title: 'Análisis Avanzado',
    desc: 'Filtrado y consulta de información territorial.',
  },
  {
    icon: ShieldCheck,
    title: 'Datos Verificados',
    desc: 'Información validada del INEGI y fuentes oficiales.',
  },
]
</script>

<style scoped>
.feature-card {
  background: linear-gradient(145deg, var(--color-primary) 0%, var(--color-dark) 100%);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  animation: fadeUp 0.5s ease both;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(1, 39, 55, 0.25);
}
.icon-wrap {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
