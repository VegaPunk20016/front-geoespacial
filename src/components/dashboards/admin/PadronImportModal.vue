<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import {
  X,
  FileUp,
  Loader2,
  AlertCircle,
  Check,
  ArrowRight,
  ChevronLeft,
  Info,
  ChevronDown,
} from 'lucide-vue-next'
import api from '@/services/api'
import { usePadronStore } from '@/stores/padronStore'
const store = usePadronStore()

const props = defineProps({ padron: { type: Object, required: true } })
const emit = defineEmits(['close', 'imported'])

const paso = ref('archivo')
const pasos = ['archivo', 'editor', 'simulacion', 'resultado']
const etiquetasPaso = {
  archivo: 'Archivo',
  analizando: 'Analizando',
  editor: 'Columnas',
  simulacion: 'Simulación',
  importando: 'Importando',
  resultado: 'Listo',
}
const pasoIdx = computed(() => pasos.indexOf(paso.value))

const archivo = ref(null)
const isDragging = ref(false)
const cargando = ref(false)
const errorMsg = ref('')
const preview = ref({ headers: [], muestra: [], totalFilas: 0 })
const previewKey = ref(null)
const resultado = ref({})

const filasEliminadas = ref([])
const guardarPlantilla = ref(true)

const headersEditables = ref([])

const CAMPOS_FIJOS = new Set([
  'clave_unica',
  'nombre_completo',
  'municipio',
  'codigo_postal',
  'seccion',
  'latitud',
  'longitud',
])

const dropdownAbierto = ref(null)

const CAMPOS_FIJOS_OPCIONES = [
  { id: 'clave_unica', label: 'Clave única' },
  { id: 'nombre_completo', label: 'Nombre completo' },
  { id: 'municipio', label: 'Municipio' },
  { id: 'codigo_postal', label: 'Código Postal' },
  { id: 'seccion', label: 'Sección' },
  { id: 'latitud', label: 'Latitud' },
  { id: 'longitud', label: 'Longitud' },
]

const opcionesParaColumna = (indexActual) => {
  return CAMPOS_FIJOS_OPCIONES.filter((opcion) => {
    return !headersEditables.value.some((header, i) => i !== indexActual && header === opcion.id)
  })
}

onMounted(() => {
  document.addEventListener('click', () => {
    dropdownAbierto.value = null
  })
})

const REGLAS_MAPEO = {
  clave_unica: /^(clee|curp|rfc|folio|clave|id$|matricula|expediente)/i,
  nombre_completo: /^(nombre|nom_estab|beneficiario|razon_social|titular)/i,
  municipio: /^(municipio|nom_mun|delegacion|alcaldia)/i,
  codigo_postal: /^(c\.?p\.?$|codigo_postal|cod_post|zip)/i,
  seccion: /^(seccion|seccion_electoral)/i,
  latitud: /^(lat$|latitud$)/i,
  longitud: /^(lon$|lng$|longitud$)/i,
}

const erroresMapeo = computed(() => {
  const conteo = {}
  const duplicados = new Set()
  headersEditables.value.forEach((h) => {
    if (CAMPOS_FIJOS.has(h)) {
      conteo[h] = (conteo[h] || 0) + 1
      if (conteo[h] > 1) duplicados.add(h)
    }
  })
  return duplicados
})

const eliminarColumna = (index) => {
  preview.value.headers.splice(index, 1)
  headersEditables.value.splice(index, 1)
}

const eliminarFila = (index) => {
  filasEliminadas.value.push(index)
  preview.value.muestra.splice(index, 1)
  preview.value.totalFilas--
}

const handleFileSelect = (e) => seleccionarArchivo(e.target.files[0])
const handleDrop = (e) => {
  isDragging.value = false
  seleccionarArchivo(e.dataTransfer.files[0])
}

const seleccionarArchivo = (file) => {
  errorMsg.value = ''
  if (!file) return

  const extArchivo = file.name.split('.').pop().toLowerCase()
  const esperado = props.padron.formato_esperado

  if (esperado && extArchivo !== esperado) {
    errorMsg.value = `Este padrón está configurado para archivos .${esperado.toUpperCase()}. El archivo seleccionado es .${extArchivo.toUpperCase()}.`
    archivo.value = null
    return
  }

  const permitidos = ['csv', 'txt', 'xlsx', 'xls']
  if (!permitidos.includes(extArchivo)) {
    errorMsg.value = 'Formato no permitido. Usa CSV, TXT o Excel.'
    return
  }

  archivo.value = file
}

