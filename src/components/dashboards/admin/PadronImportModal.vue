<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(1, 39, 55, 0.55); backdrop-filter: blur(4px)"
  >
    <div
      class="w-full rounded-xl border overflow-hidden shadow-2xl flex flex-col"
      :class="paso === 'mapeo' ? 'max-w-3xl' : 'max-w-lg'"
      style="background: white; border-color: var(--color-base-dark); max-height: 90vh"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <div class="flex items-center gap-3">
          <!-- Steps -->
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
        </div>
        <button
          @click="cerrar"
          :disabled="cargando"
          class="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-gray-100"
        >
          <X :size="17" style="color: var(--color-muted)" />
        </button>
      </div>

      <!-- Cuerpo -->
      <div class="flex-1 overflow-y-auto">
        <!-- PASO 1: Seleccionar archivo -->
        <div v-if="paso === 'archivo'" class="p-6">
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

        <!-- PASO 2: Analizar -->
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
          <div>
            <p class="text-sm font-bold" style="color: var(--color-dark)">
              Analizando estructura...
            </p>
            <p class="text-xs mt-1.5" style="color: var(--color-muted)">
              Detectando columnas y filas de datos
            </p>
          </div>
        </div>

        <!-- PASO 3: Mapeo de columnas -->
        <div v-else-if="paso === 'mapeo'" class="p-5">
          <!-- Info del archivo -->
          <div
            class="flex items-center justify-between mb-4 px-4 py-3 rounded-xl"
            style="background: var(--color-base); border: 1px solid var(--color-base-dark)"
          >
            <div class="flex items-center gap-2">
              <FileUp :size="14" style="color: var(--color-primary)" />
              <span class="text-xs font-semibold" style="color: var(--color-dark)">{{
                archivo?.name
              }}</span>
            </div>
            <span
              class="text-[10px] font-bold px-2 py-1 rounded-full"
              style="background: #e0f0f7; color: var(--color-primary)"
            >
              {{ preview.totalFilas.toLocaleString() }} filas ·
              {{ preview.headers.length }} columnas
            </span>
          </div>

          <!-- Instrucción -->
          <p class="text-xs mb-4" style="color: var(--color-muted)">
            Asigna cada columna del archivo a un campo del sistema. Las columnas sin asignar se
            guardarán como datos adicionales.
          </p>

          <!-- Grid de mapeo -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            <div
              v-for="col in preview.headers"
              :key="col"
              class="flex items-center gap-2 p-3 rounded-xl border"
              style="background: white; border-color: var(--color-base-dark)"
            >
              <!-- Columna original -->
              <div class="min-w-0 flex-1">
                <p
                  class="text-[10px] font-black uppercase tracking-wide truncate"
                  style="color: var(--color-muted)"
                >
                  Columna original
                </p>
                <p
                  class="text-xs font-semibold truncate"
                  style="color: var(--color-dark)"
                  :title="col"
                >
                  {{ col }}
                </p>
                <!-- Muestra de valor -->
                <p
                  v-if="muestraValor(col)"
                  class="text-[9px] mt-0.5 truncate"
                  style="color: var(--color-muted)"
                  :title="muestraValor(col)"
                >
                  Ej: {{ muestraValor(col) }}
                </p>
              </div>

              <!-- Flecha -->
              <ArrowRight :size="14" class="shrink-0" style="color: var(--color-base-dark)" />

              <!-- Campo destino -->
              <div class="w-40 shrink-0">
                <select
                  v-model="mapeo[col]"
                  class="w-full text-xs rounded-lg border px-2 py-1.5 outline-none transition-all"
                  :style="
                    mapeo[col] && mapeo[col] !== '__ignorar__' && mapeo[col] !== '__auto__'
                      ? 'border-color: var(--color-primary); background: #f0f9ff; color: var(--color-dark)'
                      : mapeo[col] === '__ignorar__'
                        ? 'border-color: #fecaca; background: #fff5f5; color: #991b1b'
                        : 'border-color: var(--color-base-dark); background: var(--color-base); color: var(--color-muted)'
                  "
                >
                  <option value="__auto__">→ Datos adicionales</option>
                  <option value="__ignorar__">✕ Ignorar columna</option>
                  <option disabled>── Campos fijos ──</option>
                  <option v-for="campo in camposDestino" :key="campo.value" :value="campo.value">
                    {{ campo.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Previsualización de datos -->
          <details>
            <summary
              class="text-xs font-bold cursor-pointer select-none mb-2"
              style="color: var(--color-muted)"
            >
              Vista previa de datos ({{ preview.muestra.length }} filas)
            </summary>
            <div
              class="overflow-x-auto rounded-xl border"
              style="border-color: var(--color-base-dark)"
            >
              <table class="w-full text-left">
                <thead style="background: #fdfcfa; border-bottom: 1px solid var(--color-base-dark)">
                  <tr>
                    <th
                      v-for="col in preview.headers.slice(0, 6)"
                      :key="col"
                      class="px-3 py-2 text-[9px] font-black uppercase tracking-wide whitespace-nowrap"
                      style="color: var(--color-muted)"
                    >
                      {{ col.length > 15 ? col.slice(0, 15) + '…' : col }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(fila, i) in preview.muestra"
                    :key="i"
                    class="border-b"
                    style="border-color: var(--color-base)"
                  >
                    <td
                      v-for="col in preview.headers.slice(0, 6)"
                      :key="col"
                      class="px-3 py-1.5 text-[10px] whitespace-nowrap"
                      style="color: var(--color-ink)"
                    >
                      {{ fila[col] ?? '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>

        <!-- PASO 4: Importando -->
        <div
          v-else-if="paso === 'importando'"
          class="p-12 flex flex-col items-center text-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center"
            style="background: var(--color-base); border: 1.5px solid var(--color-base-dark)"
          >
            <Loader2 :size="26" class="animate-spin" style="color: var(--color-primary)" />
          </div>
          <div>
            <p class="text-sm font-bold" style="color: var(--color-dark)">Importando datos...</p>
            <p class="text-xs mt-1.5 max-w-xs" style="color: var(--color-muted)">
              El sistema está inyectando la información. Por favor no cierres esta ventana.
            </p>
          </div>
        </div>

        <!-- PASO 5: Resultado -->
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
          <div>
            <p class="text-sm font-bold" style="color: var(--color-dark)">
              ¡Importación completada!
            </p>
            <p class="text-xs mt-1" style="color: var(--color-muted)">
              Se procesaron
              <b style="color: var(--color-dark)">{{ resultado.procesados?.toLocaleString() }}</b>
              registros
              <span v-if="resultado.omitidos">
                · <b>{{ resultado.omitidos }}</b> omitidos</span
              >
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex justify-between gap-2 px-6 py-4 border-t shrink-0"
        style="background: #fdfcfa; border-color: var(--color-base-dark)"
      >
        <!-- Botón atrás -->
        <button
          v-if="paso === 'mapeo'"
          @click="paso = 'archivo'"
          class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors hover:bg-gray-50"
          style="border-color: var(--color-base-dark); color: var(--color-muted); background: white"
        >
          <ChevronLeft :size="14" /> Cambiar archivo
        </button>
        <div v-else></div>

        <div class="flex gap-2">
          <button
            v-if="paso !== 'resultado' && paso !== 'importando' && paso !== 'analizando'"
            @click="cerrar"
            class="px-4 py-2 text-xs font-semibold rounded-lg border"
            style="
              border-color: var(--color-base-dark);
              color: var(--color-muted);
              background: white;
            "
          >
            Cancelar
          </button>

          <!-- Analizar -->
          <button
            v-if="paso === 'archivo'"
            @click="analizarArchivo"
            :disabled="!archivo"
            class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50"
            style="background: var(--color-primary)"
          >
            Analizar estructura <ArrowRight :size="14" />
          </button>

          <!-- Importar con mapeo -->
          <button
            v-if="paso === 'mapeo'"
            @click="importarConMapeo"
            class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white"
            style="background: var(--color-dark)"
          >
            <FileUp :size="14" /> Confirmar e importar
          </button>

          <!-- Cerrar resultado -->
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

<script setup>
import { ref, computed, reactive } from 'vue'
import { X, FileUp, Loader2, AlertCircle, Check, ArrowRight, ChevronLeft } from 'lucide-vue-next'
import api from '@/services/api'

const props = defineProps({ padron: { type: Object, required: true } })
const emit = defineEmits(['close', 'imported'])

// ── Estado ────────────────────────────────────────────────────────────────────
const paso = ref('archivo')
const pasos = ['archivo', 'mapeo', 'resultado']
const etiquetasPaso = {
  archivo: 'Archivo',
  analizando: 'Analizando',
  mapeo: 'Mapeo',
  importando: 'Importando',
  resultado: 'Resultado',
}
const pasoIdx = computed(() => ['archivo', 'mapeo', 'resultado'].indexOf(paso.value))

const archivo = ref(null)
const isDragging = ref(false)
const cargando = ref(false)
const errorMsg = ref('')
const preview = ref({ headers: [], muestra: [], totalFilas: 0 })
const mapeo = reactive({})
const resultado = ref({})

// ── Campos destino disponibles ────────────────────────────────────────────────
const camposDestino = [
  { value: 'clave_unica', label: '🔑 Clave única' },
  { value: 'nombre_completo', label: '👤 Nombre completo' },
  { value: 'municipio', label: '🏙 Municipio' },
  { value: 'codigo_postal', label: '📮 Código postal' },
  { value: 'seccion', label: '🗳 Sección' },
  { value: 'latitud', label: '📍 Latitud' },
  { value: 'longitud', label: '📍 Longitud' },
]

// ── Archivo ────────────────────────────────────────────────────────────────────
const handleFileSelect = (e) => seleccionarArchivo(e.target.files[0])
const handleDrop = (e) => {
  isDragging.value = false
  seleccionarArchivo(e.dataTransfer.files[0])
}

const seleccionarArchivo = (file) => {
  errorMsg.value = ''
  if (!file) return
  const ext = ['.csv', '.txt', '.xlsx', '.xls']
  if (!ext.some((e) => file.name.toLowerCase().endsWith(e))) {
    errorMsg.value = 'Formato no permitido. Usa CSV, TXT o Excel.'
    return
  }
  archivo.value = file
}

// ── Analizar estructura ────────────────────────────────────────────────────────
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

    // Inicializar mapeo con sugerencias automáticas
    initMapeoSugerido(preview.value.headers)

    paso.value = 'mapeo'
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Error al analizar el archivo.'
    paso.value = 'archivo'
  } finally {
    cargando.value = false
  }
}

// ── Sugerencia automática de mapeo ────────────────────────────────────────────
const initMapeoSugerido = (headers) => {
  const reglas = {
    clave_unica: /^(clee|curp|rfc|folio|clave|id|matricula|expediente|num_folio)/i,
    nombre_completo: /^(nombre|nom_estab|beneficiario|razon_social|titular)/i,
    municipio: /^(municipio|nom_mun|delegacion|alcaldia)/i,
    codigo_postal: /^(c\.?p\.?$|codigo_postal|cod_post|zip)/i,
    seccion: /^(seccion|seccion_electoral)/i,
    latitud: /^(lat$|latitud$)/i,
    longitud: /^(lon$|lng$|longitud$)/i,
  }

  const yaAsignados = new Set()

  headers.forEach((col) => {
    const colNorm = col.toLowerCase().trim().replace(/\s+/g, '_')
    let sugerido = '__auto__'

    for (const [campo, re] of Object.entries(reglas)) {
      if (!yaAsignados.has(campo) && re.test(colNorm)) {
        sugerido = campo
        yaAsignados.add(campo)
        break
      }
    }

    mapeo[col] = sugerido
  })
}

// ── Valor de muestra para una columna ─────────────────────────────────────────
const muestraValor = (col) => {
  for (const fila of preview.value.muestra) {
    const v = fila[col]
    if (v && String(v).trim() !== '') return String(v).slice(0, 40)
  }
  return ''
}

// ── Importar con mapeo ────────────────────────────────────────────────────────
const importarConMapeo = async () => {
  paso.value = 'importando'
  cargando.value = true

  try {
    const formData = new FormData()
    formData.append('archivo', archivo.value)
    formData.append('mapeo', JSON.stringify(mapeo))

    const res = await api.post(`/padrones/${props.padron.id}/importar-mapeado`, formData, {
      headers: { 'Content-Type': undefined },
    })

    resultado.value = res.data.data
    paso.value = 'resultado'
    emit('imported')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Error al importar.'
    paso.value = 'mapeo'
  } finally {
    cargando.value = false
  }
}

const cerrar = () => {
  if (!cargando.value) emit('close')
}
</script>
