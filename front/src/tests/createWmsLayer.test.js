// src/tests/createWmsLayer.test.js
//
// Tests de l'adaptateur WMS GeoServer — critères CA-02 et CA-04.
//
// Note sur les mocks et le hoisting Vitest :
//   vi.mock() est hissé (hoisted) au-dessus de toutes les déclarations par Vitest.
//   Règle : le factory d'un mock NE DOIT PAS référencer directement une variable
//   externe déclarée avec const/let (TDZ). Il doit créer les vi.fn() inline.
//   Les variables de spy (mockSourceOn) peuvent être capturées dans une closure
//   de mockImplementation car elles ne sont accédées qu'à l'appel du mock, pas
//   à la création du factory. C'est le même pattern que mapInstance.test.js.

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks OpenLayers — factories auto-contenus (pas de référence externe directe)
// ---------------------------------------------------------------------------

// Spy partagé pour vérifier source.on('tileloaderror', handler)
const mockSourceOn = vi.fn()

vi.mock('ol/layer/Tile', () => ({
  // vi.fn() créé inline — pas de référence à une variable externe
  default: vi.fn().mockImplementation(() => ({})),
}))

vi.mock('ol/source/TileWMS', () => ({
  // mockSourceOn est capturé dans la closure de mockImplementation (accès lazy — OK)
  default: vi.fn().mockImplementation(() => ({ on: mockSourceOn })),
}))

// ---------------------------------------------------------------------------
// Imports des constructeurs mockés et du code testé
// Vitest hisse vi.mock() avant les imports, donc ces imports reçoivent les mocks
// ---------------------------------------------------------------------------
import MockTileLayer from 'ol/layer/Tile'
import MockTileWMS from 'ol/source/TileWMS'
import { createWmsLayer } from '../services/geoserver/createWmsLayer.js'

// ---------------------------------------------------------------------------
// Fixture — config WMS valide de référence
// ---------------------------------------------------------------------------
const VALID_CONFIG = {
  id: 'limites_communales',
  title: 'Limites communales',
  type: 'WMS',
  url: 'http://localhost/geoserver/ows',
  layerName: 'geonode:limites_communales',
  projection: 'EPSG:2154',
  visibleByDefault: true,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createWmsLayer — adaptateur WMS GeoServer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Création de couche valide', () => {
    it('retourne une instance TileLayer', () => {
      const layer = createWmsLayer(VALID_CONFIG)
      // MockTileLayer est le vi.fn() qui joue le rôle de constructeur TileLayer
      expect(layer).toBe(MockTileLayer.mock.results[0].value)
    })

    it("crée un TileWMS avec l'URL correcte", () => {
      createWmsLayer(VALID_CONFIG)
      expect(MockTileWMS).toHaveBeenCalledWith(
        expect.objectContaining({ url: VALID_CONFIG.url })
      )
    })

    it('transmet le nom technique GeoServer dans le paramètre LAYERS', () => {
      createWmsLayer(VALID_CONFIG)
      expect(MockTileWMS).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ LAYERS: VALID_CONFIG.layerName }),
        })
      )
    })

    it('active TILED dans les paramètres WMS (optimisation performances)', () => {
      createWmsLayer(VALID_CONFIG)
      expect(MockTileWMS).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ TILED: true }),
        })
      )
    })

    it('configure serverType à "geoserver"', () => {
      createWmsLayer(VALID_CONFIG)
      expect(MockTileWMS).toHaveBeenCalledWith(
        expect.objectContaining({ serverType: 'geoserver' })
      )
    })

    it("stocke l'id dans les propriétés OL pour retrouver la couche au toggle", () => {
      createWmsLayer(VALID_CONFIG)
      expect(MockTileLayer).toHaveBeenCalledWith(
        expect.objectContaining({ properties: { id: VALID_CONFIG.id } })
      )
    })

    it('respecte visibleByDefault=true', () => {
      createWmsLayer(VALID_CONFIG)
      expect(MockTileLayer).toHaveBeenCalledWith(
        expect.objectContaining({ visible: true })
      )
    })

    it('respecte visibleByDefault=false', () => {
      createWmsLayer({ ...VALID_CONFIG, visibleByDefault: false })
      expect(MockTileLayer).toHaveBeenCalledWith(
        expect.objectContaining({ visible: false })
      )
    })

    it("l'option visible surcharge visibleByDefault (pour les toggles App.jsx)", () => {
      createWmsLayer({ ...VALID_CONFIG, visibleByDefault: true }, { visible: false })
      expect(MockTileLayer).toHaveBeenCalledWith(
        expect.objectContaining({ visible: false })
      )
    })

    it("l'opacité par défaut est 1 si non précisée", () => {
      createWmsLayer(VALID_CONFIG)
      expect(MockTileLayer).toHaveBeenCalledWith(
        expect.objectContaining({ opacity: 1 })
      )
    })

    it("l'opacité de la config est utilisée si précisée", () => {
      createWmsLayer({ ...VALID_CONFIG, opacity: 0.7 })
      expect(MockTileLayer).toHaveBeenCalledWith(
        expect.objectContaining({ opacity: 0.7 })
      )
    })
  })

  describe("Rejet des types non-WMS", () => {
    it("lève une erreur si le type n'est pas WMS", () => {
      expect(() =>
        createWmsLayer({ ...VALID_CONFIG, type: 'WMTS' })
      ).toThrow(/createWmsLayer.*type attendu 'WMS'/)
    })

    it("inclut le type reçu et l'id dans le message d'erreur", () => {
      expect(() =>
        createWmsLayer({ ...VALID_CONFIG, type: 'MVT' })
      ).toThrow(/MVT.*limites_communales/)
    })
  })

  describe('Callback onError — propagation erreurs tuile (CA-04)', () => {
    it('enregistre un listener tileloaderror si onError est fourni', () => {
      const onError = vi.fn()
      createWmsLayer(VALID_CONFIG, { onError })

      expect(mockSourceOn).toHaveBeenCalledOnce()
      expect(mockSourceOn).toHaveBeenCalledWith('tileloaderror', expect.any(Function))
    })

    it("n'enregistre pas de listener si onError est absent", () => {
      createWmsLayer(VALID_CONFIG)
      expect(mockSourceOn).not.toHaveBeenCalled()
    })

    it("appelle onError avec un objet Error contenant l'id de la couche", () => {
      const onError = vi.fn()
      createWmsLayer(VALID_CONFIG, { onError })

      // Simule le déclenchement de l'événement tileloaderror par OL
      const handler = mockSourceOn.mock.calls[0][1]
      handler({ tile: { src: 'http://localhost/geoserver/ows?request=GetMap' } })

      expect(onError).toHaveBeenCalledOnce()
      const err = onError.mock.calls[0][0]
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toContain(VALID_CONFIG.id)
    })

    it("inclut l'URL de la tuile dans le message d'erreur", () => {
      const onError = vi.fn()
      createWmsLayer(VALID_CONFIG, { onError })

      const handler = mockSourceOn.mock.calls[0][1]
      const tileUrl = 'http://localhost/geoserver/ows?SERVICE=WMS&VERSION=1.1.1'
      handler({ tile: { src: tileUrl } })

      expect(onError.mock.calls[0][0].message).toContain(tileUrl)
    })
  })
})
