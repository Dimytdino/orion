// src/App.jsx
//
// Composant racine de l'application Orion.
//
// Responsabilités :
//   - Charger la liste des couches depuis l'API GeoNode (avec fallback statique)
//   - Gérer la visibilité des couches (état React + instance OpenLayers synchronisés)
//   - Orchestrer les composants UI (LayerPanel, SearchBar)
//   - Déléguer la création et le cycle de vie de la carte à `useMapInstance`
//
// Ce composant NE manipule PAS directement l'API OpenLayers pour la création de carte.
// Toute la logique OL d'initialisation est dans `useMapInstance`.
// Les couches WMS métier sont gérées ici via `map.addLayer` / `map.removeLayer`.

import { useState, useRef, useEffect } from 'react'
import TileLayer from 'ol/layer/Tile'
import TileWMS from 'ol/source/TileWMS'
import 'ol/ol.css'

import { fetchLayers } from './services/geonode'
import layersFallback from './config/layers'
import LayerPanel from './components/LayerPanel'
import SearchBar from './components/SearchBar'
import { useMapInstance } from './components/useMapInstance'

function App() {
  const [layers, setLayers] = useState([])
  const [loading, setLoading] = useState(true)

  // containerRef pointe vers le div DOM qui accueille la carte.
  // useMapInstance s'en sert comme cible OL (map.setTarget).
  const containerRef = useRef(null)

  // olLayersRef conserve les objets TileLayer OL correspondant aux couches métier.
  // C'est une ref (pas un state) : ajouter/retirer des couches OL ne doit pas
  // déclencher un re-render de l'interface.
  const olLayersRef = useRef([])

  // Création de la carte OpenLayers en EPSG:2154, centrée sur la France métro.
  // Le fond de carte (Plan IGN WMTS) sera injecté via extraLayers en FE-011.
  // En attendant, le CSS background du containerRef affiche un fond gris neutre.
  const { mapRef } = useMapInstance(containerRef)

  // ---------------------------------------------------------------------------
  // Chargement des couches depuis l'API GeoNode
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchLayers()
      .then(setLayers)
      .catch(() => {
        // GeoNode inaccessible (développement sans stack, réseau coupé…) :
        // on affiche les couches de secours définies dans config/layers.js
        setLayers(layersFallback)
      })
      .finally(() => setLoading(false))
  }, [])

  // ---------------------------------------------------------------------------
  // Synchronisation des couches WMS dans la carte OL
  // ---------------------------------------------------------------------------
  // Quand la liste `layers` change (au chargement puis à chaque toggle),
  // on recalcule les TileLayer OL et on les synchronise avec la carte.
  // La carte elle-même n'est PAS recréée (cf. useMapInstance et CA-05).
  useEffect(() => {
    const map = mapRef.current
    if (!map || layers.length === 0) return

    // Retire les anciens TileLayer WMS (sans toucher à la couche de fond en index 0)
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
          // On stocke l'id dans les propriétés OL pour pouvoir retrouver la couche
          // lors d'un toggle sans parcourir tout le tableau `layers`
          properties: { id: cfg.id },
        })
    )

    wmsLayers.forEach((l) => map.addLayer(l))
    olLayersRef.current = wmsLayers
  }, [layers]) // mapRef est une ref stable — intentionnellement absente des deps

  // ---------------------------------------------------------------------------
  // Gestionnaires d'événements UI
  // ---------------------------------------------------------------------------

  /**
   * Active ou désactive une couche individuelle.
   * Met à jour l'état React (pour la case à cocher) ET l'instance OL (pour la carte).
   * @param {string|number} id
   */
  function handleToggle(id) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    )

    const olLayer = olLayersRef.current.find((l) => l.get('id') === id)
    if (olLayer) olLayer.setVisible(!olLayer.getVisible())
  }

  /**
   * Active ou désactive toutes les couches d'un groupe.
   * Si toutes visibles → tout masquer ; sinon → tout afficher.
   * @param {string} groupName
   */
  function handleToggleGroup(groupName) {
    const groupLayers = layers.filter((l) => l.group === groupName)
    const allVisible = groupLayers.every((l) => l.visible)
    const newVisible = !allVisible

    setLayers((prev) =>
      prev.map((l) => (l.group === groupName ? { ...l, visible: newVisible } : l))
    )

    olLayersRef.current.forEach((olLayer) => {
      const id = olLayer.get('id')
      const belongsToGroup = groupLayers.some((l) => l.id === id)
      if (belongsToGroup) olLayer.setVisible(newVisible)
    })
  }

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/*
        Fond gris neutre (#d4d4d4) : affiché si le Plan IGN est indisponible.
        OpenLayers rend ses tuiles par-dessus ce fond — si aucune tuile ne charge,
        le gris reste visible et l'application reste utilisable.
        FE-011 injectera le fond Plan IGN via `extraLayers` dans useMapInstance.
      */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#d4d4d4',
        }}
      />

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(13,33,55,0.9)',
            color: '#8aafc8',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            zIndex: 2000,
          }}
        >
          Chargement des couches…
        </div>
      )}

      <LayerPanel
        layers={layers}
        onToggle={handleToggle}
        onToggleGroup={handleToggleGroup}
      />
      <SearchBar />
    </div>
  )
}

export default App
