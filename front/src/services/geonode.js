const GEONODE_API_URL = import.meta.env.VITE_GEONODE_API_URL ?? 'http://localhost/api/v2'
const GEOSERVER_WMS_URL = import.meta.env.VITE_GEOSERVER_WMS_URL ?? 'http://localhost/geoserver/wms'

/**
 * Récupère la liste des couches publiées dans GeoNode
 * et les transforme au format attendu par LayerPanel + Map.
 *
 * L'API GeoNode v2 expose /api/v2/datasets/ — chaque dataset a un champ
 * `alternate` qui contient le nom workspace:layer utilisé par GeoServer WMS.
 */
export async function fetchLayers() {
  const response = await fetch(`${GEONODE_API_URL}/datasets/?format=json&page_size=100`)

  if (!response.ok) {
    throw new Error(`Erreur API GeoNode : ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const datasets = data.datasets ?? []

  return datasets.map((dataset) => ({
    id: dataset.pk,
    label: dataset.title || dataset.name,
    group: dataset.category?.identifier ?? 'Sans groupe',
    url: GEOSERVER_WMS_URL,
    layer: dataset.alternate,
    visible: true,
  }))
}
