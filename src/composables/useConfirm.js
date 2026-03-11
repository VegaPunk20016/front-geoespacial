import { ref } from 'vue'

// Estado global del modal de confirmación
const isOpen = ref(false)
const options = ref({})
let resolveFn = null

export function useConfirm() {
  /**
   * Abre el modal de confirmación y devuelve una Promise<boolean>.
   * true  → el usuario confirmó
   * false → el usuario canceló
   *
   * @param {Object} opts
   * @param {string} opts.title        - Título del modal
   * @param {string} opts.message      - Mensaje descriptivo
   * @param {string} [opts.confirmText]  - Texto del botón de confirmar (default: "Confirmar")
   * @param {string} [opts.cancelText]   - Texto del botón de cancelar (default: "Cancelar")
   * @param {'danger'|'warning'|'info'} [opts.variant] - Estilo visual (default: "danger")
   */
  const confirm = (opts) => {
    options.value = opts
    isOpen.value = true

    return new Promise((resolve) => {
      resolveFn = resolve
    })
  }

  const accept = () => {
    isOpen.value = false
    resolveFn?.(true)
  }

  const cancel = () => {
    isOpen.value = false
    resolveFn?.(false)
  }

  return { isOpen, options, confirm, accept, cancel }
}
