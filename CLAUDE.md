# CLAUDE.md — Projet Orion

> Ce fichier est lu automatiquement par les agents Claude (Claude Code dans VS Code, Cowork dans l'application bureautique). Il contient le contexte du projet, les conventions, et les attentes vis-à-vis de l'agent. **À tenir à jour** : c'est la mémoire partagée du projet.

---

## 1. Contexte du projet

**Nom du projet** : Orion
**Objectif** : Migrer l'infrastructure géomatique de l'équipe, actuellement 100 % Esri, vers une stack open source.
**Phase actuelle** : POC (preuve de concept) — GeoNode fonctionne en local, premier front cartographique custom opérationnel.
**Vision long terme** : Industrialiser la solution une fois le POC validé (production, montée en charge, gouvernance des données, intégration SI).

Ce projet a aussi une dimension **pédagogique** : il sert à monter en compétence sur l'ensemble des briques (infrastructure, technos, code, déploiement, agentique IA). La vulgarisation des concepts est donc **aussi importante que le code lui-même**.

---

## 2. Profil de l'utilisateur principal

- **Rôle** : Directeur d'une équipe géomatique.
- **Profil technique** : N'est ni développeur ni expert technique. Comprend les concepts SIG métier en profondeur, mais découvre les briques open source.
- **Attente** : Les termes techniques doivent être **vulgarisés et expliqués**. Pas de jargon non défini. Quand un concept apparaît (Docker, Django, ORM, CRS, WMS, etc.), donner une explication courte en parallèle de l'usage.
- **Méthode de travail** : Prioriser la compréhension sur la rapidité. Mieux vaut une réponse plus longue qui explique le "pourquoi" qu'une réponse expéditive.

---

## 3. Stack technique choisie

### Plateforme principale
- **GeoNode 5** — Plateforme géospatiale tout-en-un, open source, basée sur Django.
- Embarque : PostgreSQL + PostGIS (base spatiale), GeoServer (serveur OGC : WMS/WFS/WCS), pycsw (catalogue de métadonnées CSW), Django (framework web), une UI de catalogue.
- **Pourquoi ce choix** : couvre en un seul produit l'équivalent fonctionnel de plusieurs briques Esri (ArcGIS Server, Portal for ArcGIS, géodatabase, catalogue), avec une communauté active.

### Front-end cartographique custom
- **React 19** + **Vite 8** pour le bundler/serveur de dev.
- **OpenLayers 10** pour la carte (`ol` npm package).
- Structure actuelle : `front/src/App.jsx`, `components/Map.jsx`, `components/SearchBar.jsx`, `components/LayerPanel.jsx`.

### Équivalences Esri → Open Source

| Esri | Équivalent open source dans Orion |
|---|---|
| ArcGIS Pro / ArcMap | QGIS (poste de travail, hors POC) |
| ArcGIS Server | GeoServer (inclus dans GeoNode) |
| ArcGIS Portal | GeoNode (catalogue + portail) |
| File Geodatabase / SDE | PostgreSQL + PostGIS |
| ArcPy / ModelBuilder | Python + GeoPandas / Shapely / PyQGIS |
| Web AppBuilder | React + OpenLayers (custom) |

---

## 4. Organisation des dépôts (état actuel)

- **`orion`** (ce repo, `github.com/Dimytdino/orion`) : projet applicatif — front React/OpenLayers, docker-compose, docs, notes.
- **`orion-geonode`** (`github.com/Dimytdino/orion-geonode`) : fork de GeoNode upstream avec quelques modifications d'infra (upload size, harakiri uWSGI).

**Décision en cours** (à formaliser dans un ADR) : migrer vers une organisation basée sur le template officiel **[geonode-project](https://github.com/GeoNode/geonode-project)**. Voir `docs/adr/0001-strategie-geonode-project.md` (à créer).

---

## 5. Conventions et attentes pour les agents

### Communication
- **Langue** : français.
- **Niveau de vulgarisation** : élevé. Pour chaque concept technique nouveau, fournir une explication courte ("Docker = conteneur qui isole une application et toutes ses dépendances, comme une boîte hermétique").
- **Pas de présupposés** : ne pas supposer la connaissance préalable d'un outil ou d'une commande.
- **Citer le "pourquoi"** avant le "comment" : expliquer la motivation d'un choix avant les étapes.

### Code
- **Langage principal côté back/data** : Python (3.11+).
- **Bibliothèques privilégiées** : GeoPandas, Shapely, psycopg/SQLAlchemy pour PostGIS, requests pour les API GeoNode.
- **Front** : React fonctionnel (hooks), pas de classes. OpenLayers via `ol`.
- **Style** : PEP 8 côté Python (flake8/black), Prettier + ESLint côté JS/TS.
- **Tests** : pytest côté Python, Vitest côté front. Toute fonction métier non-triviale doit avoir au moins un test.
- **Commentaires** : commenter le "pourquoi" plus que le "quoi". Docstrings sur toutes les fonctions publiques.

### Infrastructure
- **Conteneurisation** : Docker / Docker Compose pour le POC. Kubernetes envisagé plus tard pour l'industrialisation.
- **CI/CD** : GitHub Actions (à mettre en place).
- **Pas de secrets en clair** : tout secret via variables d'environnement, jamais dans le code ni dans Git. Les `.env.sample` ne contiennent QUE des placeholders.

### Documentation
- **Doc technique** : dans le dépôt, en Markdown, dossier `docs/`.
- **ADR** (Architecture Decision Records) : dans `docs/adr/`, un fichier par décision structurante, numéroté.
- **README** : doit permettre à un nouveau venu de lancer le projet localement en moins de 15 minutes.

---

## 6. Ce qu'il ne faut PAS faire

- Ne pas proposer de solution Esri ou propriétaire comme alternative — l'objectif est explicitement l'open source.
- Ne pas écrire de code sans expliquer ce qu'il fait, même brièvement.
- Ne pas multiplier les dépendances : préférer ajouter une bibliothèque seulement si elle apporte une vraie valeur.
- Ne pas surdimensionner pour le POC : on cherche d'abord à valider, mais les choix doivent rester compatibles avec une industrialisation future (pas de hacks irréversibles).
- Ne pas modifier directement la branche `master` : passer par une branche dédiée + Pull Request.

---

## 7. Répartition d'usage entre les agents

### Claude Code (dans VS Code) — pour le travail technique
- Écrire et modifier du code
- Lancer les tests
- Faire des PR et revues de code
- Déboguer
- Mettre à jour la doc technique versionnée

### Cowork (application bureautique) — pour le pilotage et le reporting
- Préparer les présentations pour la direction
- Produire les rapports d'avancement (mensuels, comité de pilotage)
- Faire de la veille (comparatif, doc utilisateur)
- Construire des dashboards de suivi
- Audits transverses lisibles pour non-techniques

---

## 8. Glossaire interne (à enrichir)

- **POC** : Preuve de concept, version simplifiée du projet pour valider la faisabilité.
- **OGC** : Open Geospatial Consortium, organisme qui définit les standards d'échange géographiques (WMS, WFS, WCS, CSW).
- **WMS / WFS / WCS** : Services web standardisés pour servir des cartes (image), des objets vectoriels, et des données raster respectivement.
- **CSW** : Catalogue Service for the Web, standard OGC pour publier et rechercher des métadonnées géographiques.
- **CRS / SRID** : Coordinate Reference System / Spatial Reference Identifier. Identifie une projection cartographique (ex : 2154 = Lambert 93).
- **PostGIS** : Extension géospatiale de PostgreSQL, permet de stocker et requêter de la donnée géographique en SQL.
- **geonode-project** : Template officiel pour créer un projet GeoNode personnalisé sans modifier le coeur de GeoNode.

---

## 9. État d'avancement

- [x] POC : déploiement local de GeoNode 5 via Docker Compose (2026-05-04)
- [x] POC : première couche publiée
- [x] POC : front React + OpenLayers minimal avec Map / SearchBar / LayerPanel
- [ ] Nettoyage : retirer les `LayerPanel_old*.jsx` une fois validé
- [ ] ADR 0001 : choix de la stratégie d'organisation des dépôts (geonode-project ?)
- [ ] Migration vers geonode-project (si l'ADR le confirme)
- [ ] CI GitHub Actions (lint + build front + tests)
- [ ] Équipe d'agents IA (sous-agents Claude Code dans `.claude/agents/`)
- [ ] Documentation d'architecture initiale
- [ ] Plan d'industrialisation rédigé

---

*Dernière mise à jour : 2026-05-19*
