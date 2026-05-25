// src/services/geoserver/createWmsLayer.js
//
// Adaptateur WMS GeoServer : transforme un LayerConfig en couche OpenLayers.
//
// Pourquoi un adaptateur dédié (et pas directement dans App.jsx) :
//   SPEC-2026-001 §5.4 impose que "la création des couches est isolée dans des
//   hooks ou services dédiés". Bénéfices concrets :
//   1. Testable indépendamment de l'UI (pas besoin de monter App.jsx).
//   2. Remplaçable : passer de TileWMS à ImageWMS ne touche pas les composants.
//   3. Extensible : createWmtsLayer, createWfsLayer iront à côté, même interface.
//
// Relation avec FE-009 (gestion d'erreurs) :
//   Le paramètre `onError` prépare l'intégration FE-009 sans la bloquer.
//   En attendant, les consommateurs peuvent l'ignorer ou logger dans la console.

import TileLayer from 'ol/layer/Tile'
import TileWMS from 'ol/source/TileWMS'

/**
 * Crée une couche OpenLayers TileWMS à partir d'une LayerConfig de type 'WMS'.
 *
 * @param {import('../../shared/constants/layers.js').LayerConfig} config
 *   Configuration de la couche. `config.type` DOIT valoir 'WMS'.
 *
 * @param {object}   [options]
 * @param {function(Error): void} [options.onError]
 *   Callback appelé si une tuile échoue à charger (réseau coupé, GeoServer 5xx…).
 *   Reçoit une Error avec l'id de la couche et l'URL de la tuile concernée.
 *   Utilisé par FE-009 pour remonter un message générique vers l'UI.
 * @param {boolean} [options.visible]
 *   Surcharge la visibilité initiale définie dans `config.visibleByDefault`.
 *   Utile quand App.jsx synchronise l'état courant de la couche (toggle).
 *
 * @returns {import('ol/layer/Tile').default}
 *
 * @throws {Error} Si `config.type !== 'WMS'` — appelant doit filtrer en amont
 *   (via getValidLayers) ou vérifier le type avant d'appeler cet adaptateur.
 */
export function createWmsLayer(config, { onError, visible } = {}) {
  // Garde-fou explicite : cet adaptateur ne gère que WMS.
  // Les autres types (WMTS, WFS, MVT) auront leurs propres adaptateurs.
  if (config.type !== 'WMS') {
    throw new Error(
      `createWmsLayer : type attendu 'WMS', reçu '${config.type}' (id : ${config.id})`
    )
  }

  const source = new TileWMS({
    url: config.url,
    params: {
      // LAYERS : nom technique GeoServer (ex : "geonode:limites_communales").
      // TILED : active le mode tuilé (meilleures performances, cache navigateur).
      LAYERS: config.layerName,
      TILED: true,
    },
    // 'geoserver' active des optimisations spécifiques OL pour GeoServer :
    // gestion correcte des erreurs de rendu, format de coordonnées adapté.
    serverType: 'geoserver',
    // Attribution affichée sur la carte si définie dans la config.
    // Obligatoire pour certaines couches (Plan IGN, etc.) selon conditions d'usage.
    ...(config.attribution ? { attributions: config.attribution } : {}),
  })

  // Propagation des erreurs de chargement de tuiles vers le consommateur.
  // On utilise l'événement OL 'tileloaderror' : c'est l'API officielle pour
  // détecter qu'une requête WMS a échoué (réseau, 4xx, 5xx GeoServer).
  // FE-009 branchera ici un hook useLayerError pour afficher le message CA-04.
  if (onError) {
    source.on('tileloaderror', (event) => {
      const url = event.tile?.src ?? config.url
      onError(
        new Error(`Erreur de chargement de tuile WMS (${config.id}) — ${url}`)
      )
    })
  }

  // La visibilité effective : priorité à l'option `visible` (état courant
  // passé par App.jsx lors d'un toggle), puis à `visibleByDefault` (config).
  const effectiveVisible = visible !== undefined ? visible : (config.visibleByDefault ?? true)

  return new TileLayer({
    source,
    visible: effectiveVisible,
    opacity: config.opacity ?? 1,
    // On stocke l'id dans les propriétés OL pour retrouver rapidement
    // cette couche lors d'un toggle (App.jsx : olLayersRef.current.find).
    properties: { id: config.id },
  })
}
