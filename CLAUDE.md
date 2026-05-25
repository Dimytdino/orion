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

- **`orion`** (ce repo, `github.com/Dimytdino/orion`) : front React/OpenLayers + documentation + agents et skills Claude Code.
  - `front/` — application cartographique React/OpenLayers
  - `docs/adr/` — décisions d'architecture (ADR)
  - `docs/specs/` — spécifications fonctionnelles détaillées (SPEC)
  - `docs/besoins/` — fiches de besoin métier (BES) — dossier à créer dès le premier BES
  - `docs/journal/` — journaux de session (`JOURNAL_AAAA-MM-JJ.md`)
  - `docs/ROADMAP.md` — feuille de route du projet
  - `.claude/agents/` — équipe d'agents Claude Code (`architecte-orion`, `dev-geo`, `dev-front`, `relecteur`, `gardien-doc`)
  - `.claude/skills/` — skills documentaires (`recueil-besoin`, `spec-fonctionnelle`) calibrés sur SPEC-2026-001
- **`orion-geonode`** (`github.com/Dimytdino/orion-geonode`) : back-end GeoNode — **source de vérité pour l'infra**.
  - GeoNode est une **dépendance pip** (pas un fork), installée depuis un SHA figé
  - Customisations Orion dans `src/orion_geonode/` (module Django dédié)
  - `docker-compose.yml` à la racine = source de vérité pour démarrer la stack
  - CI GitHub Actions : build image + smoke tests (4 endpoints)

**ADR 0001** (implémenté le 2026-05-19) : choix de la structure geonode-project. Voir `docs/adr/0001-strategie-geonode-project.md`.

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
- **Journaux de session** : dans `docs/journal/`, un fichier `JOURNAL_AAAA-MM-JJ.md` par journée de travail significative. Permet aux différents outils (Cowork, Claude Code dans VS Code, autres agents) de savoir ce qui a été fait et ce qui reste à faire entre les sessions. Généré par `gardien-doc` à la demande, format défini dans `.claude/agents/gardien-doc.md`.
- **README** : doit permettre à un nouveau venu de lancer le projet localement en moins de 15 minutes.
- **CLAUDE.md** : `orion/CLAUDE.md` est la **source de vérité projet**. `orion-geonode/CLAUDE.md` contient uniquement le contexte technique back-end et renvoie ici. Tout changement structurant (nouveau repo, nouvelle phase, changement d'architecture) doit être répercuté dans les deux fichiers. **Responsable : agent `gardien-doc`.**
- **AGENTS.md** : à la racine de chaque repo, c'est une **façade multi-agents** (Claude, Codex, Cursor, Aider, etc.) qui renvoie vers `CLAUDE.md`. La source de vérité reste `CLAUDE.md` ; `AGENTS.md` ne contient qu'un résumé minimum vital. Doit rester cohérent avec `CLAUDE.md` à chaque modification structurante. **Responsable : agent `gardien-doc`.**

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

### Back-end (`orion-geonode`)

- [x] POC : déploiement local de GeoNode 5 via Docker Compose (2026-05-04)
- [x] POC : première couche publiée, WMS fonctionnel, auth validée
- [x] ADR 0001 : choix de la stratégie geonode-project (2026-05-19)
- [x] Migration vers geonode-project — implémentée dans `orion-geonode` (2026-05-19)
- [x] Version GeoNode figée sur SHA validé (2026-05-20)
- [x] CI GitHub Actions : build image + smoke tests (2026-05-20)
- [x] Doc environnement de développement local (2026-05-20)

### Front-end (`orion/front`) — cadrage méthodologique

- [x] POC visuel initial : Map / SearchBar / LayerPanel
- [x] SPEC-2026-001 v0.3 rédigée (`docs/specs/`) — statut `Brouillon avancé` (2026-05-24)
- [x] ADR 0002 : migration TypeScript différée hors POC (2026-05-24)
- [x] ADR 0003 : architecture feature-based frontend (2026-05-24)
- [x] ADR 0004 : scope React Query limité aux données serveur métier (2026-05-24)
- [ ] **Validation humaine de SPEC-2026-001 et des ADR-0002/0003/0004** (signatures `valide_par_metier` + `valide_par_tech`) — **bloque l'exécution des tickets `FE-…`**
- [ ] Exécution des tickets FE-001B → FE-007 (refactor structurel, hook OL, React Query)

### Méthodologie et agents

- [x] Équipe d'agents IA dans `.claude/agents/` (2026-05-19)
- [x] ROADMAP.md rédigée — refonte à jour au 2026-05-24
- [x] Skills documentaires dans `.claude/skills/` : `recueil-besoin` et `spec-fonctionnelle` (2026-05-24)
- [x] Convention de frontmatter standardisée sur BES / SPEC / ADR (2026-05-24)
- [x] Premier BES réel produit via `recueil-besoin` : **BES-2026-001** (édition des couches affichées, statut `Brouillon`, 12 questions ouvertes — 2026-05-24)
- [ ] Entretien complémentaire sur BES-2026-001 pour résoudre les questions ouvertes et passer en `Validé`

### Phases ultérieures

- [ ] Phase 2 : intégration ArcGIS Server (nécessite BES + ADR préalables)
- [ ] Phase 3 : outils métier calepinage solaire (nécessite BES + ADR préalables)

---

*Dernière mise à jour : 2026-05-24*
