/**
 * map.worker.js
 * Colocar en: public/workers/map.worker.js
 *
 * Calcula el diff entre el set anterior y el nuevo de registros del mapa.
 * Transfiere el resultado via ArrayBuffer para evitar copiar datos entre hilos.
 */

self.onmessage = function (e) {
  const { nuevos, prevIds } = e.data

  const setPrev = new Set(prevIds)
  const nuevosIds = new Set()
  const aAgregar = []

  for (const r of nuevos) {
    nuevosIds.add(r.id)
    if (!setPrev.has(r.id)) {
      aAgregar.push(r)
    }
  }

  const idsAQuitar = prevIds.filter((id) => !nuevosIds.has(id))

  // Serializar aAgregar a ArrayBuffer y transferirlo sin copiar.
  // El hilo principal recibe el buffer instantáneamente; el worker
  // pierde acceso a él (zero-copy transfer).
  const encoded = new TextEncoder().encode(JSON.stringify(aAgregar))
  const buffer = encoded.buffer

  self.postMessage({ buffer, idsAQuitar }, [buffer])
}
