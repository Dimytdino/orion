import { useState, useRef, useEffect } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS'
import { fromLonLat } from 'ol/proj'
import 'ol/ol.css'
import layersConfig from './config/layers'
import LayerPanel from './components/LayerPanel'
import SearchBar from './components/SearchBar'

function App() {
  // État : liste des couches avec leur visibilité
  const [layers, setLayers] = useState(layersConfig)
  const mapRef = useRef(null)
  const olLayersRef = useRef([])  // référence aux couches OpenLayers

  // Initialisation de la carte
  useEffect(() => {
    const basemap = new TileLayer({ source: new OSM() })

    const wmsLayers = layersConfig.map(
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

    olLayersRef.current = wmsLayers  // on garde une référence aux couches OL

    const map = new Map({
      target: mapRef.current,
      layers: [basemap, ...wmsLayers],
      view: new View({
        center: fromLonLat([2.3522, 46.8566]),
        zoom: 6,
      }),
    })

    return () => map.setTarget(null)
  }, [])

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
    <div ref={mapRef} style={{ 
      position: 'absolute',   // ← ajout
      top: 0, left: 0,        // ← ajout
      width: '100%', 
      height: '100%' 
    }} />
    <LayerPanel layers={layers} onToggle={handleToggle} onToggleGroup={handleToggleGroup} />
    <SearchBar />
  </div>
  )
}

export default App