// src/tests/mapInstance.test.js
//
// Tests du hook useMapInstance — critère d'acceptation CA-05 de SPEC-2026-001.
//
// CA-05 (extrait) :
//   "Le compteur d'initialisations de la carte reste à 1 après activation/désactivation
//    de couches. La référence d'instance OL reste la même. Les listeners OL sont
//    correctement supprimés au unmount du composant MapView."
//
// Pourquoi on mocke OpenLayers :
//   OL utilise canvas pour le rendu cartographique. jsdom (l'environnement de test Vitest)
//   simule le DOM mais ne fournit pas de canvas fonctionnel. Plutôt que d'installer
//   le package `canvas` (lourd, lent), on mocke les classes OL.
//   Ce choix est justifié : ce test valide le COMPORTEMENT du hook (init unique,
//   cleanup) et non le rendu cartographique. Le rendu est validé manuellement dans le navigateur.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'

// ---------------------------------------------------------------------------
// Mocks OpenLayers — déclarés AVANT les imports du code testé
// ---------------------------------------------------------------------------

// Instances mock partagées entre les tests
const mockSetTarget = vi.fn()
const mockGetSize = vi.fn().mockReturnValue([800, 600])
const mockFit = vi.fn()

vi.mock('ol/Map', () => ({
  default: vi.fn().mockImplementation(() => ({
    setTarget: mockSetTarget,
    getSize: mockGetSize,
  })),
}))

vi.mock('ol/View', () => ({
  default: vi.fn().mockImplementation(() => ({
    fit: mockFit,
  })),
}))

// projections.js a des effets de bord (proj4.defs, ol/proj/proj4…) qui nécessitent
// un environnement OL complet. On le mocke pour retourner seulement les constantes
// dont useMapInstance a besoin, sans déclencher d'imports OL supplémentaires.
vi.mock('../shared/constants/projections.js', () => ({
  EXTENT_FRANCE_METRO: [100000, 6100000, 1250000, 7200000],
  PROJECTIONS: {
    LAMBERT93: 'EPSG:2154',
    WEB_MERCATOR: 'EPSG:3857',
    WGS84: 'EPSG:4326',
  },
}))

// ---------------------------------------------------------------------------
// Import du hook — APRÈS les mocks (ordre obligatoire avec vi.mock hoisting)
// ---------------------------------------------------------------------------
import { useMapInstance } from '../components/useMapInstance.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Crée un containerRef pointant vers un div réel dans le jsdom,
 * ce qui permet à useMapInstance de trouver `containerRef.current` non-null.
 */
function makeDivRef() {
  const div = document.createElement('div')
  document.body.appendChild(div)
  return { current: div, cleanup: () => document.body.removeChild(div) }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMapInstance — CA-05', () => {
  beforeEach(() => {
    // Remet le compteur d'initialisations à zéro avant chaque test
    globalThis.__orionMapInitCount = 0
    vi.clearAllMocks()
    mockGetSize.mockReturnValue([800, 600])
  })

  afterEach(() => {
    delete globalThis.__orionMapInitCount
  })

  describe('Initialisation unique (non-recréation)', () => {
    it('la carte est initialisée exactement une fois au montage', () => {
      const { current: div, cleanup } = makeDivRef()
      const containerRef = { current: div }

      renderHook(() => useMapInstance(containerRef))

      // CA-05 : le compteur doit être à 1 après le premier rendu
      expect(globalThis.__orionMapInitCount).toBe(1)
      cleanup()
    })

    it('la carte n\'est pas recréée lors d\'un re-render du composant parent', () => {
      const { current: div, cleanup } = makeDivRef()
      const containerRef = { current: div }

      // `rerender` simule un re-render du composant consommateur du hook
      const { rerender } = renderHook(() => useMapInstance(containerRef))

      act(() => { rerender() })
      act(() => { rerender() })
      act(() => { rerender() })

      // 3 re-renders → le compteur doit rester à 1 (pas 4)
      expect(globalThis.__orionMapInitCount).toBe(1)
      cleanup()
    })

    it('mapRef.current pointe toujours sur la même instance après plusieurs re-renders', () => {
      const { current: div, cleanup } = makeDivRef()
      const containerRef = { current: div }

      const { result, rerender } = renderHook(() => useMapInstance(containerRef))

      const instanceInitiale = result.current.mapRef.current
      expect(instanceInitiale).not.toBeNull()

      act(() => { rerender() })
      act(() => { rerender() })

      // L'identité de l'instance OL doit être préservée (même référence)
      expect(result.current.mapRef.current).toBe(instanceInitiale)
      cleanup()
    })
  })

  describe('Nettoyage des listeners au unmount (CA-05)', () => {
    it('map.setTarget(null) est appelé au démontage du composant', () => {
      const { current: div, cleanup } = makeDivRef()
      const containerRef = { current: div }

      const { unmount } = renderHook(() => useMapInstance(containerRef))

      expect(mockSetTarget).not.toHaveBeenCalled()

      // Simule le démontage du composant (ex : navigation, fermeture d'onglet…)
      act(() => { unmount() })

      // map.setTarget(null) retire la carte du DOM et libère tous les listeners OL
      expect(mockSetTarget).toHaveBeenCalledOnce()
      expect(mockSetTarget).toHaveBeenCalledWith(null)
      cleanup()
    })

    it('mapRef.current est null après unmount', () => {
      const { current: div, cleanup } = makeDivRef()
      const containerRef = { current: div }

      const { result, unmount } = renderHook(() => useMapInstance(containerRef))
      expect(result.current.mapRef.current).not.toBeNull()

      act(() => { unmount() })

      expect(result.current.mapRef.current).toBeNull()
      cleanup()
    })
  })

  describe('Configuration de la vue (EPSG:2154 + view.fit)', () => {
    it('view.fit est appelé avec l\'étendue France métro au montage', () => {
      const { current: div, cleanup } = makeDivRef()
      const containerRef = { current: div }

      renderHook(() => useMapInstance(containerRef))

      expect(mockFit).toHaveBeenCalledOnce()
      expect(mockFit).toHaveBeenCalledWith(
        [100000, 6100000, 1250000, 7200000],
        expect.objectContaining({ size: expect.any(Array) })
      )
      cleanup()
    })

    it('les extraLayers passées en option sont transmises à la carte', async () => {
      // Vérifie que le mécanisme d'injection de couches (utilisé par FE-011 pour le Plan IGN)
      // est bien câblé dans le constructeur OL
      const OlMap = (await import('ol/Map')).default
      const { current: div, cleanup } = makeDivRef()
      const containerRef = { current: div }
      const fakeLayers = [{ id: 'plan-ign' }, { id: 'wms-test' }]

      renderHook(() => useMapInstance(containerRef, { extraLayers: fakeLayers }))

      expect(OlMap).toHaveBeenCalledWith(
        expect.objectContaining({
          layers: fakeLayers,
        })
      )
      cleanup()
    })
  })
})
