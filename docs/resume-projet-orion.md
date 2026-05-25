# Projet Orion — Résumé technique et métier

*Version : 2026-05-22 — Source de vérité : `orion/CLAUDE.md`*

---

## 1. Contexte et objectif

L'équipe géomatique opère aujourd'hui sur une stack **100 % Esri** (ArcGIS Server, Portal, géodatabase SDE).
L'objectif du projet **Orion** est de migrer progressivement vers une stack **open source équivalente**,
pour réduire la dépendance à un éditeur propriétaire et les coûts de licence associés.

Le projet a aussi une dimension **pédagogique** : monter en compétence sur les briques open source
(infrastructure, code, déploiement, IA) en parallèle de la migration.

**Phase actuelle** : POC (Preuve de concept) — validé localement, CI/CD en place.

---

## 2. Équivalences Esri → Open Source

| Esri (actuel) | Open source (Orion) |
|---|---|
| ArcGIS Server | GeoServer (inclus dans GeoNode) |
| ArcGIS Portal | GeoNode (catalogue + portail web) |
| File Geodatabase / SDE | PostgreSQL + PostGIS |
| ArcPy / ModelBuilder | Python + GeoPandas / Shapely |
| Web AppBuilder | React + OpenLayers (front custom) |
| ArcGIS Pro | QGIS (poste de travail, hors POC) |

---

## 3. Stack technique retenue

### Plateforme centrale : GeoNode 5

GeoNode est une **plateforme géospatiale open source tout-en-un**, basée sur Django (framework web Python).
Elle embarque en un seul produit :
- **GeoServer** : serveur cartographique, expose les données en WMS / WFS / WCS / WMTS
- **PostgreSQL + PostGIS** : base de données géographique (équivalent de la géodatabase Esri)
- **pycsw** : catalogue de métadonnées (standard CSW/OGC)
- **Django** : moteur web, API REST (`/api/v2/`), interface d'administration, gestion des droits

GeoNode est installé comme une **dépendance pip** (bibliothèque Python), sur un SHA Git figé
correspondant à la version `5.1.0.dev0` validée en test :
```
git+https://github.com/GeoNode/geonode.git@72ff6814eecf6542261f5991a2b776ec3c307841
```
> **Pourquoi figer le SHA ?** Pour garantir que la version testée est exactement celle qui tourne
> en production, sans risque de changement silencieux lors d'un rebuild.

### Front-end cartographique custom

- **React 19** : framework JavaScript pour construire l'interface utilisateur
- **OpenLayers 10** : bibliothèque cartographique (gère les projections Lambert 93, les services OGC,
  le rendu vectoriel et raster)
- **Vite 8** : outil de build et serveur de développement

> **Pourquoi OpenLayers et pas Leaflet ?** OpenLayers gère nativement les projections complexes
> (EPSG:2154 = Lambert 93) et l'ensemble des protocoles OGC servis par GeoServer.

---

## 4. Architecture des dépôts

```
github.com/Dimytdino/orion              ← front + docs + agents IA
  front/                                # Application React / OpenLayers
    src/App.jsx
    components/Map.jsx
    components/SearchBar.jsx
    components/LayerPanel.jsx
  docs/
    adr/                                # Décisions d'architecture (ADR)
    ROADMAP.md                          # Feuille de route
    journal/                            # Journaux de session
  .claude/agents/                       # Équipe d'agents IA (Claude Code)
  CLAUDE.md                             # ← SOURCE DE VÉRITÉ PROJET

github.com/Dimytdino/orion-geonode      ← back-end (infra + GeoNode)
  src/
    orion_geonode/                      # Module Django Orion (toutes les surcharges)
      settings.py                       # Hérite de geonode.settings
      urls.py / wsgi.py
      static/ / templates/
    requirements.txt                    # GeoNode en dépendance pip (SHA figé)
    manage.py
  docker/                               # Dockerfiles (nginx, geoserver…)
  docker-compose.yml                    # ← SOURCE DE VÉRITÉ INFRA
  Dockerfile                            # Image Django / Celery
  .env.sample                           # Template (placeholders uniquement, jamais de secrets)
  create-envfile.py                     # Génère le .env local
  tests/smoke.py                        # Smoke tests (4 endpoints vitaux)
  docs/dev-local.md                     # Guide démarrage local (<15 min)
  .github/workflows/
    ci.yml                              # Build image + vérif import orion_geonode
    smoke.yml                           # Stack complète + smoke tests (sur master)
  CLAUDE.md                             # Contexte technique back-end (renvoie vers orion/CLAUDE.md)
```

**Règle absolue** : ne jamais modifier GeoNode directement.
Toute personnalisation passe par `src/orion_geonode/`.

---

## 5. Infrastructure Docker