const analizarArchivo = async () => {
  if (!archivo.value) return
  paso.value = 'analizando'
  cargando.value = true
  errorMsg.value = ''

  try {
    const formData = new FormData()
    formData.append('archivo', archivo.value)

    const res = await api.post(`/padrones/${props.padron.id}/preview-csv`, formData, {
      headers: { 'Content-Type': undefined },
    })

    preview.value = res.data.data
    filasEliminadas.value = [] // Limpiamos el historial de filas borradas para el nuevo archivo

    if (preview.value.previewKey) {
      previewKey.value = preview.value.previewKey
    }

    const plantilla = props.padron.plantilla_mapeo || {}

    headersEditables.value = preview.value.headers.map((h) => {
      const hClean = h.trim()

      if (plantilla[hClean]) return plantilla[hClean]

      const hNorm = hClean.toLowerCase().replace(/[^a-z0-9]/g, '')

      const coincidenciaFlexible = Object.keys(plantilla).find((key) => {
        const keyNorm = key.toLowerCase().replace(/[^a-z0-9]/g, '')
        return keyNorm === hNorm
      })

      if (coincidenciaFlexible) {
        return plantilla[coincidenciaFlexible]
      }

      const hLower = hClean.toLowerCase()
      const coincidenciaRelajada = Object.keys(plantilla).find(
        (key) => key.toLowerCase() === hLower,
      )
      if (coincidenciaRelajada) return plantilla[coincidenciaRelajada]

      const hRegexNorm = hLower.replace(/\s+/g, '_')
      for (const [campo, re] of Object.entries(REGLAS_MAPEO)) {
        if (re.test(hRegexNorm)) return campo
      }

      return h
    })

    paso.value = 'editor'
  } catch (err) {
    console.error('Error en analizarArchivo:', err)
    errorMsg.value = err.response?.data?.message || 'Error al analizar el archivo.'
    paso.value = 'archivo'
  } finally {
    cargando.value = false
  }
}

const columnasSimulacion = computed(() => {
  const fijosPrimero = []
  const extrasLuego = []

  headersEditables.value.forEach((h) => {
    if (CAMPOS_FIJOS.has(h)) {
      const labels = {
        clave_unica: 'Clave única',
        nombre_completo: 'Nombre',
        municipio: 'Municipio',
        codigo_postal: 'C.P.',
        seccion: 'Sección',
        latitud: 'Latitud',
        longitud: 'Longitud',
      }
      if (!fijosPrimero.find((c) => c.key === h)) {
        fijosPrimero.push({ key: h, label: labels[h] ?? h, esFijo: true })
      }
    } else {
      extrasLuego.push({ key: h, label: h, esFijo: false })
    }
  })

  return [...fijosPrimero, ...extrasLuego]
})

const registrosSimulados = computed(() => {
  return preview.value.muestra.map((fila) => {
    const reg = {}
    preview.value.headers.forEach((originalHeader, i) => {
      const nuevoNombre = headersEditables.value[i]
      reg[nuevoNombre] = fila[originalHeader] ?? ''
    })
    return reg
  })
})

const simular = () => {
  if (erroresMapeo.value.size > 0) {
    errorMsg.value = 'Corrige los campos duplicados antes de continuar.'
    return
  }
  errorMsg.value = ''
  paso.value = 'simulacion'
}

const importar = async () => {
  paso.value = 'importando'
  cargando.value = true
  const extension = archivo.value.name.split('.').pop().toLowerCase()

  const mapeo = {}
  preview.value.headers.forEach((original, i) => {
    mapeo[original] = headersEditables.value[i]
  })

  if (previewKey.value) mapeo.__previewKey__ = previewKey.value
  mapeo.__filasIgnoradas__ = filasEliminadas.value
  mapeo.__guardarPlantilla__ = guardarPlantilla.value
  mapeo.__extensionOriginal__ = extension

  try {
    const res = await api.post(`/padrones/${props.padron.id}/importar-mapeado`, { mapeo })
    await store.fetchPadronPorId(props.padron.id)
    resultado.value = res.data.data
    paso.value = 'resultado'
    emit('imported')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Error al importar los datos.'
    paso.value = 'simulacion'
  } finally {
    cargando.value = false
  }
}

