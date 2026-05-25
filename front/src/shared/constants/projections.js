// src/shared/constants/projections.js
//
// Déclaration et enregistrement des projections cartographiques d'Orion.
//
// ⚠️  CE MODULE DOIT ÊTRE IMPORTÉ AVANT TOUTE INITIALISATION D'UNE CARTE OPENL AYERS.
// Si OpenLayers ne connaît pas EPSG:2154 au moment où la carte est créée, il ne
// sait pas calculer les résolutions, les tuiles WMTS, ni afficher les données métier.
// Importer ce module dans App.jsx (ou dans le point d'entrée) garantit l'ordre.
//
// --- Pourquoi ne pas supposer EPSG:4326 ? ---
// EPSG:4326 (WGS 84, degrés longitude/latitude) est le système "par défaut" des GPS
// et de nombreuses APIs tierces. Il n'est PAS adapté à l'affichage métier en France :
//
//   1. Distorsion métrique : à 45°N, 1° de longitude ≠ 1° de latitude en mètres.
//      Les cercles deviennent des ellipses, les surfaces sont faussées.
//   2. Donnée française produite en Lambert 93 (EPSG:2154) : superposer une couche
//      Lambert sur une vue WGS 84 sans reprojection produit un décalage géographique.
//   3. Calculs de distance/surface : uniquement fiables dans une projection plane (m).
//
// → On déclare EPSG:2154 explicitement, on l'enregistre dans OpenLayers, et on
//   l'utilise comme projection principale de toute vue Orion.

import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'
import { get as getProjection } from 'ol/proj'

// ---------------------------------------------------------------------------
// Constantes — déclarées en premier pour pouvoir les réutiliser plus bas
// ---------------------------------------------------------------------------

/**
 * Étendue de la France métropolitaine en EPSG:2154 (Lambert 93), en mètres.
 * Format : [xMin, yMin, xMax, yMax]
 *
 * Utilisée pour :
 *  - `view.fit(EXTENT_FRANCE_METRO)` au démarrage de la carte (s'adapte à la taille d'écran)
 *  - Fixer l'extent de la projection dans OpenLayers
 *  - Valider qu'un point projeté est bien dans les limites de la France
 *
 * @type {[number, number, number, number]}
 */
export const EXTENT_FRANCE_METRO = [100000, 6100000, 1250000, 7200000]

/**
 * Identifiants EPSG des projections utilisées dans Orion.
 * Toujours accéder via ces constantes plutôt que des chaînes littérales en dur,
 * pour faciliter les recherches et éviter les fautes de frappe.
 *
 * @type {{ LAMBERT93: string, WEB_MERCATOR: string, WGS84: string }}
 */
export const PROJECTIONS = {
  /** EPSG:2154 — Lambert 93. Projection principale : donnée métier et vue carte. */
  LAMBERT93: 'EPSG:2154',

  /** EPSG:3857 — Web Mercator. Projection secondaire : fonds de carte web tiers (OSM, etc.). */
  WEB_MERCATOR: 'EPSG:3857',

  /** EPSG:4326 — WGS 84. Coordonnées géographiques (GPS, GeoJSON, APIs tierces). */
  WGS84: 'EPSG:4326',
}

// ---------------------------------------------------------------------------
// EPSG:2154 — Lambert 93 — enregistrement proj4 + OpenLayers
// ---------------------------------------------------------------------------
// Définition officielle IGN / PROJ.
//   +proj=lcc          : Conique Conforme de Lambert
//   +lat_0=46.5        : parallèle d'origine (46°30'N)
//   +lon_0=3           : méridien central (3°E)
//   +lat_1=49 +lat_2=44 : parallèles standards (sécants)
//   +x_0=700000        : faux Est (origine = 700 km à l'Est du méridien central)
//   +y_0=6600000       : faux Nord (origine = 6 600 km au Nord de l'équateur)
//   +ellps=GRS80       : ellipsoïde de référence (pratiquement identique à WGS84)
//   +towgs84=0,0,0,0,0,0,0 : transformation vers WGS84 (7 paramètres nuls = aucun décalage)
//   +units=m           : coordonnées en mètres
proj4.defs(
  PROJECTIONS.LAMBERT93,
  '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 ' +
    '+x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 ' +
    '+units=m +no_defs +type=crs'
)

// Rend toutes les projections définies via proj4.defs() disponibles à OpenLayers.
// Sans cet appel, ol/proj ne saurait pas transformer des coordonnées vers/depuis EPSG:2154.
register(proj4)

// Fixe l'étendue valide d'EPSG:2154 dans le registre OpenLayers.
// Nécessaire pour que OL calcule correctement les résolutions de la vue
// et les tuiles WMTS (il détermine la taille de la "boîte monde" à partir de cet extent).
const proj2154 = getProjection(PROJECTIONS.LAMBERT93)
if (proj2154) {
  proj2154.setExtent(EXTENT_FRANCE_METRO)
}
