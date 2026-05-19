const GEOSERVER_URL = 'http://localhost/geoserver/wms'

const layers = [
  // --- Groupe Projets ---
  {
    id: 'point_projet',
    label: 'Points projet',
    group: 'Projets',
    url: GEOSERVER_URL,
    layer: 'geonode:point_projet',
    visible: true,
  },

  // --- Groupe Environnement ---
  {
    id: 'zic',
    label: 'ZIC',
    group: 'Environnement',
    url: GEOSERVER_URL,
    layer: 'geonode:zic',
    visible: true,
  },
  {
    id: 'jointure',
    label: 'Couche jointure',
    group: 'Environnement',
    url: GEOSERVER_URL,
    layer: 'geonode:couche_issue_de_la_jointure',
    visible: true,
  },
]

export default layers