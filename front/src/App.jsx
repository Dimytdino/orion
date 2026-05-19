import { useState, useRef, useEffect } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS'
import { fromLonLat } from 'ol/proj'
import 'ol/ol.css'
import { fetchLayers } from './services/geonode'
import layersFallback from './config/layers'
import LayerPanel from './components/LayerPanel'
import SearchBar from './components/SearchBar'

function App() {
  const [layers, setLayers] = useState([])
  const [loading, setLoading] = useState(true)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const olLayersRef = useRef([])

  // Chargement des couches depuis l'API GeoNode au démarrage
  useEffect(() => {
    fetchLayers()
      .then(setLayers)
      .catch(() => {
        // GeoNode inaccessible : on affiche les couches de secours
        setLayers(layersFallback)
      })
      .finally(() => setLoading(false))
  }, [])

  // Initialisation de la carte (une seule fois)
  useEffect(() => {
    const basemap = new TileLayer({ source: new OSM() })

    const map = new Map({
      target: mapRef.current,
      layers: [basemap],
      view: new View({
        center: fromLonLat([2.3522, 46.8566]),
        zoom: 6,
      }),
    })

    mapInstanceRef.current = map
    return () => map.setTarget(null)
  }, [])

  // Synchronisation des couches WMS quand la liste change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || layers.length === 0) return

    // Retire les anciennes couches WMS (on garde la couche de fond en index 0)
    olLayersRef.current.forEach((l) => map.removeLayer(l))

    const wmsLayers = layers.map(
      (cfg) =>
        new TileLayer({
          source: new TileWMS({
            url: cfg.url,
            params: { LAYERS: cfg.layer, TILED: true },
            serverType: 'geoserver',
          }),
          visible: cfg.visible,
          properties: { id: cfg.id },
        })
    )

    wmsLayers.forEach((l) => map.addLayer(l))
    olLayersRef.current = wmsLayers
  }, [layers])

  // Fonction appelée quand on coche/décoche une couche
  function handleToggle(id) {
    // 1. Mettre à jour l'état React (pour la case à cocher)
    setLayers((prev) =>
      prev.map((l) => l.id === id ? { ...l, visible: !l.visible } : l)
    )

    // 2. Mettre à jour la couche OpenLayers (pour la carte)
    const olLayer = olLayersRef.current.find(
      (l) => l.get('id') === id
    )
    if (olLayer) {
      olLayer.setVisible(!olLayer.getVisible())
    }
  }

  function handleToggleGroup(groupName) {
  // Récupère toutes les couches du groupe
  const groupLayers = layers.filter((l) => l.group === groupName)
  
  // Si toutes visibles → tout cacher, sinon → tout montrer
  const allVisible = groupLayers.every((l) => l.visible)
  const newVisible = !allVisible

  // Met à jour l'état React
  setLayers((prev) =>
    prev.map((l) =>
      l.group === groupName ? { ...l, visible: newVisible } : l
    )
  )

  // Met à jour les couches OpenLayers
  olLayersRef.current.forEach((olLayer) => {
    const id = olLayer.get('id')
    const belongsToGroup = groupLayers.some((l) => l.id === id)
    if (belongsToGroup) olLayer.setVisible(newVisible)
  })
}

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={mapRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      {loading && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(13,33,55,0.9)', color: '#8aafc8',
          padding: '8px 16px', borderRadius: '6px', fontSize: '13px', zIndex: 2000,
        }}>
          Chargement des couches…
        </div>
      )}

      <LayerPanel layers={layers} onToggle={handleToggle} onToggleGroup={handleToggleGroup} />
      <SearchBar />
    </div>
  )
}

export default App