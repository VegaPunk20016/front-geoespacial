<template>
  <div class="h-screen flex flex-col overflow-hidden" style="background: var(--color-base)">
    <!-- HEADER -->
    <header
      class="shrink-0 z-10 px-6 py-4 flex items-center justify-between border-b"
      style="background: white; border-color: var(--color-base-dark)"
    >
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/dashboard')"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
          style="color: var(--color-muted)"
        >
          <ArrowLeft :size="18" />
        </button>
        <div>
          <h1
            class="text-base font-extrabold"
            style="color: var(--color-dark); letter-spacing: -0.03em"
          >
            Explorador de Datos
          </h1>
          <p
            class="text-[10px] font-black uppercase tracking-widest"
            style="color: var(--color-primary)"
          >
            {{ nombreDelPadronActual }}
          </p>
        </div>
      </div>

      <!-- Buscador desktop -->
      <div class="flex-1 max-w-md mx-8 hidden md:block">
        <div class="relative group">
          <Search
            :size="14"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            v-model="queryBusqueda"
            type="text"
            placeholder="Buscar por nombre, clave, CP o municipio..."
            class="w-full pl-9 pr-10 py-2 border rounded-xl text-xs font-medium outline-none transition-all"
            style="
              background: var(--color-base);
              border-color: var(--color-base-dark);
              color: var(--color-dark);
            "
          />
          <button
            v-if="queryBusqueda"
            @click="queryBusqueda = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X :size="12" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Contador -->
        <div
          class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border"
          style="border-color: var(--color-base-dark); background: var(--color-base)"
        >
          <div
            class="w-1.5 h-1.5 rounded-full"
            :style="{ background: queryBusqueda ? '#f59e0b' : 'var(--color-primary)' }"
          ></div>
          <span class="text-[11px] font-bold" style="color: var(--color-muted)">
            {{
              queryBusqueda
                ? `${beneficiariosFiltrados.length.toLocaleString()} encontrados`
                : paginacion
                  ? `${paginacion.total.toLocaleString()} registros`
                  : `${beneficiarios.length.toLocaleString()} registros`
            }}
          </span>
        </div>

        <button
          @click="exportarDatosCSV"
          :disabled="beneficiariosFiltrados.length === 0"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm hover:bg-gray-50 active:scale-95 disabled:opacity-50"
          style="border-color: var(--color-base-dark); color: var(--color-dark)"
        >
          <Download :size="14" /> Exportar
        </button>

        <button
          @click="showCreate = true"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm hover:bg-gray-50 active:scale-95"
          style="border-color: var(--color-base-dark); color: var(--color-dark)"
        >
          <Plus :size="14" /> Nuevo
        </button>

        <button
          @click="router.push(`/padrones/${route.params.id}/mapa`)"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:opacity-90 active:scale-95"
          style="background: var(--color-dark)"
        >
          <Map :size="14" /> Ver en Mapa
        </button>
      </div>
    </header>

    <!-- Buscador mobile -->
    <div
      class="md:hidden px-6 py-2 border-b"
      style="background: white; border-color: var(--color-base-dark)"
    >
      <div class="relative">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="queryBusqueda"
          type="text"
          placeholder="Buscar..."
          class="w-full pl-9 pr-4 py-2 rounded-lg text-xs outline-none"
          style="background: var(--color-base)"
        />
      </div>
    </div>

    <!-- Controles paginación (solo sin búsqueda activa) -->
    <div
      v-if="!queryBusqueda"
      class="shrink-0 flex items-center justify-between gap-3 px-5 py-2.5 border-b"
      style="background: #fdfcfa; border-color: var(--color-base-dark)"
    >
      <div class="flex items-center gap-2">
        <span class="text-[11px]" style="color: var(--color-muted)">Filas por página:</span>
        <select
          v-model="porPagina"
          @change="cargarPagina(1)"
          class="text-xs rounded-lg border px-2 py-1.5"
          style="border-color: var(--color-base-dark); background: white; color: var(--color-ink)"
        >
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
          <option :value="200">200</option>
        </select>
      </div>

      <!-- Navegación rápida -->
      <div v-if="paginacion && paginacion.paginas > 1" class="flex items-center gap-1">
        <button
          @click="cargarPagina(1)"
          :disabled="paginacion.pagina === 1"
          class="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors hover:bg-gray-100"
          style="color: var(--color-muted)"
        >
          <ChevronsLeft :size="13" />
        </button>
        <button
          @click="cargarPagina(paginacion.pagina - 1)"
          :disabled="paginacion.pagina === 1"
          class="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors hover:bg-gray-100"
          style="color: var(--color-muted)"
        >
          <ChevronLeft :size="13" />
        </button>

        <template v-for="p in paginasVisibles" :key="p">
          <span v-if="p === '...'" class="px-1 text-xs" style="color: var(--color-muted)">…</span>
          <button
            v-else
            @click="cargarPagina(p)"
            class="w-7 h-7 rounded-lg text-xs font-semibold transition-colors"
            :style="
              p === paginacion.pagina
                ? 'background: var(--color-dark); color: white'
                : 'color: var(--color-muted)'
            "
          >
            {{ p }}
          </button>
        </template>

        <button
          @click="cargarPagina(paginacion.pagina + 1)"
          :disabled="paginacion.pagina === paginacion.paginas"
          class="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors hover:bg-gray-100"
          style="color: var(--color-muted)"
        >
          <ChevronRight :size="13" />
        </button>
        <button
          @click="cargarPagina(paginacion.paginas)"
          :disabled="paginacion.pagina === paginacion.paginas"
          class="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30 transition-colors hover:bg-gray-100"
          style="color: var(--color-muted)"
        >
          <ChevronsRight :size="13" />
        </button>

        <span class="text-[11px] ml-2" style="color: var(--color-muted)">
          Pág. <b style="color: var(--color-ink)">{{ paginacion.pagina }}</b> de
          <b style="color: var(--color-ink)">{{ paginacion.paginas }}</b>
        </span>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="status === 'loading'" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div
        class="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style="border-color: var(--color-primary); border-top-color: transparent"
      ></div>
      <p class="text-xs font-bold uppercase tracking-widest" style="color: var(--color-muted)">
        Sincronizando registros...
      </p>
    </div>

    <!-- TABLA -->
    <main v-else class="flex-1 overflow-y-auto" style="background: white">
      <table class="w-full text-left">
        <thead
          class="sticky top-0 z-20"
          style="background: white; box-shadow: 0 1px 0 var(--color-base-dark)"
        >
          <tr>
            <th
              class="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest"
              style="color: var(--color-muted)"
            >
              Identificador
            </th>
            <th
              class="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest"
              style="color: var(--color-muted)"
            >
              Información Principal
            </th>
            <th
              class="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest hidden sm:table-cell"
              style="color: var(--color-muted)"
            >
              C.P.
            </th>
            <th
              class="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest hidden sm:table-cell"
              style="color: var(--color-muted)"
            >
              Municipio
            </th>
            <th
              class="px-5 py-3.5 text-right text-[10px] font-black uppercase tracking-widest"
              style="color: var(--color-muted)"
            >
              Detalles
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="b in beneficiariosFiltrados"
            :key="b.id"
            @click="registroSeleccionado = b"
            class="group cursor-pointer transition-colors border-b"
            style="border-color: var(--color-base)"
            @mouseenter="(e) => (e.currentTarget.style.background = 'var(--color-base)')"
            @mouseleave="(e) => (e.currentTarget.style.background = 'white')"
          >
            <td class="px-5 py-3.5 w-40">
              <span
                v-if="tieneValor(b.clave_unica)"
                class="text-[10px] font-mono px-2 py-1 rounded-md border"
                style="
                  color: var(--color-muted);
                  background: var(--color-base);
                  border-color: var(--color-base-dark);
                "
              >
                {{ b.clave_unica }}
              </span>
              <span v-else class="text-[10px]" style="color: var(--color-base-dark)">—</span>
            </td>

            <td class="px-5 py-3.5 max-w-xs">
              <div class="flex flex-col">
                <span
                  v-if="tieneValor(b.nombre_completo)"
                  class="text-sm font-semibold"
                  style="color: var(--color-ink)"
                >
                  {{ b.nombre_completo }}
                </span>
                <span
                  v-else-if="tieneValor(b.municipio)"
                  class="text-sm font-semibold"
                  style="color: var(--color-ink)"
                >
                  {{ b.municipio }}
                </span>
                <span v-else class="text-xs italic" style="color: var(--color-base-dark)">—</span>
                <span
                  v-if="tieneValor(b.seccion)"
                  class="text-[9px] font-black uppercase"
                  style="color: var(--color-primary)"
                >
                  Sección {{ b.seccion }}
                </span>
              </div>
            </td>

            <td class="px-5 py-3.5 hidden sm:table-cell">
              <span
                v-if="tieneValor(b.codigo_postal)"
                class="text-xs font-bold"
                style="color: var(--color-dark)"
              >
                {{ b.codigo_postal }}
              </span>
              <span v-else class="text-xs" style="color: var(--color-base-dark)">—</span>
            </td>

            <td class="px-5 py-3.5 hidden sm:table-cell">
              <span
                v-if="tieneValor(b.municipio)"
                class="text-xs"
                style="color: var(--color-muted)"
                >{{ b.municipio }}</span
              >
              <span v-else class="text-xs" style="color: var(--color-base-dark)">—</span>
            </td>

            <td class="px-5 py-3.5 text-right">
              <ChevronRight
                :size="16"
                class="ml-auto opacity-20 group-hover:opacity-100 transition-all"
              />
            </td>
          </tr>

          <tr v-if="beneficiariosFiltrados.length === 0">
            <td colspan="5" class="py-20 text-center">
              <div
                class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style="background: var(--color-base)"
              >
                <Search v-if="queryBusqueda" :size="20" class="text-slate-400" />
                <Database v-else :size="20" style="color: var(--color-muted)" />
              </div>
              <p class="text-sm font-semibold" style="color: var(--color-ink)">
                {{ queryBusqueda ? 'Sin coincidencias' : 'Sin registros' }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </main>

    <!-- DRAWER DE DETALLE -->
    <Transition name="slide">
      <div v-if="registroSeleccionado" class="fixed inset-0 z-[100] flex justify-end">
        <div
          class="absolute inset-0 backdrop-blur-sm"
          style="background: rgba(1, 39, 55, 0.35)"
          @click="registroSeleccionado = null"
        ></div>

        <div
          class="relative w-full max-w-md h-full flex flex-col shadow-2xl"
          style="background: white"
        >
          <!-- Header -->
          <div class="shrink-0 p-6 text-white" style="background: var(--color-dark)">
            <div class="flex items-center justify-between mb-5">
              <p class="text-[10px] font-black uppercase tracking-widest opacity-60">
                Ficha Técnica
              </p>
              <button
                @click="registroSeleccionado = null"
                class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/15"
              >
                <X :size="16" />
              </button>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style="background: var(--color-primary)"
              >
                <Database :size="20" />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-60">
                  Registro
                </p>
                <p class="text-sm font-bold truncate">
                  {{
                    tieneValor(registroSeleccionado.nombre_completo)
                      ? registroSeleccionado.nombre_completo
                      : 'Sin identificador'
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div
            class="shrink-0 px-5 py-3 border-b flex gap-2"
            style="background: var(--color-base); border-color: var(--color-base-dark)"
          >
            <button
              @click="abrirEdicion"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 hover:shadow-sm transition-all active:scale-95"
              style="color: var(--color-dark)"
            >
              <Edit2 :size="12" /> Editar
            </button>
            <button
              @click="abrirEliminacion"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-red-100 hover:bg-red-50 transition-all active:scale-95"
              style="color: #dc2626"
            >
              <Trash2 :size="12" /> Eliminar
            </button>
            <button
              @click="generarFichaPDF"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-blue-100 hover:bg-blue-50 transition-all active:scale-95 text-blue-600"
            >
              <FileText :size="12" /> PDF
            </button>
          </div>

          <!-- Campos -->
          <div class="flex-1 overflow-y-auto p-5 space-y-1.5" style="background: var(--color-base)">
            <p
              class="text-[9px] font-black uppercase tracking-[0.2em] px-1 pt-1 pb-2"
              style="color: var(--color-muted)"
            >
              Atributos Base
            </p>
            <div
              v-for="attr in camposFijos"
              :key="attr.key"
              class="flex items-center justify-between px-4 py-3 rounded-xl border bg-white"
              style="border-color: var(--color-base-dark)"
            >
              <span
                class="text-[10px] font-bold uppercase tracking-wide"
                style="color: var(--color-muted)"
                >{{ attr.label }}</span
              >
              <span
                class="text-sm font-bold text-right max-w-[55%] truncate"
                style="color: var(--color-dark)"
                >{{ attr.value }}</span
              >
            </div>

            <template v-if="atributosDinamicos.length">
              <p
                class="text-[9px] font-black uppercase tracking-[0.2em] px-1 pt-4 pb-2"
                style="color: var(--color-muted)"
              >
                Datos Adicionales (JSON)
              </p>
              <div
                v-for="attr in atributosDinamicos"
                :key="attr.key"
                class="flex items-center justify-between px-4 py-3 rounded-xl border bg-white"
                style="border-color: var(--color-base-dark)"
              >
                <span
                  class="text-[10px] font-bold uppercase tracking-wide shrink-0 mr-3"
                  style="color: var(--color-muted)"
                  >{{ attr.key }}</span
                >
                <span
                  class="text-sm font-bold text-right truncate"
                  style="color: var(--color-dark)"
                  >{{ attr.value }}</span
                >
              </div>
            </template>
          </div>

          <!-- Footer municipio -->
          <div
            v-if="tieneValor(registroSeleccionado.municipio)"
            class="shrink-0 px-5 py-4 border-t flex items-center gap-2 bg-white"
            style="border-color: var(--color-base-dark)"
          >
            <MapPin :size="14" style="color: var(--color-primary)" />
            <span
              class="text-xs font-bold uppercase tracking-wide"
              style="color: var(--color-muted)"
            >
              {{ registroSeleccionado.municipio }}
            </span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- MODALES -->
    <DatoCreateModal
      v-if="showCreate"
      :padron-id="route.params.id"
      @close="showCreate = false"
      @created="handleSuccess"
    />
    <DatoUpdateModal
      v-if="showUpdate"
      :padron-id="route.params.id"
      :dato="datoAEditar"
      @close="showUpdate = false"
      @updated="handleSuccess"
    />
    <DatoDeleteModal
      v-if="showDelete"
      :padron-id="route.params.id"
      :dato="datoAEliminar"
      @close="showDelete = false"
      @deleted="handleSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePadronStore } from '@/stores/padronStore'
import {
  ArrowLeft,
  Map,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  X,
  Database,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  FileText,
} from 'lucide-vue-next'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '@/assets/Logo-Vertical.png'

import DatoCreateModal from '@/components/dashboards/admin/DatoCreateModal.vue'
import DatoUpdateModal from '@/components/dashboards/admin/DatoUpdateModal.vue'
import DatoDeleteModal from '@/components/dashboards/admin/DatoDeleteModal.vue'

const route = useRoute()
const router = useRouter()
const padronStore = usePadronStore()
const { beneficiarios, status, paginacion } = storeToRefs(padronStore)

const registroSeleccionado = ref(null)
const queryBusqueda = ref('')
const porPagina = ref(50)
const showCreate = ref(false)
const showUpdate = ref(false)
const showDelete = ref(false)
const datoAEditar = ref(null)
const datoAEliminar = ref(null)
let _busquedaTimer = null

// ── Helpers ───────────────────────────────────────────────────────────────────
const VACIOS = new Set(['', 'sin nombre', 'n/a', 'null', 'undefined', '-', '—', 'none', 'na', '0'])
const tieneValor = (v) => {
  if (v === null || v === undefined) return false
  return !VACIOS.has(String(v).trim().toLowerCase())
}

const nombreDelPadronActual = computed(
  () => padronStore.padrones?.find((p) => p.id === route.params.id)?.nombre_padron ?? 'Cargando...',
)

// ── Buscador — filtro local en los datos ya cargados ─────────────────────────
// Cuando hay query activo filtramos localmente (sin ir al backend)
// Cuando no hay query usamos la paginación del backend
const beneficiariosFiltrados = computed(() => {
  const base = beneficiarios.value.filter(
    (b) =>
      b.id !== null &&
      (tieneValor(b.clave_unica) || tieneValor(b.municipio) || tieneValor(b.seccion)),
  )
  if (!queryBusqueda.value.trim()) return base

  const q = queryBusqueda.value.toLowerCase().trim()
  return base.filter(
    (b) =>
      String(b.nombre_completo || '')
        .toLowerCase()
        .includes(q) ||
      String(b.clave_unica || '')
        .toLowerCase()
        .includes(q) ||
      String(b.municipio || '')
        .toLowerCase()
        .includes(q) ||
      String(b.codigo_postal || '')
        .toLowerCase()
        .includes(q) ||
      String(b.seccion || '')
        .toLowerCase()
        .includes(q),
  )
})

// ── Paginación — botones visibles (máx 7 con elipsis) ────────────────────────
const paginasVisibles = computed(() => {
  if (!paginacion.value) return []
  const { pagina, paginas } = paginacion.value
  if (paginas <= 7) return Array.from({ length: paginas }, (_, i) => i + 1)

  const items = [1]
  if (pagina - 2 > 2) items.push('...')
  for (let i = Math.max(2, pagina - 2); i <= Math.min(paginas - 1, pagina + 2); i++) items.push(i)
  if (pagina + 2 < paginas - 1) items.push('...')
  items.push(paginas)
  return items
})

const cargarPagina = (pagina) => {
  padronStore.fetchBeneficiariosPaginados(route.params.id, {
    pagina,
    porPagina: porPagina.value,
  })
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Ficha técnica ─────────────────────────────────────────────────────────────
const camposFijos = computed(() => {
  const r = registroSeleccionado.value
  if (!r) return []
  return [
    { key: 'clave_unica', label: 'Clave Única' },
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'municipio', label: 'Municipio' },
    { key: 'codigo_postal', label: 'C.P.' },
    { key: 'seccion', label: 'Sección' },
    { key: 'latitud', label: 'Latitud' },
    { key: 'longitud', label: 'Longitud' },
  ]
    .filter((c) => tieneValor(r[c.key]))
    .map((c) => ({ ...c, value: r[c.key] }))
})

const atributosDinamicos = computed(() => {
  const r = registroSeleccionado.value
  if (!r?.datos_generales) return []
  try {
    const data =
      typeof r.datos_generales === 'string' ? JSON.parse(r.datos_generales) : r.datos_generales
    return Object.entries(data)
      .filter(([k, v]) => tieneValor(v) && k.toUpperCase() !== 'CP_DETECTADO')
      .map(([k, v]) => ({ key: k.replace(/_/g, ' ').toUpperCase(), value: v }))
  } catch {
    return []
  }
})

// ── Exportar CSV ──────────────────────────────────────────────────────────────
const exportarDatosCSV = () => {
  const data = beneficiariosFiltrados.value
  if (!data.length) return

  const colsFijas = ['CLAVE', 'NOMBRE', 'MUNICIPIO', 'CP', 'SECCION', 'LATITUD', 'LONGITUD']
  const llavesExtra = new Set()

  data.forEach((b) => {
    if (b.datos_generales) {
      try {
        const extra =
          typeof b.datos_generales === 'string' ? JSON.parse(b.datos_generales) : b.datos_generales
        Object.keys(extra).forEach((k) => {
          if (k.toUpperCase() !== 'CP_DETECTADO') llavesExtra.add(k.toUpperCase())
        })
      } catch {}
    }
  })

  const colsExtra = Array.from(llavesExtra)
  const headers = [...colsFijas, ...colsExtra]

  const filas = data.map((b) => {
    const fila = [
      b.clave_unica || '',
      b.nombre_completo || '',
      b.municipio || '',
      b.codigo_postal || '',
      b.seccion || '',
      b.latitud || '',
      b.longitud || '',
    ]
    const extra = b.datos_generales
      ? typeof b.datos_generales === 'string'
        ? JSON.parse(b.datos_generales)
        : b.datos_generales
      : {}
    colsExtra.forEach((h) => {
      const val = extra[h] ?? extra[h.toLowerCase()] ?? ''
      fila.push(String(val).replace(/,/g, '.').replace(/\n/g, ' '))
    })
    return fila.map((v) => `"${v}"`).join(',')
  })

  const csv = '\uFEFF' + [headers.join(','), ...filas].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Padron_${nombreDelPadronActual.value.replace(/\s+/g, '_')}.csv`
  link.click()
}

// ── PDF ficha individual ──────────────────────────────────────────────────────
const getBase64Image = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.setAttribute('crossOrigin', 'anonymous')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })

const generarFichaPDF = async () => {
  const r = registroSeleccionado.value
  if (!r) return

  const doc = new jsPDF('p', 'mm', 'a4')
  const azulOscuro = [1, 39, 55]
  const azulPrimario = [0, 123, 255]
  const grisTexto = [100, 116, 139]

  try {
    const base64Logo = await getBase64Image(logoUrl)
    doc.addImage(base64Logo, 'PNG', 15, 12, 35, 12)
  } catch {}

  doc.setFontSize(8)
  doc.setTextColor(...grisTexto)
  doc.text(`Generado: ${new Date().toLocaleString()}`, 195, 15, { align: 'right' })

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...azulOscuro)
  doc.text('EXPEDIENTE INDIVIDUAL', 195, 25, { align: 'right' })

  doc.setDrawColor(226, 232, 240)
  doc.line(15, 30, 195, 30)

  doc.setFontSize(14)
  doc.setTextColor(...azulOscuro)
  doc.text(r.nombre_completo || 'SIN NOMBRE REGISTRADO', 15, 42)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...azulPrimario)
  doc.text(`PADRÓN: ${nombreDelPadronActual.value.toUpperCase()}`, 15, 48)

  autoTable(doc, {
    startY: 55,
    head: [['ATRIBUTO BASE', 'VALOR']],
    body: [
      ['IDENTIFICADOR ÚNICO', r.clave_unica || 'N/A'],
      ['MUNICIPIO', r.municipio || 'N/A'],
      ['CÓDIGO POSTAL', r.codigo_postal || 'N/A'],
      ['SECCIÓN ELECTORAL', r.seccion || 'N/A'],
      ['LATITUD', r.latitud || '0.000000'],
      ['LONGITUD', r.longitud || '0.000000'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: azulOscuro, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 55 } },
  })

  if (r.datos_generales) {
    try {
      const extra =
        typeof r.datos_generales === 'string' ? JSON.parse(r.datos_generales) : r.datos_generales
      const bodyExt = Object.entries(extra)
        .filter(([k, v]) => tieneValor(v) && k.toUpperCase() !== 'CP_DETECTADO')
        .map(([k, v]) => [k.replace(/_/g, ' ').toUpperCase(), v || '—'])

      if (bodyExt.length) {
        const finalY = doc.lastAutoTable.finalY
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...azulOscuro)
        doc.text('INFORMACIÓN COMPLEMENTARIA', 15, finalY + 15)

        autoTable(doc, {
          startY: finalY + 20,
          head: [['CAMPO DINÁMICO', 'VALOR']],
          body: bodyExt,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
        })
      }
    } catch {}
  }

  const pageCount = doc.internal.getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(...grisTexto)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' })
  }

  const nombreLimpio = (r.nombre_completo || r.id).replace(/[^a-z0-9]/gi, '_').toLowerCase()
  doc.save(`Ficha_${nombreLimpio}.pdf`)
}

// ── Modales ───────────────────────────────────────────────────────────────────
const abrirEdicion = () => {
  datoAEditar.value = registroSeleccionado.value
  showUpdate.value = true
}
const abrirEliminacion = () => {
  datoAEliminar.value = registroSeleccionado.value
  showDelete.value = true
}

const handleSuccess = () => {
  cargarPagina(paginacion.value?.pagina ?? 1)
  registroSeleccionado.value = null
  showCreate.value = showUpdate.value = showDelete.value = false
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (padronStore.status === 'idle' || padronStore.status === 'error') {
    await padronStore.fetchPadrones()
  }
  cargarPagina(1)
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-thumb {
  background: var(--color-base-dark);
  border-radius: 99px;
}
</style>
