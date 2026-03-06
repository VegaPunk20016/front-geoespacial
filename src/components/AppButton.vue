<template>
  <button
    :type="type"
    :disabled="disabled || isLoading"
    class="group inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-[10px] font-medium text-base transition-all duration-300 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
    :class="[
      variantClasses,
      disabled || isLoading
        ? 'opacity-60 cursor-not-allowed hover:-translate-y-0 active:translate-y-0 active:shadow-[0_4px_4px_rgba(0,0,0,0.25)]'
        : 'cursor-pointer hover:-translate-y-0.5 active:shadow-sm active:translate-y-0',
    ]"
  >
    <svg
      v-if="isLoading"
      class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>

    <slot name="left" v-if="!isLoading"></slot>

    <span class="leading-none">
      <slot>{{ label }}</slot>
    </span>

    <slot name="right"></slot>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'button', // Previene envíos accidentales en formularios
    validator: (value) => ['button', 'submit', 'reset'].includes(value),
  },
  variant: {
    type: String,
    default: 'dark',
    validator: (value) => ['dark', 'base', 'primary'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

// Mapeo de clases basado en tus variables (Se mantienen idénticas)
const variantClasses = computed(() => {
  return {
    'bg-dark text-content-white hover:bg-primary': props.variant === 'dark',
    'bg-base text-content-black hover:bg-primary-light hover:text-content-white':
      props.variant === 'base',
    'bg-primary text-content-white hover:bg-dark': props.variant === 'primary',
  }
})
</script>
