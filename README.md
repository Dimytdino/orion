# Orion
Plateforme de données géospatiales basée sur GeoNode 5.

## Architecture

Ce repo contient le **front-end** et la documentation du projet.  
Le back-end (GeoNode, GeoServer, Docker) vit dans le repo dédié :
**[orion-geonode](https://github.com/Dimytdino/orion-geonode)** — `src/orion_geonode/` + `Dockerfile` + `docker-compose.yml`

## Stack technique
- Front : React / OpenLayers (`front/`)
- Back : GeoNode 5 (dépendance pip), Django, GeoServer, PostgreSQL/PostGIS
- Infra : Docker Compose, Ubuntu 24.04 (WSL2)

## Phases
- Phase 1 : Installation et publication de couches
- Phase 2 : Intégration ArcGIS Server
- Phase 3 : Outils personnalisés (calepinage solaire...)

## Journal des modifications
- 2026-05-19 : Migration vers geonode-project — GeoNode devient une dépendance pip, back-end isolé dans orion-geonode
- 2026-05-04 : Installation GeoNode 5, première couche publiée
