import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS'
import { fromLonLat } from 'ol/proj'
import 'ol/ol.css'
import layersConfig from '../config/layers'

function MapComponent() {
  const mapRef = useRef(null)

  useEffect(() => {

    // Fond de carte OSM
    const basemap = new TileLayer({ source: new OSM() })

    // Couches GeoServer générées depuis la config
    const wmsLayers = layersConfig.map(
      (cfg) =>
        new TileLayer({
          source: new TileWMS({
            url: cfg.url,
            params: { LAYERS: cfg.layer, TILED: true },
            serverType: 'geoserver',
          }),
          visible: cfg.visible,
          properties: { id: cfg.id }, // pour retrouver la couche plus tard
        })
    )

    const map = new Map({
      target: mapRef.current,
      layers: [basemap, ...wmsLayers],
      view: new View({
        center: fromLonLat([2.3522, 46.8566]),
        zoom: 6,
      }),
    })

    return () => map.setTarget(null)
  }, [])

  return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
}

export default MapComponent