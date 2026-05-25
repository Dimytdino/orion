// src/App.jsx
//
// Composant racine de l'application Orion.
//
// Responsabilités :
//   - Maintenir l'état de visibilité des couches (state React).
//   - Synchroniser cet état avec l'instance OpenLayers (via mapRef).
//   - Charger la liste des couches depuis l'API GeoNode (fallback : LAYERS_CONFIG).
//   - Orchestrer les composants UI (LayerPanel, SearchBar).
//
// Ce composant NE manipule PAS directement l'API OpenLayers pour la création
// de carte ni la création de couches :
//   - La carte est créée par `useMapInstance` (FE-002).
//   - Les couches TileWMS sont créées par `createWmsLayer` (FE-004).

import { useState, useRef, useEffect } from 'react'
import 'ol/ol.css'

import { fetchLayers } from './services/geonode'
import { LAYERS_CONFIG, getValidLayers } from './shared/constants/layers'
import { createWmsLayer } from './services/geoserver/createWmsLayer'
import LayerPanel from './components/LayerPanel'
import SearchBar from './components/SearchBar'
import { useMapInstance } from './components/useMapInstance'

// État initial : config statique validée, avec `visible` calculé depuis `visibleByDefault`.
// Cet état est aussi le fallback si GeoNode est inaccessible.
const INITIAL_LAYERS = getValidLayers(LAYERS_CONFIG).map((cfg) => ({
  ...cfg,
  visible: cfg.visibleByDefault,
}))

function App() {
  const [layers, setLayers] = useState(INITIAL_LAYERS)
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
  const { mapRef } = useMapInstance(containerRef)

  // ---------------------------------------------------------------------------
  // Chargement des couches depuis l'API GeoNode
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchLayers()
      .then((serverLayers) => {
        // GeoNode accessible : on utilise les couches du serveur.
        // Les couches serveur incluent déjà le champ `visible` (true par défaut).
        setLayers(serverLayers)
      })
      .catch(() => {
        // GeoNode inaccessible (développement sans stack, réseau coupé…) :
        // on garde l'état initial (INITIAL_LAYERS), rien à faire ici.
        console.warn(
          'App: API GeoNode inaccessible — affichage des couches de la config statique.'
        )
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

    // Retire les anciens TileLayer WMS
    olLayersRef.current.forEach((l) => map.removeLayer(l))

    // createWmsLayer ne gère que le type WMS ; on filtre explicitement
    // pour préparer l'ajout futur de WMTS/WFS/MVT (FE-008 et suivants).
    const wmsLayers = layers
      .filter((cfg) => cfg.type === 'WMS')
      .map((cfg) =>
        createWmsLayer(cfg, {
          // `visible` surcharge visibleByDefault : on respecte l'état courant
          // (l'utilisateur peut avoir togglé la couche avant ce re-render)
          visible: cfg.visible,
        })
      )

    wmsLayers.forEach((l) => map.addLayer(l))
    olLayersRef.current = wmsLayers
  // mapRef est une ref stable (useRef) — intentionnellement absent des deps.
  // Le modifier déclencherait une boucle infinie (l'effet lui-même met à jour la carte).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers])

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

    // Mise à jour OL directe pour un retour visuel immédiat (sans attendre le re-render)
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
