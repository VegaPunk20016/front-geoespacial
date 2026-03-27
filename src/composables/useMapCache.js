/**
 * useMapCache.js  ─  @/composables/useMapCache.js
 *
 * Caché reactivo de puntos y clusters por padrón + municipio.
 * Singleton a nivel de módulo: todos los componentes que lo importen
 * comparten exactamente el mismo Map interno.
 *
 * Clave interna: "padronId::MUNICIPIO_UPPERCASE"
 */

import { ref } from 'vue'

// ── Almacenes module-level (singleton) ─────────────────────────────────────
const _puntos = new Map() // clave → registro[]
const _clusters = new Map() // clave → cluster[]

// Contador reactivo: cualquier componente puede hacer watch(cache.version, ...)
const _version = ref(0)

// ── Helper interno ─────────────────────────────────────────────────────────
const buildKey = (padronId, municipio) =>
  `${padronId}::${String(municipio ?? '')
    .toUpperCase()
    .trim()}`

// ── Composable ─────────────────────────────────────────────────────────────
export function useMapCache() {
  // ── PUNTOS ────────────────────────────────────────────────────────────────

  const setPuntos = (padronId, municipio, registros) => {
    _puntos.set(buildKey(padronId, municipio), registros)
    _version.value++
  }

  const getPuntos = (padronId, municipio) => _puntos.get(buildKey(padronId, municipio)) ?? null

  const tienePuntos = (padronId, municipio) => _puntos.has(buildKey(padronId, municipio))

  // ── CLUSTERS ──────────────────────────────────────────────────────────────

  const setClusters = (padronId, municipio, clusters) => {
    _clusters.set(buildKey(padronId, municipio), clusters)
    _version.value++
  }

  const getClusters = (padronId, municipio) => _clusters.get(buildKey(padronId, municipio)) ?? null

  const tieneClusters = (padronId, municipio) => _clusters.has(buildKey(padronId, municipio))

  // ── INVALIDACIÓN ──────────────────────────────────────────────────────────

  /** Borra todo el caché de un padrón (p.ej. después de importar datos nuevos) */
  const invalidarPadron = (padronId) => {
    const prefix = `${padronId}::`
    for (const k of [..._puntos.keys()]) if (k.startsWith(prefix)) _puntos.delete(k)
    for (const k of [..._clusters.keys()]) if (k.startsWith(prefix)) _clusters.delete(k)
    _version.value++
  }

  /** Borra solo el municipio indicado dentro de un padrón */
  const invalidarMunicipio = (padronId, municipio) => {
    const k = buildKey(padronId, municipio)
    _puntos.delete(k)
    _clusters.delete(k)
    _version.value++
  }

  return {
    setPuntos,
    getPuntos,
    tienePuntos,
    setClusters,
    getClusters,
    tieneClusters,
    invalidarPadron,
    invalidarMunicipio,
    version: _version,
  }
}
