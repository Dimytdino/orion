// src/shared/constants/layers.js
//
// Configuration centralisée des couches cartographiques du POC Orion.
//
// Pourquoi ce fichier :
//   SPEC-2026-001 §6.2 impose que la configuration des couches soit centralisée.
//   Cela évite que les paramètres WMS (URL, nom technique, projection) soient
//   éparpillés dans les composants et difficiles à maintenir ou à tester.
//
// LayerConfig = objet de configuration STATIQUE d'une couche.
//   Il décrit "ce qu'est" la couche (type, URL, nom technique…),
//   pas son état courant (visible ou non → géré dans le state React de App.jsx).
//
// Règle CA-06 : toute LayerConfig avec un type non supporté est ignorée
//   silencieusement, avec un warning console, pour éviter un crash à l'ajout
//   d'un type expérimental ou d'une erreur de saisie.

/**
 * @typedef {Object} LayerConfig
 * @property {string}                         id               - Identifiant interne unique (stable, jamais renommé).
 * @property {string}                         title            - Nom lisible affiché à l'utilisateur.
 * @property {'WMS'|'WMTS'|'WFS'|'MVT'}      type             - Protocole OGC du service.
 * @property {string}                         url              - URL du service (sans paramètres OGC).
 * @property {string}                         [layerName]      - Nom technique WMS/WFS/WMTS (ex : "geonode:limites_communales").
 * @property {'EPSG:2154'|'EPSG:3857'}        projection       - CRS de la couche (ne jamais supposer EPSG:4326).
 * @property {boolean}                        visibleByDefault - Visibilité initiale au chargement.
 * @property {string}                         [group]          - Groupe de regroupement dans le LayerPanel.
 * @property {number}                         [opacity]        - Opacité initiale (0 à 1, défaut : 1).
 * @property {string}                         [attribution]    - Mention de source (obligatoire pour IGN, etc.).
 * @property {number}                         [minZoom]        - Niveau de zoom minimum d'affichage.
 * @property {number}                         [maxZoom]        - Niveau de zoom maximum d'affichage.
 */

// Types de couches supportés par les adaptateurs actuels.
// Toute valeur absente de cette liste déclenchera un warning CA-06.
// MVT et WFS sont listés pour préparer FE-008 ; leurs adaptateurs arrivent plus tard.
const SUPPORTED_TYPES = ['WMS', 'WMTS', 'WFS', 'MVT']

// URL du service OWS GeoServer — jamais en dur dans le code.
// VITE_GEOSERVER_OWS_URL doit être défini dans .env (voir .env.sample).
// Fallback localhost uniquement pour le développement local sans .env.
const GEOSERVER_OWS_URL =
  import.meta.env.VITE_GEOSERVER_OWS_URL ?? 'http://localhost/geoserver/ows'

/**
 * Couches métier WMS GeoServer du POC Orion.
 *
 * Ces trois couches correspondent aux premières données publiées dans GeoNode
 * lors du déploiement local (mai 2026). Elles servent de référence pour valider
 * CA-01 à CA-06 et peuvent être complétées ou remplacées par les données
 * retournées par l'API GeoNode (fetchLayers dans services/geonode.js).
 *
 * @type {LayerConfig[]}
 */
export const LAYERS_CONFIG = [
  {
    id: 'point_projet',
    title: 'Points projet',
    type: 'WMS',
    url: GEOSERVER_OWS_URL,
    layerName: 'geonode:point_projet',
    projection: 'EPSG:2154',
    visibleByDefault: true,
    group: 'Projets',
  },
  {
    id: 'zic',
    title: 'ZIC',
    type: 'WMS',
    url: GEOSERVER_OWS_URL,
    layerName: 'geonode:zic',
    projection: 'EPSG:2154',
    visibleByDefault: true,
    group: 'Environnement',
  },
  {
    id: 'jointure',
    title: 'Couche jointure',
    type: 'WMS',
    url: GEOSERVER_OWS_URL,
    layerName: 'geonode:couche_issue_de_la_jointure',
    projection: 'EPSG:2154',
    visibleByDefault: true,
    group: 'Environnement',
  },
]

/**
 * Filtre une liste de LayerConfig en écartant les types non supportés.
 *
 * CA-06 : si une config a un type invalide, elle est ignorée silencieusement
 * et un warning est émis en console pour le développeur (jamais un crash).
 * Le warning suit le format exact spécifié en CA-06 pour être traçable.
 *
 * @param {LayerConfig[]} configs
 * @returns {LayerConfig[]} Uniquement les configs avec un type supporté.
 */
export function getValidLayers(configs) {
  return configs.filter((config) => {
    if (!SUPPORTED_TYPES.includes(config.type)) {
      // CA-06 : message de warning avec le type reçu et l'id de la couche.
      // Permet au développeur d'identifier rapidement l'entrée fautive.
      console.warn(
        `LayerConfig ignorée : type non supporté = ${config.type}, id = ${config.id}`
      )
      return false
    }
    return true
  })
}