La stack tourne via **Docker Compose** (`docker-compose.yml` à la racine d'`orion-geonode`).
Docker = système de conteneurs qui isole chaque service dans sa propre "boîte hermétique".

| Conteneur | Rôle | URL locale |
|---|---|---|
| `django4orion_geonode` | Application web + API | http://localhost |
| `geoserver4orion_geonode` | Serveur cartographique OGC | http://localhost/geoserver/web/ |
| `db4orion_geonode` | PostgreSQL + PostGIS | localhost:5432 |
| `nginx4orion_geonode` | Reverse proxy (routage HTTP) | — |
| `celery4orion_geonode` | Tâches asynchrones (imports, indexation) | — |
| `letsencrypt4orion_geonode` | Certificats HTTPS (désactivé en local) | — |

> **Note importante** : le service `letsencrypt` doit avoir `restart: "no"` quand
> `LETSENCRYPT_MODE=disabled`, sinon il redémarre en boucle infinie.

---

## 6. CI/CD (Intégration et déploiement continus)

CI/CD = pipeline automatique qui vérifie que le code ne casse rien à chaque modification.

| Workflow | Déclencheur | Durée estimée | Ce qu'il fait |
|---|---|---|---|
| `ci.yml` | Push sur toute branche | ~3 min | Build image Docker + vérifie `import orion_geonode` |
| `smoke.yml` | Push sur `master` + manuel | ~20 min | Stack complète + 4 smoke tests |

### Smoke tests (tests de fumée)

4 vérifications vitales après démarrage :

| # | Endpoint | Critère de succès |
|---|---|---|
| 1 | `GET /` | HTTP 200 (page d'accueil GeoNode) |
| 2 | `GET /api/v2/` | HTTP 200 (API REST GeoNode) |
| 3 | `GET /admin/login/` | HTTP 200 (interface admin Django) |
| 4 | `GET /geoserver/ows?SERVICE=WMS&REQUEST=GetCapabilities` | HTTP 200 + "WMS_Capabilities" dans la réponse |

Lancement local : `python3 tests/smoke.py`

---

## 7. Sécurité et secrets

- Le fichier `.env` ne doit **jamais** être commité dans Git
- Seul `.env.sample` (avec des placeholders comme `CHANGEME`) est versionné
- Tous les secrets (mots de passe, `SECRET_KEY`, tokens) passent par **variables d'environnement**
- Jamais de secret en clair dans le code

---

## 8. Équipe d'agents IA

Les agents Claude Code sont définis dans `orion/.claude/agents/` et partagés entre les deux repos
via un lien symbolique.

| Agent | Rôle |
|---|---|
| `architecte-orion` | Décisions structurantes, ADR, arbitrage POC/industrialisation |
| `dev-geo` | Back-end Python, PostGIS, pipelines ETL, API GeoNode |
| `dev-front` | Front React/OpenLayers, composants, services WMS/WFS |
| `gardien-doc` | Documentation, ADR, journaux de session, glossaire |
| `relecteur` | Revue de code avant PR/merge |

---

## 9. Décisions d'architecture (ADR)

Les ADR (Architecture Decision Records) documentent les choix structurants et leur motivation.

| ADR | Décision | Date |
|---|---|---|
| ADR 0001 | Utilisation du pattern `geonode-project` (GeoNode comme dépendance pip, pas un fork) | 2026-05-19 |

---

## 10. État d'avancement

| Étape | Statut |
|---|---|
| Déploiement local GeoNode 5 via Docker Compose | ✅ Terminé |
| Premier jeu de données importé, WMS fonctionnel | ✅ Terminé |
| Front React + OpenLayers minimal (Map / SearchBar / LayerPanel) | ✅ Terminé |
| Migration vers le pattern `geonode-project` | ✅ Terminé |
| Version GeoNode figée sur SHA validé | ✅ Terminé |
| CI GitHub Actions (build + smoke tests) | ✅ Terminé |
| Équipe d'agents IA configurée | ✅ Terminé |
| ROADMAP.md rédigée | ✅ Terminé |
| Documentation environnement de développement local | ✅ Terminé |
| **Phase 2 : Intégration ArcGIS Server** | ⏳ Nécessite ADR |
| **Phase 3 : Outils métier calepinage solaire** | ⏳ Nécessite ADR |

---

## 11. Glossaire

| Terme | Définition |
|---|---|
| **POC** | Preuve de concept — version simplifiée pour valider la faisabilité avant d'industrialiser |
| **Docker / Docker Compose** | Système de conteneurs qui isole chaque service ; Docker Compose orchestre plusieurs conteneurs ensemble |
| **Django** | Framework web Python sur lequel GeoNode est construit |
| **OGC** | Open Geospatial Consortium — organisme qui définit les standards d'échange géographiques |
| **WMS** | Web Map Service — retourne une image de carte |
| **WFS** | Web Feature Service — retourne des objets vectoriels (GeoJSON, GML…) |
| **WCS** | Web Coverage Service — retourne des données raster |
| **PostGIS** | Extension géospatiale de PostgreSQL, permet de stocker et requêter de la géographie en SQL |
| **CRS / EPSG** | Système de projection cartographique (ex : EPSG:2154 = Lambert 93) |
| **ADR** | Architecture Decision Record — document qui trace un choix technique et sa motivation |
| **CI/CD** | Intégration et déploiement continus — pipeline automatique de vérification du code |
| **SHA** | Empreinte unique d'un commit Git — permet de figer une version précise d'une dépendance |
| **pip** | Gestionnaire de paquets Python (équivalent de npm pour JavaScript) |
