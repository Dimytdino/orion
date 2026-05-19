import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import 'ol/ol.css'

function MapComponent() {
  const mapRef = useRef(null)

  useEffect(() => {
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()   // fond de carte OpenStreetMap
        })
      ],
      view: new View({
        center: fromLonLat([2.3522, 46.8566]),  // centre France
        zoom: 6
      })
    })

    return () => map.setTarget(null)  // nettoyage à la fermeture
  }, [])

  return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
}

export default MapComponent