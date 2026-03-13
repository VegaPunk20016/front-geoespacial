<template>
  <div class="h-screen bg-gray-50 flex flex-col overflow-hidden font-sans">
    <header
      class="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm"
    >
      <div class="flex items-center gap-4">
        <button
          @click="router.push('/dashboard')"
          class="p-2 text-gray-400 hover:text-[#177DA6] rounded-lg transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-[#012737]">Explorador de Datos</h1>
          <p class="text-[10px] text-[#177DA6] font-black tracking-widest uppercase">
            Padrón: {{ nombreDelPadronActual }}
          </p>
        </div>
      </div>

      <button
        @click="router.push(`/padrones/${route.params.id}/mapa`)"
        class="flex items-center gap-2 px-4 py-2 bg-[#177DA6] text-white rounded-lg text-xs font-bold shadow-md hover:bg-[#012737] transition-all"
      >
        <Map class="w-4 h-4" /> Ver en Mapa
      </button>
    </header>

    <main class="flex-1 overflow-y-auto bg-white">
      <div v-if="status === 'loading'" class="h-full flex flex-col items-center justify-center">
        <Loader2 class="w-10 h-10 text-[#177DA6] animate-spin mb-4" />
        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Sincronizando registros...
        </p>
      </div>

      <div v-else class="p-0">
        <table class="w-full text-left">
          <thead class="sticky top-0 bg-white z-20 shadow-sm border-b">
            <tr>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">
                Identificador
              </th>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">
                Información Principal
              </th>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Ubicación</th>
              <th class="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">
                Ficha
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="b in beneficiariosFiltrados"
              :key="b.id"
              class="hover:bg-gray-50 cursor-pointer group"
              @click="registroSeleccionado = b"
            >
              <!-- Identificador — solo si tiene clave -->
              <td class="px-6 py-4">
                <span
                  v-if="tieneValor(b.clave_unica)"
                  class="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100"
                >
                  {{ b.clave_unica }}
                </span>
                <span v-else class="text-[10px] text-gray-300 italic">—</span>
              </td>

              <!-- Nombre — fallback a municipio + sección si no hay nombre -->
              <td class="px-6 py-4 font-bold text-[#012737] text-sm">
                <span v-if="tieneValor(b.nombre_completo)">{{ b.nombre_completo }}</span>
                <span
                  v-else-if="tieneValor(b.municipio) || tieneValor(b.seccion)"
                  class="flex items-center gap-1.5"
                >
                  <span v-if="tieneValor(b.municipio)" class="text-[#012737]">{{
                    b.municipio
                  }}</span>
                  <span
                    v-if="tieneValor(b.seccion)"
                    class="text-[10px] font-bold px-2 py-0.5 rounded"
                    style="background: #e0f0f7; color: #177da6"
                    >Sec. {{ b.seccion }}</span
                  >
                </span>
                <span v-else class="text-gray-300 font-normal italic text-xs">—</span>
              </td>

              <!-- Municipio -->
              <td class="px-6 py-4 text-xs text-gray-500">
                {{ tieneValor(b.municipio) ? b.municipio : '—' }}
              </td>

              <td class="px-6 py-4 text-right">
                <ChevronRight class="w-4 h-4 ml-auto text-gray-300 group-hover:text-[#177DA6]" />
              </td>
            </tr>

            <!-- Estado vacío -->
            <tr v-if="beneficiariosFiltrados.length === 0">
              <td colspan="4" class="py-16 text-center">
                <Database class="w-8 h-8 mx-auto mb-3 text-gray-200" />
                <p class="text-xs text-gray-400">No hay registros con datos completos.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Panel lateral — Ficha Técnica -->
    <Transition name="slide">
      <div v-if="registroSeleccionado" class="fixed inset-0 z-[100] flex justify-end">
        <div
          class="absolute inset-0 bg-[#012737]/40 backdrop-blur-sm"
          @click="registroSeleccionado = null"
        ></div>

        <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
          <!-- Header -->
          <div class="bg-[#012737] p-6 text-white shrink-0">
            <div class="flex items-start justify-between mb-6">
              <h2 class="text-xl font-bold tracking-tight">Ficha Técnica</h2>
              <button
                @click="registroSeleccionado = null"
                class="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X class="w-6 h-6" />
              </button>
            </div>
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 bg-[#177DA6] rounded-xl flex items-center justify-center shadow-inner"
              >
                <Database class="w-6 h-6 text-white" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-black text-[#177DA6] uppercase tracking-widest mb-0.5">
                  Registro
                </p>
                <p class="text-sm font-bold truncate">
                  {{
                    tieneValor(registroSeleccionado.nombre_completo)
                      ? registroSeleccionado.nombre_completo
                      : registroSeleccionado.clave_unica || 'Sin identificador'
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Campos base con valor -->
          <div class="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            <div class="space-y-3">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                Atributos del Registro
              </p>

              <!-- Campos fijos solo si tienen valor -->
              <template v-for="attr in camposFijos" :key="attr.key">
                <div
                  class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-[#177DA6]/30 transition-all"
                >
                  <span
                    class="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-[#177DA6]"
                  >
                    {{ attr.label }}
                  </span>
                  <span class="text-sm font-black text-[#012737]">{{ attr.value }}</span>
                </div>
              </template>

              <!-- Separador si hay datos_generales -->
              <p
                v-if="atributosDinamicos.length > 0"
                class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pt-4 pb-2"
              >
                Datos Adicionales
              </p>

              <!-- datos_generales filtrados -->
              <div
                v-for="attr in atributosDinamicos"
                :key="attr.key"
                class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-[#177DA6]/30 transition-all"
              >
                <span
                  class="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-[#177DA6]"
                >
                  {{ attr.key }}
                </span>
                <span class="text-sm font-black text-[#012737]">{{ attr.value }}</span>
              </div>

              <!-- Sin datos -->
              <div
                v-if="camposFijos.length === 0 && atributosDinamicos.length === 0"
                class="py-8 text-center text-xs text-gray-400"
              >
                Este registro no tiene datos adicionales.
              </div>
            </div>
          </div>

          <!-- Footer municipio -->
          <div
            v-if="tieneValor(registroSeleccionado.municipio)"
            class="p-6 bg-white border-t border-gray-100"
          >
            <div class="flex items-center gap-3 text-gray-500">
              <MapPin class="w-4 h-4 text-[#177DA6]" />
              <span class="text-xs font-bold uppercase tracking-wide">
                {{ registroSeleccionado.municipio }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePadronStore } from '@/stores/padronStore'
import { ArrowLeft, Map, Loader2, ChevronRight, X, Database, MapPin } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const padronStore = usePadronStore()
const { beneficiarios, status } = storeToRefs(padronStore)

const registroSeleccionado = ref(null)

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Devuelve true si el valor tiene contenido real:
 * - No null / undefined
 * - No string vacío o solo espacios
 * - No "SIN NOMBRE", "N/A", "null", "undefined", "0" como texto, "-", "—"
 */
const VACIOS = new Set(['', 'sin nombre', 'n/a', 'null', 'undefined', '-', '—', 'none', 'na', '0'])

const tieneValor = (v) => {
  if (v === null || v === undefined) return false
  const s = String(v).trim().toLowerCase()
  return s.length > 0 && !VACIOS.has(s)
}

// ── Nombre del padrón ─────────────────────────────────────────────────────────
const nombreDelPadronActual = computed(() => {
  const padron = padronStore.padrones?.find((p) => p.id === route.params.id)
  return padron ? padron.nombre_padron : 'Cargando...'
})

// ── Tabla: solo filas con al menos municipio o clave ─────────────────────────
const beneficiariosFiltrados = computed(() =>
  beneficiarios.value.filter(
    (b) =>
      b.id !== null &&
      (tieneValor(b.clave_unica) || tieneValor(b.municipio) || tieneValor(b.seccion)),
  ),
)

// ── Ficha: campos fijos con valor ─────────────────────────────────────────────
const camposFijos = computed(() => {
  const r = registroSeleccionado.value
  if (!r) return []
  const candidatos = [
    { key: 'clave_unica', label: 'Clave Única' },
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'municipio', label: 'Municipio' },
    { key: 'seccion', label: 'Sección' },
    { key: 'latitud', label: 'Latitud' },
    { key: 'longitud', label: 'Longitud' },
  ]
  return candidatos
    .filter((c) => tieneValor(r[c.key]))
    .map((c) => ({ key: c.key, label: c.label, value: r[c.key] }))
})

// ── Ficha: datos_generales filtrados ─────────────────────────────────────────
const atributosDinamicos = computed(() => {
  if (!registroSeleccionado.value?.datos_generales) return []
  try {
    const raw = registroSeleccionado.value.datos_generales
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Object.entries(data)
      .filter(([, v]) => tieneValor(v))
      .map(([k, v]) => ({
        key: k.replace(/_/g, ' ').toUpperCase(),
        value: v,
      }))
  } catch {
    return []
  }
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  padronStore.fetchBeneficiarios(route.params.id)
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
