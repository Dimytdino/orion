// src/services/geonode.js
//
// Service d'accès à l'API GeoNode : liste des couches publiées.
//
// Ce service retourne des objets au format LayerConfig (défini dans
// shared/constants/layers.js) enrichis d'un champ `visible` pour l'état courant.
//
// Note FE-007 : ce fetch sera remplacé par un hook React Query `useLayersCatalog`
// qui gérera le cache, le rechargement et les états loading/error. En attendant,
// on appelle fetch() directement dans App.jsx via cet helper.

const GEONODE_API_URL = import.meta.env.VITE_GEONODE_API_URL ?? 'http://localhost/api/v2'

// L'URL OWS (et non WMS seul) permet de centraliser tous les protocoles OGC
// sur un seul endpoint GeoServer. Voir SPEC-2026-001 §11.2.
const GEOSERVER_OWS_URL =
  import.meta.env.VITE_GEOSERVER_OWS_URL ?? 'http://localhost/geoserver/ows'

/**
 * Récupère la liste des couches publiées dans GeoNode
 * et les transforme au format LayerConfig (SPEC-2026-001 §6.2).
 *
 * L'API GeoNode v2 expose /api/v2/datasets/ — chaque dataset a un champ
 * `alternate` qui contient le nom workspace:layer utilisé par GeoServer WMS.
 *
 * @returns {Promise<Array<import('./shared/constants/layers.js').LayerConfig & { visible: boolean }>>}
 */
export async function fetchLayers() {
  const response = await fetch(`${GEONODE_API_URL}/datasets/?format=json&page_size=100`)

  if (!response.ok) {
    throw new Error(`Erreur API GeoNode : ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const datasets = data.datasets ?? []

  return datasets.map((dataset) => ({
    // --- Champs LayerConfig ---
    id: dataset.pk,
    title: dataset.title || dataset.name,
    type: 'WMS',
    url: GEOSERVER_OWS_URL,
    layerName: dataset.alternate,
    projection: 'EPSG:2154', // GeoServer Orion publie en Lambert 93 par convention
    visibleByDefault: true,
    group: dataset.category?.identifier ?? 'Sans groupe',
    // --- État courant (géré dans le state React de App.jsx) ---
    visible: true,
  }))
}
