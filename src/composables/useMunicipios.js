/**
 * Composable — Catálogo de municipios del Estado de México
 * Fuente: INEGI Marco Geoestadístico 2020
 *
 * Uso:
 *   import { useMunicipios } from '@/composables/useMunicipios'
 *   const { municipios, busqueda, porCvegeo, porNombre, porNombreForzado, todos } = useMunicipios()
 *
 * Capacidades de resolución (porNombre / porNombreForzado):
 *   1. Limpieza de sufijos basura  → "NEXTLALPAN *"  → "Nextlalpan"
 *   2. Match exacto normalizado    → "NEZAHUALCOYOTL" → "Nezahualcóyotl"
 *   3. Alias conocidos             → "ECATEPEC"       → "Ecatepec de Morelos"
 *   4. Recorte de sufijo geográfico→ "TOLUCA DE LERDO"→ "Toluca"
 *      (solo si el resultado es único en el catálogo — evita Cuautitlán vs Cuautitlán Izcalli)
 *   5. Prefijo único               → último recurso, solo si hay 1 candidato
 */

import { ref, computed } from 'vue'
import catalogoRaw from '@/data/edomex_municipios_nombres.json'

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZACIÓN
// Minúsculas + sin acentos + sin caracteres especiales + espacios colapsados
// "ACAMBAY DE RUÍZ CASTAÑEDA *" → "acambay de ruiz castaneda"
// ─────────────────────────────────────────────────────────────────────────────
const normalizar = (str) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar diacríticos
    .replace(/[^a-z0-9\s]/g, ' ') // especiales → espacio (incluye * # + etc.)
    .replace(/\s+/g, ' ')
    .trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// ALIAS
