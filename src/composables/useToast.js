import { ref } from 'vue'

// Estado global del toast — un solo composable para toda la app
const toasts = ref([])

let nextId = 0

export function useToast() {
  const show = ({ message, type = 'info', duration = 4000 }) => {
    const id = nextId++
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      remove(id)
    }, duration)
  }

  const remove = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  // Atajos semánticos
  const success = (message, duration) => show({ message, type: 'success', duration })
  const error = (message, duration) => show({ message, type: 'error', duration })
  const warning = (message, duration) => show({ message, type: 'warning', duration })
  const info = (message, duration) => show({ message, type: 'info', duration })

  return { toasts, show, remove, success, error, warning, info }
}
