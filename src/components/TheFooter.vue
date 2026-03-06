<script setup>
import { computed } from 'vue'
const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <div class="bg-base p-5 w-full">
    <footer
      class="mx-auto max-w-[1400px] w-full bg-dark text-content-white p-10 md:px-16 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-fade-in-up"
    >
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-10 lg:gap-5 w-full">
        <div class="flex justify-center order-1 lg:order-2">
          <img
            src="../assets/logo-iidesoft.png"
            alt="Iidesoft Logo"
            class="w-[180px] h-auto transition-transform duration-300 hover:scale-105 hover:-translate-y-1 drop-shadow-2xl"
          />
        </div>

        <div class="text-center lg:text-left order-2 lg:order-1">
          <h3 class="text-lg font-semibold mb-2">Contáctanos</h3>
          <p class="text-[12px] leading-relaxed opacity-90">
            Informática, Ingeniería y Desarrollo de Software<br />
            5558810619 | 5511130307<br />
            <a
              href="mailto:contacto@iidesoft.com.mx"
              class="hover:text-primary-light transition-colors"
              >contacto@iidesoft.com.mx</a
            ><br />
            <a
              href="mailto:ventas@iidesoft.com.mx"
              class="hover:text-primary-light transition-colors"
              >ventas@iidesoft.com.mx</a
            ><br />
            <a
              href="mailto:soporte@iidesoft.com.mx"
              class="hover:text-primary-light transition-colors"
              >soporte@iidesoft.com.mx</a
            >
          </p>
        </div>

        <div class="text-center lg:text-right order-3">
          <p class="text-[12px] leading-relaxed opacity-90">
            Copyright © 2021 - {{ currentYear }}<br />
            Conoce nuestro
            <a href="#" class="relative inline-block group">
              Aviso de Privacidad
              <span
                class="absolute left-0 bottom-[-2px] w-0 h-[1px] bg-content-white transition-all duration-300 group-hover:w-full"
              ></span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Si decides pasar esto a tailwind.config.js después, puedes borrar esta etiqueta <style> */
.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