// Nombres que los padrones usan pero que NO coinciden con el catálogo INEGI,
// ni siquiera quitando el sufijo geográfico.
//
// Clave   = nombre normalizado tal como llega del padrón
// Valor   = nombre normalizado del municipio real en el catálogo
// ─────────────────────────────────────────────────────────────────────────────
const ALIAS = {
  // Nombres cortos sin el calificador oficial
  ecatepec: 'ecatepec de morelos',
  naucalpan: 'naucalpan de juarez',

  // Sufijos históricos que el recorte automático no resuelve bien
  'ixtlahuaca de rayon': 'ixtlahuaca',
  'ixtlahuaca de rayón': 'ixtlahuaca',

  // Nombres con prefijo incorrecto
  'villa nicolas romero': 'nicolas romero',
  'villa nicolás romero': 'nicolas romero',

  // Variantes con sufijo de nombre de persona que el recorte no quita
  // (el recorte elimina "de X" pero aquí "X" tiene más de una palabra)
  'jilotepec de molina enriquez': 'jilotepec',
  'jilotepec de andres molina enriquez': 'jilotepec',
  'otumba de gomez farias': 'otumba',
  'chalco de diaz covarrubias': 'chalco',
  'soyaniquilpan de juarez': 'soyaniquilpan de juarez', // ya está en catálogo
}

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO PRECOMPUTADO
// _norm = nombre normalizado para comparaciones rápidas
// ─────────────────────────────────────────────────────────────────────────────
const MUNICIPIOS = [...catalogoRaw]
  .map((m) => ({ ...m, _norm: normalizar(m.nombre) }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

// Índice rápido: norm → objeto municipio
const POR_NORM = Object.fromEntries(MUNICIPIOS.map((m) => [m._norm, m]))

// ─────────────────────────────────────────────────────────────────────────────
// SCORE DE COINCIDENCIA  0–4  (para el buscador interactivo)
//   4 — exacto normalizado
//   3 — query contenido en municipio o viceversa
//   2 — municipio empieza con query (≥ 4 chars)
//   1 — todas las palabras del query (> 2 chars) aparecen en el municipio
//   0 — sin coincidencia
// ─────────────────────────────────────────────────────────────────────────────
const score = (munNorm, q) => {
  if (!q) return 0
  if (munNorm === q) return 4
  if (munNorm.includes(q)) return 3
  if (q.includes(munNorm)) return 3
  if (q.length >= 4 && munNorm.startsWith(q)) return 2
  const palabras = q.split(' ').filter((p) => p.length > 2)
  if (palabras.length && palabras.every((p) => munNorm.includes(p))) return 1
  return 0
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVER — núcleo de la lógica de normalización
//
// Pasos (en orden, se detiene en el primero que resuelve):
//   1. Limpiar sufijos basura (* ** # números al final)
//   2. Match exacto en el catálogo
//   3. Alias conocido → match exacto con el alias
//   4. Recorte de sufijo geográfico "de X" / "del X"
//      SOLO si el resultado recortado es único en el catálogo.
//      Esto evita que "CUAUTITLAN DE X" resuelva a "Cuautitlán" cuando
//      también existe "Cuautitlán Izcalli" (ambos empezarían con "cuautitlan").
//   5. Prefijo único: si exactamente 1 municipio empieza con el norm → ese es
//
// Devuelve { municipio, esExacto } | null
// ─────────────────────────────────────────────────────────────────────────────
const resolver = (nombreSucio) => {
  if (!nombreSucio) return null

  // ── Paso 1: limpiar basura ────────────────────────────────────────────────
  let limpio = nombreSucio
    .replace(/[*#+]+\s*$/, '') // sufijos * ** # al final
    .replace(/\s+\d+$/, '') // números sueltos al final ("TOLUCA 1")
    .trim()

  const norm = normalizar(limpio)
  if (!norm) return null

  // ── Paso 2: match exacto ──────────────────────────────────────────────────
  if (POR_NORM[norm]) {
    return { municipio: POR_NORM[norm], esExacto: true }
  }

  // ── Paso 3: alias conocido ────────────────────────────────────────────────
  if (ALIAS[norm]) {
    const munAlias = POR_NORM[ALIAS[norm]]
    if (munAlias) return { municipio: munAlias, esExacto: true }
  }

  // ── Paso 4: recorte de sufijo geográfico ──────────────────────────────────
  // Quita el último bloque "de|del PALABRA+" y reintenta el match exacto.
  // El recorte es seguro SOLO si el nombre recortado no es prefijo de otro
  // municipio distinto (evitar Cuautitlán vs Cuautitlán Izcalli).
  const recortado = norm.replace(/\s+(de|del)\s+\S+(\s+\S+)*$/, '').trim()

  if (recortado && recortado !== norm && POR_NORM[recortado]) {
    // Verificar que no haya otro municipio que empiece con el mismo recortado
    const conflictos = MUNICIPIOS.filter(
      (m) => m._norm !== recortado && m._norm.startsWith(recortado + ' '),
    )
    if (conflictos.length === 0) {
      return { municipio: POR_NORM[recortado], esExacto: true }
    }
    // Hay conflicto (ej: "cuautitlan" vs "cuautitlan izcalli") → no resolver
    // para no devolver el municipio incorrecto silenciosamente.
  }

  // ── Paso 5: prefijo único ─────────────────────────────────────────────────
  const candidatos = MUNICIPIOS.filter((m) => m._norm.startsWith(norm + ' ') || m._norm === norm)
  if (candidatos.length === 1) {
    return { municipio: candidatos[0], esExacto: false }
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSABLE
// ─────────────────────────────────────────────────────────────────────────────
export function useMunicipios() {
  const busqueda = ref('')

  // Lista filtrada y ordenada por score — para el buscador interactivo
  const municipios = computed(() => {
    const q = normalizar(busqueda.value)
    if (!q) return MUNICIPIOS

    return MUNICIPIOS.map((m) => ({ m, s: score(m._norm, q) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .map(({ m }) => m)
  })

  // Buscar por cvegeo exacto
  const porCvegeo = (cvegeo) => MUNICIPIOS.find((m) => m.cvegeo === cvegeo) ?? null

  /**
   * porNombre — tolera variantes, sufijos basura y nombres históricos.
   *
   * Devuelve el objeto { cvegeo, nombre } si el match es confiable (esExacto).
   * Devuelve null si el nombre no reconocible o el match es dudoso.
   *
   * Usar cuando el match dudoso sería peor que no marcar nada
   * (ej: resaltar polígono en el mapa — un falso positivo sería confuso).
   */
  const porNombre = (nombre) => {
    const resultado = resolver(nombre)
    return resultado?.esExacto ? resultado.municipio : null
  }

  /**
   * porNombreForzado — igual pero devuelve el mejor match aunque no sea exacto.
   *
   * Usar cuando el usuario ya eligió explícitamente (buscador interactivo),
   * donde un match aproximado es preferible a no mostrar nada.
   */
  const porNombreForzado = (nombre) => {
    const resultado = resolver(nombre)
    return resultado?.municipio ?? null
  }

  const todos = MUNICIPIOS

  return { municipios, busqueda, porCvegeo, porNombre, porNombreForzado, todos, normalizar }
}
