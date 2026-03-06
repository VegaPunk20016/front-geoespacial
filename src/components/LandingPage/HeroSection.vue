<template>
  <section
    class="relative overflow-hidden rounded-4xl bg-gradient-to-br from-dark to-primary p-8 pt-16 md:p-16 md:pt-24 text-content-white shadow-2xl"
  >
    <div
      class="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-[1100px] mx-auto"
    >
      <div class="flex-1 space-y-6 z-10 text-center lg:text-left">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light/20 border border-primary-light/30"
        >
          <span
            class="text-[10px] md:text-xs uppercase tracking-widest font-semibold text-primary-light"
          >
            | Sistema de Análisis Territorial |
          </span>
        </div>

        <h1 class="text-4xl md:text-6xl font-bold leading-tight">
          Transforma datos oficiales en <br class="hidden md:block" />
          <span class="text-primary-light">decisiones geoespaciales</span>
        </h1>

        <p
          class="text-sm md:text-lg opacity-80 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed"
        >
          Sistema integrado de bases de datos georreferenciadas (DENUE-INEGI, población y resultados
          electorales) con visualización y análisis mediante mapas interactivos.
        </p>

        <div class="pt-4 flex justify-center lg:justify-start">
          <AppButton
            @click="goToLogin"
            label="Entrar"
            variant="dark"
            class="!px-10 !py-4 group shadow-lg"
          >
            <template #right>
              <ArrowRight :size="20" class="group-hover:translate-x-1 transition-transform" />
            </template>
          </AppButton>
        </div>
      </div>

      <div class="flex-1 relative flex justify-center items-center">
        <div class="absolute w-[80%] h-[80%] bg-primary-light/20 blur-[80px] rounded-full"></div>
        <img
          src="../../assets/mundo.png"
          alt="Globo terráqueo interactivo"
          class="relative w-full max-w-[450px] drop-shadow-2xl animate-float"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import AppButton from '../AppButton.vue'

// Inicializamos el router
const router = useRouter()

// Función para navegar al login
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* Si configuras esto en tailwind.config.js, puedes borrar todo este bloque <style> */
.animate-float {
  animation: float 6s ease-in-out infinite;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>
