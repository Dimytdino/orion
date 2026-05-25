// src/components/useMapInstance.js
//
// Hook React qui encapsule le cycle de vie complet d'une instance OpenLayers.
//
// Pourquoi un hook plutôt que du code direct dans le composant :
//   1. Isole toute la logique impérative OL (create, configure, destroy) hors de l'UI.
//      Un composant React ne devrait pas manipuler directement l'API OL.
//   2. Garantit qu'on ne crée la carte qu'UNE SEULE FOIS par montage, jamais sur un re-render.
//      (cf. contrainte CA-05 de SPEC-2026-001)
//   3. Nettoyage explicite et vérifiable : `map.setTarget(null)` est toujours appelé au unmount,
//      ce qui retire tous les event listeners internes d'OpenLayers.
//   4. Extensible : passer `extraLayers` permet d'injecter le fond IGN (FE-011) sans toucher ce fichier.

import { useEffect, useRef } from 'react'
import OlMap from 'ol/Map'
import View from 'ol/View'

// ⚠️ Cet import déclenche l'enregistrement de EPSG:2154 dans proj4 + OpenLayers.
// Il doit se produire AVANT la création de toute vue OL (sinon OL ne connaît pas la projection).
// On l'importe ici plutôt que dans le composant consommateur pour garantir l'ordre.
import { EXTENT_FRANCE_METRO, PROJECTIONS } from '../shared/constants/projections.js'

/**
 * Crée et gère le cycle de vie d'une instance OpenLayers.
 *
 * @param {import('react').RefObject<HTMLElement>} containerRef
 *   Référence vers le div DOM qui doit accueillir la carte.
 *   Ce div doit avoir des dimensions CSS définies (width + height), sinon la carte
 *   ne peut pas calculer sa taille et `view.fit()` ne fonctionnera pas correctement.
 *
 * @param {object}  [options]
 * @param {import('ol/layer/Base').default[]} [options.extraLayers]
 *   Couches à ajouter à la carte dès l'initialisation (ex : fond Plan IGN depuis FE-011).
 *   Les couches WMS métier sont ajoutées séparément dans App.jsx via `map.addLayer()`.
 *
 * @returns {{ mapRef: import('react').RefObject<import('ol/Map').default|null> }}
 *   `mapRef.current` contient l'instance OL après le premier rendu, null avant et après unmount.
 */
export function useMapInstance(containerRef, { extraLayers = [] } = {}) {
  // mapRef expose l'instance OL au composant consommateur.
  // On utilise un useRef (et non un useState) : la référence ne doit PAS déclencher
  // un re-render quand elle change — ce serait une boucle infinie avec l'effet lui-même.
  const mapRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // -----------------------------------------------------------------------
    // CA-05 : compteur d'initialisations — actif UNIQUEMENT en mode test
    // Permet de vérifier qu'on ne recrée pas la carte sur un re-render.
    // Guard `import.meta.env.MODE === 'test'` : n'existe pas en production/dev.
    // -----------------------------------------------------------------------
    if (import.meta.env.MODE === 'test') {
      globalThis.__orionMapInitCount = (globalThis.__orionMapInitCount ?? 0) + 1
    }

    // Vue en EPSG:2154 (Lambert 93) — projection principale d'Orion.
    // On ne fixe pas de center/zoom : on utilisera view.fit() après la création
    // de la carte pour s'adapter à la taille réelle du container.
    const view = new View({
      projection: PROJECTIONS.LAMBERT93,
    })

    const map = new OlMap({
      target: containerRef.current,
      // extraLayers contient le fond Plan IGN quand FE-011 est disponible.
      // Si la liste est vide, le container affiche son CSS background (gris neutre).
      layers: [...extraLayers],
      view,
    })

    // Centrage sur la France métropolitaine.
    // `view.fit(extent, { size })` choisit automatiquement le zoom adapté à la taille
    // de l'écran — plus fiable que `setZoom` / `setCenter` qui ignorent les dimensions.
    // On fournit un fallback [800, 600] si la carte n'a pas encore calculé sa taille.
    view.fit(EXTENT_FRANCE_METRO, {
      size: map.getSize() ?? [800, 600],
    })

    mapRef.current = map

    // -----------------------------------------------------------------------
    // Nettoyage — exécuté au unmount du composant consommateur
    // `map.setTarget(null)` :
    //   - Détache la carte du div DOM
    //   - Retire tous les event listeners internes d'OpenLayers (resize, pointer, etc.)
    //   - Libère les références au container pour le garbage collector
    // -----------------------------------------------------------------------
    return () => {
      map.setTarget(null)
      mapRef.current = null
    }
  // [] intentionnel : s'exécute UNE SEULE FOIS au montage.
  // containerRef est un useRef → sa valeur `.current` est stable entre les renders.
  // extraLayers est lu à l'initialisation uniquement (design voulu : les couches sont
  // ajoutées/retirées via map.addLayer/removeLayer après coup, pas en recréant la carte).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { mapRef }
}
