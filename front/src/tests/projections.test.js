// src/tests/projections.test.js
//
// Tests du module shared/constants/projections.js — critère d'acceptation CA-03.
//
// CA-03 (extrait de SPEC-2026-001) :
//   "Quand on convertit le point de Notre-Dame de Paris [2.349014, 48.852968]
//    (EPSG:4326) vers EPSG:2154 et qu'on reconvertit immédiatement ce résultat
//    de EPSG:2154 vers EPSG:4326, on retrouve le point d'origine avec une
//    tolérance de ±0.0001° (≈ 10 m au sol)."
//
// Pourquoi tester par invertibilité plutôt que par des valeurs exactes :
//   Les coordonnées Lambert 93 exactes d'un point varient légèrement selon
//   la définition proj4 utilisée (présence ou absence de +towgs84, par ex.).
//   Tester l'invertibilité valide que la CHAÎNE de transformation est cohérente
//   sans dépendre d'une valeur arbitraire. C'est ce que préconise la SPEC.

import { describe, it, expect } from 'vitest'
import proj4 from 'proj4'

// L'import du module déclenche ses effets de bord (proj4.defs + register + setExtent).
// C'est intentionnel : on valide que le module s'initialise correctement au chargement.
import { EXTENT_FRANCE_METRO, PROJECTIONS } from '../shared/constants/projections.js'

// ---------------------------------------------------------------------------
// Données de test
// ---------------------------------------------------------------------------

// Point de référence : parvis de Notre-Dame de Paris.
// Source : coordonnées géodésiques publiées par l'IGN.
const NOTRE_DAME_WGS84 = [2.349014, 48.852968] // [longitude, latitude]

const TOLERANCE_DEGRES = 0.0001 // ≈ 10 m au sol à la latitude de Paris

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Module projections — CA-03', () => {
  describe('Transformation EPSG:4326 → EPSG:2154 → EPSG:4326 (invertibilité)', () => {
    // On calcule une seule fois pour réutiliser dans plusieurs assertions
    const lambert93 = proj4(PROJECTIONS.WGS84, PROJECTIONS.LAMBERT93, NOTRE_DAME_WGS84)
    const retourWgs84 = proj4(PROJECTIONS.LAMBERT93, PROJECTIONS.WGS84, lambert93)

    it('le résultat en EPSG:2154 est dans l\'étendue France métropolitaine', () => {
      // Vérifie que les coordonnées projetées tombent bien dans la "boîte France".
      // Si ce test échoue, la définition proj4 est incorrecte (mauvais ellipsoïde,
      // mauvais paramètres de projection, etc.).
      const [x, y] = lambert93
      const [xMin, yMin, xMax, yMax] = EXTENT_FRANCE_METRO

      expect(x).toBeGreaterThan(xMin)
      expect(x).toBeLessThan(xMax)
      expect(y).toBeGreaterThan(yMin)
      expect(y).toBeLessThan(yMax)
    })

    it(`la transformation est invertible à ±${TOLERANCE_DEGRES}° en longitude`, () => {
      // CA-03 : aller-retour sur la longitude
      const ecartLon = Math.abs(retourWgs84[0] - NOTRE_DAME_WGS84[0])
      expect(ecartLon).toBeLessThan(TOLERANCE_DEGRES)
    })

    it(`la transformation est invertible à ±${TOLERANCE_DEGRES}° en latitude`, () => {
      // CA-03 : aller-retour sur la latitude
      const ecartLat = Math.abs(retourWgs84[1] - NOTRE_DAME_WGS84[1])
      expect(ecartLat).toBeLessThan(TOLERANCE_DEGRES)
    })
  })

  describe('Constantes exportées', () => {
    it('PROJECTIONS.LAMBERT93 vaut "EPSG:2154"', () => {
      expect(PROJECTIONS.LAMBERT93).toBe('EPSG:2154')
    })

    it('PROJECTIONS.WEB_MERCATOR vaut "EPSG:3857"', () => {
      expect(PROJECTIONS.WEB_MERCATOR).toBe('EPSG:3857')
    })

    it('PROJECTIONS.WGS84 vaut "EPSG:4326"', () => {
      expect(PROJECTIONS.WGS84).toBe('EPSG:4326')
    })

    it('EXTENT_FRANCE_METRO est un tableau de 4 nombres positifs', () => {
      expect(EXTENT_FRANCE_METRO).toHaveLength(4)
      EXTENT_FRANCE_METRO.forEach((v) => {
        expect(typeof v).toBe('number')
        expect(v).toBeGreaterThan(0)
      })
    })

    it('EXTENT_FRANCE_METRO a xMin < xMax et yMin < yMax', () => {
      const [xMin, yMin, xMax, yMax] = EXTENT_FRANCE_METRO
      expect(xMin).toBeLessThan(xMax)
      expect(yMin).toBeLessThan(yMax)
    })
  })

  describe('Enregistrement proj4 — EPSG:2154 reconnu', () => {
    it('proj4 connaît la définition EPSG:2154 après import du module', () => {
      // proj4.defs() retourne la définition si elle existe, undefined sinon.
      // Ce test confirme que l'effet de bord d'import s'est bien produit.
      const def = proj4.defs('EPSG:2154')
      expect(def).toBeDefined()
    })
  })
})
