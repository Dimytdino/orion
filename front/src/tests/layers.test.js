// src/tests/layers.test.js
//
// Tests du module shared/constants/layers.js — critère d'acceptation CA-06.
//
// CA-06 (extrait de SPEC-2026-001) :
//   "Étant donné une LayerConfig avec un champ 'type' non supporté
//    Quand l'application démarre et tente d'enregistrer cette couche
//    Alors la couche est ignorée silencieusement (pas de crash)
//    Et un warning est inscrit en console :
//      'LayerConfig ignorée : type non supporté = <valeur>, id = <id>'"

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getValidLayers, LAYERS_CONFIG } from '../shared/constants/layers.js'

describe('Module layers — CA-06', () => {
  describe('getValidLayers — filtrage des types non supportés', () => {
    let warnSpy

    beforeEach(() => {
      // On intercepte console.warn pour vérifier les messages CA-06
      // sans polluer la sortie de test
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('retourne toutes les couches si tous les types sont valides', () => {
      const configs = [
        { id: 'a', type: 'WMS', title: 'A' },
        { id: 'b', type: 'WMTS', title: 'B' },
        { id: 'c', type: 'WFS', title: 'C' },
        { id: 'd', type: 'MVT', title: 'D' },
      ]

      const result = getValidLayers(configs)
      expect(result).toHaveLength(4)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('écarte silencieusement une couche avec un type non supporté', () => {
      const configs = [
        { id: 'valid', type: 'WMS', title: 'Valide' },
        { id: 'invalid', type: 'XYZ', title: 'Invalide' },
      ]

      const result = getValidLayers(configs)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('valid')
    })

    it("émet un console.warn avec le type et l'id pour chaque couche invalide", () => {
      const configs = [{ id: 'bad-layer', type: 'GEOJSON', title: 'Mauvais type' }]
      getValidLayers(configs)

      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledWith(
        'LayerConfig ignorée : type non supporté = GEOJSON, id = bad-layer'
      )
    })

    it("ne crash pas et ne lève pas d'exception — CA-06 'ignorée silencieusement'", () => {
      const configs = [
        { id: 'x', type: 'INCONNU', title: 'X' },
        { id: 'y', type: undefined, title: 'Y' },
      ]

      expect(() => getValidLayers(configs)).not.toThrow()
    })

    it('retourne un tableau vide si toutes les couches sont invalides', () => {
      const configs = [
        { id: 'a', type: 'CSV', title: 'A' },
        { id: 'b', type: 'SHAPEFILE', title: 'B' },
      ]

      const result = getValidLayers(configs)
      expect(result).toHaveLength(0)
      expect(warnSpy).toHaveBeenCalledTimes(2)
    })

    it("retourne un tableau vide si l'entrée est un tableau vide", () => {
      const result = getValidLayers([])
      expect(result).toHaveLength(0)
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('LAYERS_CONFIG — validation de la config POC', () => {
    it('toutes les couches de la config POC ont des types valides', () => {
      // Si ce test échoue, c'est qu'on a accidentellement mis un type invalide
      // dans la config de référence — la première chose à corriger
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const valid = getValidLayers(LAYERS_CONFIG)
      expect(valid).toHaveLength(LAYERS_CONFIG.length)
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })

    it('chaque couche de la config POC a les champs obligatoires', () => {
      LAYERS_CONFIG.forEach((config) => {
        expect(config.id, `id manquant pour ${config.title}`).toBeTruthy()
        expect(config.title, `title manquant pour id=${config.id}`).toBeTruthy()
        expect(config.type, `type manquant pour id=${config.id}`).toBeTruthy()
        expect(config.url, `url manquant pour id=${config.id}`).toBeTruthy()
        expect(config.projection, `projection manquant pour id=${config.id}`).toBeTruthy()
        expect(
          typeof config.visibleByDefault,
          `visibleByDefault doit être un booléen pour id=${config.id}`
        ).toBe('boolean')
      })
    })

    it('chaque couche WMS de la config POC a un layerName défini', () => {
      const wmsLayers = LAYERS_CONFIG.filter((c) => c.type === 'WMS')
      wmsLayers.forEach((config) => {
        expect(config.layerName, `layerName manquant pour id=${config.id}`).toBeTruthy()
      })
    })

    it('tous les ids de la config POC sont uniques', () => {
      const ids = LAYERS_CONFIG.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})