const cerrar = () => {
  if (!cargando.value) emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(1, 39, 55, 0.55); backdrop-filter: blur(4px)"
  >
    <div
      class="w-full rounded-xl border overflow-hidden shadow-2xl flex flex-col"
      :class="
        ['editor', 'simulacion'].includes(paso)
          ? 'max-w-5xl'
          : paso === 'mapeo'
            ? 'max-w-3xl'
            : 'max-w-lg'
      "
      style="background: white; border-color: var(--color-base-dark); max-height: 92vh"
    >
      <div
        class="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <div class="flex items-center gap-1.5">
          <div v-for="(s, i) in pasos" :key="s" class="flex items-center gap-1.5">
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all"
              :style="
                paso === s
                  ? 'background: var(--color-dark); color: white'
                  : i < pasoIdx
                    ? 'background: #bbf7d0; color: #166534'
                    : 'background: var(--color-base-dark); color: var(--color-muted)'
              "
            >
              <Check v-if="i < pasoIdx" :size="10" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-[10px] font-semibold hidden sm:block"
              :style="paso === s ? 'color: var(--color-dark)' : 'color: var(--color-muted)'"
            >
              {{ etiquetasPaso[s] }}
            </span>
            <div
              v-if="i < pasos.length - 1"
              class="w-4 h-px"
              style="background: var(--color-base-dark)"
            ></div>
          </div>
        </div>
        <button
          @click="cerrar"
          :disabled="cargando"
          class="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-gray-100"
        >
          <X :size="17" style="color: var(--color-muted)" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0">
        <div v-if="paso === 'archivo'" class="p-6">
          <div
            v-if="props.padron.formato_esperado"
            class="mb-4 p-3 rounded-lg border flex items-start gap-3"
            style="background: #fff7ed; border-color: #ffedd5; color: #9a3412"
          >
            <Info :size="16" class="shrink-0 mt-0.5" />
            <div class="text-[11px]">
              <p class="font-bold uppercase">
                Formato requerido: .{{ props.padron.formato_esperado }}
              </p>
              <p class="opacity-80">
                Para asegurar el mapeo automático, utiliza el mismo formato de la importación
                anterior.
              </p>
            </div>
          </div>
          <div
            v-if="errorMsg"
            class="flex items-start gap-2 text-xs px-4 py-3 rounded-lg border mb-4"
            style="background: #fee2e2; border-color: #fecaca; color: #991b1b"
          >
            <AlertCircle :size="13" class="shrink-0 mt-0.5" /> {{ errorMsg }}
          </div>
          <div
            class="rounded-xl border-2 border-dashed transition-all px-6 py-12 text-center cursor-pointer"
            :style="
              isDragging
                ? 'border-color: var(--color-primary); background: #EEF7FA'
                : 'border-color: var(--color-base-dark); background: var(--color-base)'
            "
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="$refs.fileInput.click()"
          >
            <div class="flex flex-col items-center gap-3">
              <div
                class="w-14 h-14 rounded-xl flex items-center justify-center"
                style="background: white; border: 1.5px solid var(--color-base-dark)"
              >
                <FileUp :size="24" style="color: var(--color-primary-light)" />
              </div>
              <div>
                <p class="text-sm font-semibold" style="color: var(--color-dark)">
                  {{ archivo ? archivo.name : 'Arrastra tu archivo aquí' }}
                </p>
                <p class="text-xs mt-1" style="color: var(--color-muted)">
                  {{
                    archivo
                      ? `${(archivo.size / 1024 / 1024).toFixed(2)} MB`
                      : 'o haz clic para seleccionarlo'
                  }}
                </p>
              </div>
              <p
                v-if="!archivo"
                class="text-[10px] font-semibold uppercase tracking-widest"
                style="color: var(--color-muted)"
              >
                CSV · TXT · XLSX · XLS
              </p>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              class="sr-only"
              @change="handleFileSelect"
            />
          </div>
        </div>

        <!-- PASO: analizando -->
        <div
          v-else-if="paso === 'analizando'"
          class="p-12 flex flex-col items-center text-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center"
            style="background: var(--color-base); border: 1.5px solid var(--color-base-dark)"
          >
            <Loader2 :size="26" class="animate-spin" style="color: var(--color-primary)" />
          </div>
          <p class="text-sm font-bold" style="color: var(--color-dark)">Analizando estructura...</p>
        </div>

        <!-- PASO: editor -->
        <div v-else-if="paso === 'editor'" class="flex flex-col h-full">
          <div
            v-if="erroresMapeo.size > 0"
            class="px-5 py-2 bg-red-50 text-red-600 text-[10px] font-bold border-b border-red-100 flex items-center gap-2"
          >
            <AlertCircle :size="12" />
            Atención: No puedes asignar "{{ Array.from(erroresMapeo).join(', ') }}" a varias
            columnas.
          </div>

          <div
            class="flex items-center justify-between px-5 py-3 border-b shrink-0"
            style="background: #fdfcfa; border-color: var(--color-base-dark)"
          >
            <div>
              <p class="text-xs font-bold" style="color: var(--color-dark)">Editor de columnas</p>
              <p class="text-[10px]" style="color: var(--color-muted)">
                Renombra las columnas del archivo. Los cambios se aplican antes de importar.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="text-[10px] font-bold px-2 py-1 rounded-full"
                style="background: #e0f0f7; color: var(--color-primary)"
              >
                {{ preview.totalFilas.toLocaleString() }} filas ·
                {{ headersEditables.length }} columnas
              </span>
            </div>
          </div>

          <div class="flex-1 overflow-auto">
            <table class="w-full text-left" style="border-collapse: separate; border-spacing: 0">
              <thead class="sticky top-0 z-10" style="background: #fdfcfa">
                <tr>
                  <th
                    class="px-3 py-2 border-b border-r text-[9px] font-black uppercase w-8 text-center"
                    style="border-color: var(--color-base-dark); color: var(--color-muted)"
                  >
                    #
                  </th>
                  <th
                    v-for="(h, i) in headersEditables"
                    :key="i"
                    class="border-b border-r min-w-[140px] relative group"
                    style="border-color: var(--color-base-dark)"
                  >
                    <button
                      @click="eliminarColumna(i)"
                      class="absolute top-1 right-1 p-0.5 rounded opacity-50 hover:opacity-100 hover:bg-red-50 transition-all"
                      title="Eliminar columna"
                    >
                      <X :size="12" style="color: #ef4444" />
                    </button>
                    <div class="px-2 py-1.5 flex flex-col gap-1">
                      <p
                        class="text-[8px] font-bold uppercase truncate opacity-50 pr-4"
                        :title="preview.headers[i]"
                        style="color: var(--color-muted)"
                      >
                        {{ preview.headers[i] }}
                      </p>
                      <!-- Reemplaza tu input con esto -->
                      <div class="relative w-full" @click.stop>
                        <!-- Input donde el usuario puede escribir -->
                        <input
                          v-model="headersEditables[i]"
                          @focus="dropdownAbierto = i"
                          @click="dropdownAbierto = i"
                          class="w-full text-[11px] font-semibold px-2 py-1.5 rounded-md border outline-none transition-all pr-6"
                          :style="
                            erroresMapeo.has(headersEditables[i])
                              ? 'border-color: #ef4444; background: #fef2f2; color: #b91c1c'
                              : CAMPOS_FIJOS.has(headersEditables[i])
                                ? 'border-color: var(--color-primary); background: #f0f9ff; color: var(--color-dark)'
                                : 'border-color: var(--color-base-dark); background: var(--color-base); color: var(--color-ink)'
                          "
                          :placeholder="preview.headers[i]"
                        />

                        <!-- Icono de flecha para indicar que es un dropdown -->
                        <button
                          @click.prevent="dropdownAbierto = dropdownAbierto === i ? null : i"
                          class="absolute right-1 top-1/2 -translate-y-1/2 p-1 opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <ChevronDown :size="12" />
                        </button>

                        <!-- Menú flotante (Dropdown real) -->
                        <div
                          v-if="dropdownAbierto === i"
                          class="absolute z-50 top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden"
                        >
                          <div
                            class="px-2 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100"
                          >
                            Opciones disponibles
                          </div>

                          <div class="max-h-40 overflow-y-auto">
                            <!-- Opciones dinámicas (solo las que no se han usado) -->
                            <button
                              v-for="campo in opcionesParaColumna(i)"
                              :key="campo.id"
                              @click.prevent="
                                ((headersEditables[i] = campo.id), (dropdownAbierto = null))
                              "
                              class="w-full text-left px-3 py-2 text-[11px] font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              {{ campo.label }}
                            </button>

                            <div
                              v-if="opcionesParaColumna(i).length === 0"
                              class="px-3 py-2 text-[10px] text-gray-400 italic"
                            >
                              No hay más campos fijos libres
                            </div>
                          </div>

                          <!-- Opción para restaurar el nombre original -->
                          <div class="border-t border-gray-100">
                            <button
                              @click.prevent="
                                ((headersEditables[i] = preview.headers[i]),
                                (dropdownAbierto = null))
                              "
                              class="w-full text-left px-3 py-2 text-[10px] text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              Restaurar: <span class="font-bold">{{ preview.headers[i] }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(fila, ri) in preview.muestra"
                  :key="ri"
                  class="border-b transition-colors"
                  style="border-color: var(--color-base)"
                  @mouseenter="(e) => (e.currentTarget.style.background = 'var(--color-base)')"
                  @mouseleave="(e) => (e.currentTarget.style.background = 'white')"
                >
                  <td
                    class="px-3 py-2 text-[9px] border-r"
                    style="border-color: var(--color-base); color: var(--color-muted)"
                  >
                    <div class="flex items-center justify-between gap-1">
                      <span>{{ ri + 1 }}</span>
                      <button
                        @click="eliminarFila(ri)"
                        class="opacity-50 hover:opacity-100 hover:bg-red-50 rounded p-0.5 transition-all"
                        title="Eliminar fila"
                      >
                        <X :size="10" style="color: #ef4444" />
                      </button>
                    </div>
                  </td>
                  <td
                    v-for="(h, i) in preview.headers"
                    :key="i"
                    class="px-3 py-2 text-[11px] border-r"
                    style="
                      border-color: var(--color-base);
                      color: var(--color-ink);
                      max-width: 200px;
                    "
                  >
                    <span class="block truncate" :title="String(fila[h] ?? '')">
                      {{ fila[h] ?? '—' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            class="px-5 py-2.5 border-t shrink-0 flex items-center gap-2"
            style="background: var(--color-base); border-color: var(--color-base-dark)"
          >
            <Info :size="12" style="color: var(--color-muted)" />
            <p class="text-[10px]" style="color: var(--color-muted)">
              Mostrando las primeras {{ preview.muestra.length }} filas de
              {{ preview.totalFilas.toLocaleString() }} en total.
            </p>
          </div>
        </div>

        <!-- PASO: simulacion -->
        <div v-else-if="paso === 'simulacion'" class="flex flex-col h-full">
          <div
            class="flex items-center justify-between px-5 py-3 border-b shrink-0"
            style="background: #fdfcfa; border-color: var(--color-base-dark)"
          >
            <div>
              <p class="text-xs font-bold" style="color: var(--color-dark)">
                Simulación de importación
              </p>
              <p class="text-[10px]" style="color: var(--color-muted)">
                Columnas en <span style="color: #166534; font-weight: 700">verde</span> van a campos
                fijos, en <span style="color: var(--color-primary); font-weight: 700">azul</span> al
                JSON
              </p>
            </div>
          </div>

          <div class="flex-1 overflow-auto">
            <table class="w-full text-left">
              <thead
                class="sticky top-0 z-10"
                style="background: #fdfcfa; box-shadow: 0 1px 0 var(--color-base-dark)"
              >
                <tr>
                  <th
                    class="px-3 py-2.5 text-[9px] font-black w-8 text-center"
                    style="color: var(--color-muted)"
                  >
                    #
                  </th>
                  <th
                    v-for="col in columnasSimulacion"
                    :key="col.key"
                    class="px-3 py-2.5 text-[9px] font-black uppercase whitespace-nowrap"
                    :style="{ color: col.esFijo ? '#166534' : 'var(--color-primary)' }"
                  >
                    {{ col.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(registro, ri) in registrosSimulados"
                  :key="ri"
                  class="border-b"
                  style="border-color: var(--color-base)"
                >
                  <td class="px-3 py-2 text-center text-[9px]" style="color: var(--color-muted)">
                    {{ ri + 1 }}
                  </td>
                  <td
                    v-for="col in columnasSimulacion"
                    :key="col.key"
                    class="px-3 py-2 text-[11px] max-w-[180px]"
                    style="color: var(--color-ink)"
                  >
                    <span class="block truncate">{{ registro[col.key] || '—' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ✅ Checkbox: recordar configuración para futuros archivos del padrón -->
          <div
            class="px-5 py-3 border-t shrink-0 flex items-center gap-3"
            style="background: #f0f9ff; border-color: var(--color-base-dark)"
          >
            <input
              type="checkbox"
              id="checkPlantilla"
              v-model="guardarPlantilla"
              class="w-4 h-4 cursor-pointer"
            />
            <label
              for="checkPlantilla"
              class="text-[11px] font-medium cursor-pointer select-none"
              style="color: var(--color-primary)"
            >
              Recordar esta configuración de columnas para futuros archivos de este padrón.
            </label>
          </div>

          <!-- Error si falla el importar (se muestra al volver desde importando) -->
          <div
            v-if="errorMsg"
            class="px-5 py-2 bg-red-50 text-red-600 text-[10px] font-bold border-t border-red-100 flex items-center gap-2"
          >
            <AlertCircle :size="12" />
            {{ errorMsg }}
          </div>
        </div>

        <!-- PASO: importando -->
        <div
          v-else-if="paso === 'importando'"
          class="p-12 flex flex-col items-center text-center gap-4"
        >
          <Loader2 :size="26" class="animate-spin" style="color: var(--color-primary)" />
          <p class="text-sm font-bold">Importando datos...</p>
          <p>no cierres la ventana</p>
        </div>

        <!-- PASO: resultado -->
        <div
          v-else-if="paso === 'resultado'"
          class="p-8 flex flex-col items-center text-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center"
            style="background: #bbf7d0"
          >
            <Check :size="26" style="color: #166534" />
          </div>
          <p class="text-sm font-bold">¡Importación completada!</p>
          <p class="text-xs text-slate-500">
            Se procesaron {{ resultado.procesados?.toLocaleString() }} registros.
          </p>
        </div>
      </div>

      <!-- ── Footer con acciones ────────────────────────────────────────────── -->
      <div
        class="flex justify-between gap-2 px-6 py-4 border-t shrink-0"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <div>
          <button
            v-if="paso === 'editor'"
            @click="paso = 'archivo'"
            class="px-4 py-2 text-xs font-semibold rounded-lg border hover:bg-gray-50"
          >
            <ChevronLeft :size="14" class="inline" /> Cambiar archivo
          </button>
          <button
            v-if="paso === 'simulacion'"
            @click="paso = 'editor'"
            class="px-4 py-2 text-xs font-semibold rounded-lg border hover:bg-gray-50"
          >
            <ChevronLeft :size="14" class="inline" /> Editar columnas
          </button>
        </div>

        <div class="flex gap-2">
          <button
            v-if="!['resultado', 'importando', 'analizando'].includes(paso)"
            @click="cerrar"
            class="px-4 py-2 text-xs font-semibold border rounded-lg"
          >
            Cancelar
          </button>

          <button
            v-if="paso === 'archivo'"
            @click="analizarArchivo"
            :disabled="!archivo"
            class="px-4 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50"
            style="background: var(--color-primary)"
          >
            Analizar <ArrowRight :size="14" class="inline" />
          </button>

          <button
            v-if="paso === 'editor'"
            @click="simular"
            :disabled="erroresMapeo.size > 0"
            class="px-4 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50"
            style="background: var(--color-primary)"
          >
            Previsualizar <ArrowRight :size="14" class="inline" />
          </button>

          <button
            v-if="paso === 'simulacion'"
            @click="importar"
            class="px-4 py-2 text-xs font-semibold rounded-lg text-white"
            style="background: var(--color-dark)"
          >
            Confirmar e importar
          </button>

          <button
            v-if="paso === 'resultado'"
            @click="cerrar"
            class="px-4 py-2 text-xs font-semibold rounded-lg text-white"
            style="background: var(--color-dark)"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
