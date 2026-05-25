---
id: SPEC-2026-001
titre: Frontend cartographique Orion — POC
version: 0.3
statut: Brouillon avancé
type: hybride-poc
date_creation: 2026-05-23
date_derniere_modif: 2026-05-24
auteur: Équipe Orion (assemblage Cowork + relecture + intégration v0.3)
demandeur: Direction géomatique
issue_de: "(non séparé — document hybride POC)"
valide_par_metier:
  nom: "Dimitry"
  date: "24/05/2026"
valide_par_tech:
  nom: "Dimitry"
  date: "24/05/2026"
adr_lies:
  - ADR-0002
  - ADR-0003
  - ADR-0004
tags:
  - SIG
  - frontend
  - openlayers
  - react
  - poc
  - lambert93
---

# SPEC-2026-001 — Frontend cartographique Orion (POC)

> **Notice de lecture.**
> Ce document est un **hybride POC** balisé (chemin B de la méthodologie Orion) : il assume à la fois le rôle de fiche de besoin (sections 1 à 4) et de spécification fonctionnelle (sections 5 et suivantes). Cette tolérance est explicitement réservée à la phase POC. À l'industrialisation, ce document sera scindé en un `BES-XXX` et un `SPEC-XXX` distincts.
> Toute décision marquée `⟦INFÉRÉ — à valider⟧` n'a pas été explicitement validée par le demandeur et reste à confirmer. Les questions ouvertes sont listées en section 18.
> **Statut `Brouillon avancé`** : le document est techniquement cohérent et exploitable par les agents de développement ; il nécessite encore la validation métier (`valide_par_metier`) et la validation architecture (`valide_par_tech`) avant d'être figé.

---

## 0. Glossaire

Pour rendre ce document autonome, tous les termes techniques utilisés plus bas sont définis ici, même s'ils figurent déjà dans le glossaire projet (`orion/CLAUDE.md`).

| Terme | Définition |
|---|---|
| **ADR** | *Architecture Decision Record* — fichier court qui acte une décision structurante (le pourquoi, les options, le choix). Vit dans `orion/docs/adr/`. |
| **BES** | Fiche de besoin métier (préfixe `BES-AAAA-NNN`). Décrit le problème à résoudre, pas la solution. |
| **CSS Modules** | Mécanisme qui scope les classes CSS à un composant : la classe `.button` d'un module ne peut pas entrer en collision avec celle d'un autre. Évite les conflits de style. |
| **CRS / SRID** | *Coordinate Reference System* / *Spatial Reference Identifier*. Identifiant d'une projection (ex : 2154 = Lambert 93). |
| **COG** | *Cloud Optimized GeoTIFF* — format raster optimisé pour la lecture partielle via HTTP. |
| **DoD** | *Definition of Done* — liste de critères qui qualifient un ticket comme terminé. |
| **EPSG:2154** | Lambert 93 — projection métier en France métropolitaine. **Projection principale d'Orion (vue et données).** |
| **EPSG:3857** | Web Mercator — projection standard des fonds web (Google, OSM, etc.). Dans Orion : projection *secondaire*, à savoir traiter si une couche tierce y est exposée. |
| **EPSG:4326** | WGS 84 — coordonnées géographiques en degrés (longitude/latitude). Souvent attendu en entrée des APIs (GPS), rarement adapté pour l'affichage. |
| **GeoNode** | Plateforme géospatiale open source basée sur Django ; portail + catalogue + intégration GeoServer. |
| **GeoServer** | Serveur OGC open source ; expose les couches en WMS / WFS / WMTS. |
| **Géoportail (IGN)** | Plateforme cartographique nationale française gérée par l'IGN. Dans Orion : source du fond de carte (Plan IGN, WMTS Lambert 93). URL actuelle : `https://data.geopf.fr/`. |
| **GetFeatureInfo** | Requête WMS qui retourne les attributs d'un point cliqué sur la carte. |
| **JSDoc** | Système de commentaires Javascript qui décrit les types ; lu par l'éditeur pour fournir l'autocomplétion sans imposer TypeScript. |
| **Keycloak** | Serveur d'identité open source (gestion utilisateurs, SSO, OAuth/OIDC). |
| **MVT** | *Mapbox Vector Tile* — format de tuiles vectorielles, adapté aux gros volumes (rendu côté client). |
| **OGC** | *Open Geospatial Consortium* — organisme qui standardise les protocoles géographiques (WMS, WFS, WMTS, WCS, CSW). |
| **OSM** | *OpenStreetMap* — fond de carte communautaire ouvert. Dans Orion : fallback en environnement de développement uniquement, jamais en production. |
| **OWS** | *OGC Web Services* — endpoint racine qui multiplexe WMS, WFS, WMTS sur la même URL. |
| **Plan IGN** | Fond de carte vectoriel-rendu de l'IGN, servi en WMTS, disponible en Lambert 93 (entre autres). Couche Géoportail : `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` ⟦À VÉRIFIER au moment du branchement⟧. |
| **proj4** | Bibliothèque JavaScript de transformations de projections. Utilisée avec OpenLayers pour gérer EPSG:2154. |
| **pg_featureserv** | Serveur léger qui expose les tables PostGIS en API REST (GeoJSON). |
| **pg_tileserv** | Serveur léger qui expose les tables PostGIS en tuiles vectorielles MVT. |
| **PostGIS** | Extension géospatiale de PostgreSQL. |
| **React Query** | Bibliothèque React qui gère le cache, les états de chargement et les erreurs des appels API serveur. Voir section 5 et ADR-0004 pour la règle de scope dans Orion. |
| **RGAA** | *Référentiel Général d'Amélioration de l'Accessibilité* — norme d'accessibilité française. |
| **RLS** | *Row-Level Security* — mécanisme PostgreSQL filtrant les lignes accessibles selon l'utilisateur connecté. |
| **SLD** | *Styled Layer Descriptor* — format XML OGC de définition de styles cartographiques. |
| **SPEC** | Spécification fonctionnelle détaillée (préfixe `SPEC-AAAA-NNN`). |
| **Titiler** | Service dynamique de rendu de tuiles à partir de COG/STAC. |
| **Vitest** | Framework de test pour les projets Vite. Choisi pour le front Orion. |
| **WCS** | *Web Coverage Service* — service OGC pour télécharger de la donnée raster brute. |
| **WFS** | *Web Feature Service* — service OGC pour récupérer des objets vectoriels avec leurs attributs. |
| **WMS** | *Web Map Service* — service OGC servant des images cartographiques rasterisées. |
| **WMTS** | *Web Map Tile Service* — service OGC servant des tuiles pré-générées (plus rapide que WMS). |

---

## 1. Compréhension du besoin métier

Le projet Orion vise à remplacer progressivement les interfaces cartographiques Esri par un frontend web open source, basé sur React et OpenLayers.

Ce frontend doit permettre aux utilisateurs métier de **consulter, rechercher et interagir** avec des données géographiques publiées par la plateforme Orion : GeoNode, GeoServer, PostgreSQL/PostGIS, pg_featureserv, pg_tileserv et, à terme, des services raster spécialisés.

La phase actuelle est un POC. L'objectif n'est donc pas de construire immédiatement un portail SIG complet, mais de poser une **base saine, maintenable et extensible**, sur laquelle on pourra greffer les fonctionnalités métier au fur et à mesure de la validation des cas d'usage.

---

## 2. Objectifs frontend

### 2.1 Objectifs principaux (vision long terme)

1. Afficher une carte OpenLayers dans une application React, **en projection EPSG:2154**.
2. Consommer des flux SIG standards : WMS, WFS, WMTS et MVT selon les usages.
3. Gérer explicitement les projections **EPSG:2154** (principale) et **EPSG:3857** (secondaire, en lecture).
4. Structurer le code frontend de façon maintenable, **feature-based** (voir ADR-0003).
5. Préparer l'intégration avec l'authentification et les permissions.
6. Fournir une expérience simple pour des utilisateurs non développeurs.

### 2.2 Objectifs POC (cette spec)

- Affichage cartographique stable, vue en Lambert 93.
- Fond de carte par défaut : **Plan IGN Géoportail** (WMTS Lambert 93), avec **fallback gracieux** si la clé IGN est indisponible (cf. 7.2).
- Ajout et retrait de couches sans recréer la carte.
- Consultation de couches WMS GeoServer (couches métier).
- Refactor de la structure existante vers une organisation feature-based (tickets FE-001A/B/C — découpage progressif).
- Préparation de l'intégration future WFS / MVT.
- Gestion minimale et compréhensible des erreurs de service.

### 2.3 Objectifs production (hors POC)

- Authentification Keycloak.
- Gestion fine des permissions par utilisateur et par couche.
- Catalogue de couches filtré selon les droits.
- Support robuste des flux WMS, WMTS, WFS et MVT.
- Optimisation pour gros volumes vectoriels (MVT).
- Observabilité frontend minimale : logs, erreurs, temps de chargement.
- Accessibilité renforcée RGAA 4.1.

---

## 3. Acteurs et rôles

| Rôle | Description | Permissions POC | Permissions production |
|---|---|---|---|
| **Lecteur** | Consulte les cartes et couches publiées | Lecture toutes couches POC | Lecture couches autorisées |
| **Technicien** | Consulte et prépare des analyses métier | Lecture, sélection, recherche | Lecture, recherche, édition contrôlée |
| **Administrateur SIG** | Configure les couches, vérifie les services | Configuration locale simple | Administration des couches, droits, métadonnées |
| **Développeur frontend** | Implémente les composants React/OpenLayers | Accès code et endpoints locaux | Accès environnements dev/staging |

---

## 4. Périmètre fonctionnel

### 4.1 Inclus POC

- Carte OpenLayers intégrée dans React, **vue en EPSG:2154**.
- Fond de carte **Plan IGN Géoportail** (WMTS Lambert 93), affiché par défaut, avec fallback gracieux.
- Panneau de couches avec activation / désactivation.
- Affichage de couches WMS GeoServer (couches métier).
- Configuration centralisée des couches.
- Gestion des états de chargement et d'erreur (messages utilisateur génériques).
- Séparation logique UI / logique cartographique.
- Premiers appels API métier via React Query (cf. section 5.3, ADR-0004).
- Refactor structurel `components/` → `features/` en trois sous-tickets (FE-001A Vitest, FE-001B refactor, FE-001C nettoyage).

### 4.2 Hors-périmètre POC (explicite)

- **Édition géographique des objets** (création, modification de géométrie, modification d'attributs, suppression) — cadrée dans **BES-2026-001** (`docs/besoins/BES-2026-001-edition-couches-frontend.md`, statut `Brouillon` au 2026-05-24). Ce besoin sera traité dans une SPEC ultérieure ou un amendement à SPEC-2026-001, **après validation du BES**. Aucune ligne de code d'édition n'est exécutée tant que le BES n'est pas en statut `Validé` et qu'un ADR n'a pas tranché le protocole (WFS-T attendu).
- **Réorganisation du panneau de couches au-delà de l'activation/désactivation** (réordonnancement par glisser-déposer, slider d'opacité) — également cadrée dans **BES-2026-001**, scope « manipulation du panneau ». Le POC actuel se limite à l'activation/désactivation (cf. 4.1).
- Workflows métier complexes.
- Synchronisation mobile terrain et mode offline.
- Table attributaire avancée.
- Impression cartographique réglementaire.
- Gestion complète des droits côté frontend.
- Monitoring frontend avancé.
- Migration vers TypeScript (réservée à l'industrialisation — voir ADR-0002).
- Catégorisation détaillée des messages d'erreur (POC = message générique unique ; production = messages contextualisés par code).

### 4.3 Inclus production cible (référence, hors POC)

- Authentification Keycloak.
- Filtrage des couches selon permissions backend.
- Sélection d'objets vectoriels.
- Recherche attributaire et spatiale.
- Consommation MVT pour gros volumes.
- WMTS pour fonds raster performants (en plus du Plan IGN).
- WFS ou API REST pour consultation détaillée.
- **Édition contrôlée si besoin métier validé** — désormais cadrée dans **BES-2026-001**. Le besoin n'est plus seulement « si validé » : il a été acté par la direction géomatique le 2026-05-24 et un BES est ouvert pour l'instruire. Sa concrétisation reste hors POC.

---

## 5. Architecture frontend cible

### 5.1 Stack retenue (POC)

- **React 19** (composants fonctionnels et hooks uniquement, pas de classes).
- **JavaScript / JSX** — TypeScript reporté à l'industrialisation (voir ADR-0002).
- **OpenLayers 10** (`ol` npm package).
- **proj4** + **ol/proj/proj4** pour l'enregistrement d'EPSG:2154.
- **React Query** — utilisé selon la règle de scope ci-dessous (5.3 et ADR-0004).
- **CSS Modules** comme convention de styling (décision POC, à reconsidérer à l'industrialisation si besoin).
- **Vite 8** (déjà en place).
- **Vitest** pour les tests unitaires et d'intégration légers (introduit dans FE-001A, avant tout refactor).
- **Fond de carte par défaut** : Plan IGN Géoportail (WMTS Lambert 93) — voir 5.5 et 7.2.

### 5.2 Structure cible (feature-based — voir ADR-0003)

```txt
front/src/
├── app/
│   ├── App.jsx
│   ├── router.jsx        ⟦INFÉRÉ — à valider⟧ : besoin réel de routing en POC ?
│   └── providers.jsx     # QueryClientProvider, etc.
├── features/
│   ├── map/              # MapView, hooks et services OL
│   ├── layers/           # LayerPanel, gestion visibilité
│   └── search/           # SearchBar, hooks de recherche
├── shared/
│   ├── components/       # composants réutilisables (Button, Spinner, ErrorBox…)
│   ├── constants/        # projections.js, view.js, layers.js
│   └── utils/
├── services/
│   ├── geoserver/        # adaptateurs WMS, GetCapabilities, GetFeatureInfo
│   ├── geonode/          # catalogue, métadonnées
│   ├── ign-geoportail/   # adaptateur Plan IGN (WMTS)
│   ├── pgfeatureserv/    # recherche d'objets
│   ├── pgtileserv/       # tuiles MVT
│   └── auth/             # abstraction authService (POC: factice)
└── styles/               # styles globaux, variables CSS
```

> Migration : la structure actuelle est plate (`front/src/components/Map.jsx`, etc.). Les tickets **FE-001A / FE-001B / FE-001C** prennent en charge le découpage progressif : (A) introduction de Vitest sans refactor, (B) déplacement vers `features/` sans changement fonctionnel, (C) nettoyage et conventions documentées.

### 5.3 Règle de scope React Query (décision projet — voir ADR-0004)

React Query est **exclusivement** utilisé pour les **données serveur métier** :

- Catalogue GeoNode (liste des couches publiées, métadonnées).
- Résultats de recherche (pg_featureserv, GetFeature, recherche attributaire).
- Légendes WMS dynamiques (GetLegendGraphic), capacités OGC (GetCapabilities).

React Query **n'est jamais utilisé pour** :

- L'instance OpenLayers (vit dans un `useRef` ou un hook impératif dédié).
- Les couches OpenLayers en mémoire (gérées par l'instance OL elle-même).
- Les interactions cartographiques (clics, survol, sélection vivante) — événements DOM/OL, pas du *server state*.

**Pourquoi cette frontière** : React Query est conçu pour la donnée serveur cachée et rejouable. OpenLayers gère son propre cycle de vie impératif ; le mélanger avec React Query produit des bugs subtils (double rendu, listeners non nettoyés, perte d'état). La règle évite la dérive. Voir ADR-0004 pour la décision complète.

### 5.4 Principes de conception transverses

- Les composants React ne doivent pas contenir directement de logique OpenLayers complexe.
- La création de la carte, des couches et des interactions est isolée dans des **hooks ou services dédiés** (pattern *map manager*).
- Les appels API métier passent par React Query (et lui seul, cf. 5.3).
- La configuration des couches est **centralisée** (un seul fichier).
- Les projections sont **déclarées explicitement** dans un module dédié (cf. 7.1).
- Les listeners OpenLayers sont **nettoyés** à la destruction des composants (vérifiable, cf. CA-05).

### 5.5 Vue par défaut

```js
// front/src/shared/constants/view.js
export const DEFAULT_VIEW = {
  projection: 'EPSG:2154',
  // Étendue approximative de la France métropolitaine en Lambert 93.
  // Utilisée pour `view.fit(extent)` au démarrage : s'adapte à la taille
  // de l'écran sans dépendre d'un niveau de zoom arbitraire.
  extentFranceMetro: [100000, 6100000, 1250000, 7200000],
  center: [700000, 6600000], // origine Lambert 93, repère
};
```

Au montage de `MapView`, on appelle `view.fit(DEFAULT_VIEW.extentFranceMetro, { size: map.getSize() })` plutôt que `setZoom`/`setCenter`, parce que `view.fit()` s'adapte automatiquement à la taille réelle de l'écran (mobile, écran vertical, etc.).

---

## 6. Modules fonctionnels

### 6.1 Module Carte (`features/map/`)

**Objectif** : afficher une carte interactive stable, performante et maintenable, en Lambert 93, avec le Plan IGN comme fond.

**Fonctionnalités POC**
- Initialiser une carte OpenLayers (une seule fois par montage).
- Vue par défaut : projection EPSG:2154, `view.fit()` sur l'étendue France métro (cf. 5.5).
- Afficher le **Plan IGN Géoportail (WMTS Lambert 93)** comme fond par défaut.
- Si le Plan IGN est indisponible, appliquer le fallback défini en 7.2.
- Afficher une ou plusieurs couches WMS métier par-dessus.
- Gérer zoom, déplacement, recentrage.
- Afficher un message utilisateur si la carte ne peut pas être initialisée (cf. CA-04, message générique).

**Fonctionnalités production**
- Fonds de carte multiples (Plan IGN, Photo aérienne, Scan 25…).
- Sauvegarde du contexte carte (centre, zoom, couches visibles).
- Gestion avancée des projections.
- Gestion de styles vectoriels dynamiques.
- Support MVT et WMTS étendu.

**Règles de gestion**
- La carte ne doit être créée qu'**une seule fois** par montage de composant.
- Les couches doivent pouvoir être ajoutées ou retirées **sans recréer toute la carte**.
- Les projections EPSG:2154 (principal) et EPSG:3857 (secondaire) doivent être documentées et testées.

### 6.2 Module Couches (`features/layers/`)

**Objectif** : permettre à l'utilisateur d'activer, désactiver et comprendre les couches disponibles.

**Fonctionnalités POC**
- Liste simple des couches configurées (hors fond IGN, géré séparément).
- Activation / désactivation.
- Affichage état : actif, en chargement, en erreur.
- Nom métier lisible (pas le nom technique GeoServer).

**Fonctionnalités production**
- Groupes de couches.
- Recherche dans le catalogue.
- Métadonnées GeoNode visibles.
- Légendes WMS dynamiques.
- Filtrage selon droits utilisateur (depuis backend).
- Ordre d'affichage configurable (drag & drop).

**Modèle de données — configuration d'une couche**

Objet `LayerConfig` (décrit ici en JSDoc, à formaliser en JS dans `shared/constants/layers.js`) :

```js
/**
 * @typedef {Object} LayerConfig
 * @property {string} id                  - identifiant interne unique
 * @property {string} title               - nom lisible affiché à l'utilisateur
 * @property {'WMS'|'WMTS'|'WFS'|'MVT'} type
 * @property {string} url                 - URL du service (sans paramètres OGC)
 * @property {string} [layerName]         - nom technique pour WMS/WFS/WMTS
 * @property {'EPSG:2154'|'EPSG:3857'} projection
 * @property {boolean} visibleByDefault
 * @property {number} [opacity]           - 0 à 1
 * @property {number} [minZoom]
 * @property {number} [maxZoom]
 */
```

### 6.3 Module Recherche (`features/search/`)

**Objectif** : permettre à l'utilisateur de retrouver rapidement une donnée ou une zone.

**Fonctionnalités POC**
- Barre de recherche simple.
- Recherche mockée ou branchée sur un endpoint simple (pg_featureserv ou API GeoNode).
- Zoom vers un résultat.

**Fonctionnalités production**
- Recherche attributaire via API.
- Recherche spatiale via PostGIS.
- Pagination serveur.
- Filtrage par couche.
- Gestion des résultats multiples.
- Historique local optionnel.

**Contraintes**
- Ne pas charger massivement les données côté navigateur.
- Privilégier les filtres serveur (pas de filtrage post-fetch sur de gros volumes).
- Prévoir des index spatiaux côté backend.

### 6.4 Module Sélection d'objet (sera dans `features/selection/` à terme)

**POC** : optionnel ; peut se limiter à `GetFeatureInfo` WMS.
**Production** : sélection vectorielle, appel API détail par identifiant métier, fiche attributaire, gestion droits.

### 6.5 Module Authentification et permissions

**Objectif** : préparer l'intégration des droits sans baser la sécurité sur le frontend.

**POC** : pas d'obligation Keycloak si le POC reste local ; prévoir une **interface abstraite** `authService` qui pourra être branchée plus tard.
**Production** : connexion Keycloak, transmission du token aux APIs, couches visibles selon droits renvoyés par backend. **Les permissions critiques sont appliquées côté base/API, pas uniquement côté React.**

---

## 7. Contraintes SIG

### 7.1 Projections

**Projection principale (vue + données)** : **EPSG:2154 — Lambert 93**.
**Projection secondaire (lecture)** : **EPSG:3857 — Web Mercator**, à savoir traiter si une couche tierce y est exposée (par ex. un fond OSM en cas de fallback dev).

**Règles**
- Ne **jamais supposer** que toutes les données sont en EPSG:4326.
- Déclarer et enregistrer les projections dans `shared/constants/projections.js` **avant** l'initialisation de la carte (sinon OpenLayers ne sait pas calculer les résolutions).
- Tester l'invertibilité de la transformation EPSG:4326 ⇄ EPSG:2154 sur un point connu (cf. CA-03).
- **Documenter la projection attendue pour chaque couche** dans `LayerConfig`.

### 7.2 Fond de carte par défaut et fallback

Le fond de carte par défaut du POC est le **Plan IGN** servi par le Géoportail IGN en WMTS Lambert 93.

**Configuration cible**
- **Endpoint** : `https://data.geopf.fr/wmts` ⟦À VÉRIFIER au moment du branchement — l'URL Géoportail a changé en 2024 lors de la migration depuis `wxs.ign.fr`⟧.
- **Layer** : `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` ⟦À VÉRIFIER — alternative : `GEOGRAPHICALGRIDSYSTEMS.PLANIGN`⟧.
- **Style** : `normal`.
- **Format** : `image/png`.
- **TileMatrixSet** : `PM_0_18` ou équivalent Lambert 93 — à figer après lecture du `GetCapabilities` Géoportail.
- **Clé API** : à obtenir auprès du Géoportail IGN ; placée dans `VITE_IGN_GEOPORTAIL_KEY`. Voir question ouverte Q-07.

**Conditions d'usage** : les conditions d'usage Géoportail s'appliquent (mention de la source IGN dans l'attribution de la carte). À vérifier au moment de l'obtention de la clé.

**Règle de fallback (POC)**

Si l'une des conditions suivantes est rencontrée :
- clé `VITE_IGN_GEOPORTAIL_KEY` absente ou invalide,
- quota Géoportail dépassé,
- service Géoportail indisponible,
- erreur WMTS au chargement des tuiles,

alors :
1. l'application **reste fonctionnelle** (la carte s'initialise et les couches métier WMS restent activables) ;
2. un **fond neutre gris** est affiché par défaut ;
3. un fond **OSM** peut être substitué **uniquement en environnement de développement** (`import.meta.env.MODE === 'development'`), à des fins de confort de debug ;
4. un warning console détaillé est émis (cause, URL, code).

**Règle production** : le fallback OSM n'est **pas** une solution de production. En production, l'absence de Plan IGN doit déclencher une alerte d'exploitation et n'autorise que le fond gris neutre.

### 7.3 Flux SIG

| Flux | Usage recommandé | POC | Production |
|---|---|---|---|
| **WMS** | Affichage simple rasterisé (couches GeoServer) | Oui | Oui |
| **WMTS** | Fonds raster tuilés (Plan IGN par défaut) | Oui (fond IGN) | Oui (étendu) |
| **WFS** | Consultation objet / attributs | Limité | Oui, avec pagination |
| **MVT** | Gros volumes vectoriels | Préparer (adaptateur, sans activer) | Oui |

### 7.4 Raster

- Orthophotos et rasters volumineux : privilégier **WMTS** (idéalement Géoportail) ou **COG/Titiler** en production.
- Éviter de charger des images lourdes non tuilées.

### 7.5 Vectoriel

- Quelques objets : WFS ou GeoJSON peuvent suffire.
- Gros volumes : **MVT via pg_tileserv**.
- Éviter les appels WFS massifs sans pagination.

---

## 8. Performance

### 8.1 Objectifs POC

| Élément | Objectif |
|---|---|
| Initialisation carte (jusqu'à 1er rendu du Plan IGN) | < 2 s en local (LAN, fond IGN servi par Géoportail) |
| Activation d'une couche WMS | < 3 s (réseau LAN, GeoServer local) |
| Interaction zoom/pan | Fluide sur jeu de test (60 fps cible) |
| Message d'erreur utilisateur après échec service | Visible en < 5 s |

### 8.2 Objectifs production

| Élément | Objectif |
|---|---|
| Chargement initial application | < 3 s hors réseau lent |
| Changement de visibilité couche | < 1 s hors temps réseau |
| Recherche simple | < 1 s si index présent |
| Gros volumes vectoriels | MVT obligatoire |

### 8.3 Règles techniques

- Ne pas stocker l'instance OpenLayers dans le state React (utiliser `useRef`).
- Limiter les rerenders inutiles (mémo, séparation des composants).
- Nettoyer les listeners au démontage des composants (testable, cf. CA-05).
- Découper les composants par responsabilité (UI vs logique).
- Utiliser React Query pour le cache des appels API métier (cf. 5.3 et ADR-0004).
- Lazy loading des modules non critiques.

---

## 9. Sécurité

### 9.1 POC

- Configuration locale sans secret dans le code.
- URLs d'API et clé Géoportail via variables d'environnement (`VITE_*`, cf. section 11).
- Le fichier `.env` n'est jamais commit ; seul `.env.sample` (avec placeholders) est versionné.
- Aucun contournement de permission côté frontend.

### 9.2 Production

- Authentification Keycloak.
- Autorisations appliquées **côté backend** et base PostGIS (RLS).
- Le frontend masque les actions non autorisées mais **ne constitue pas la barrière de sécurité principale**.
- Gestion des expirations de session.
- Gestion explicite des erreurs 401 et 403.

---

## 10. Accessibilité et UX

### 10.1 POC

- Boutons avec labels explicites.
- Contrastes lisibles.
- États de chargement compréhensibles (spinner + texte).
- Messages d'erreur non techniques (jamais d'exception brute affichée). Message générique unique en POC (cf. CA-04).

### 10.2 Production

- Cible RGAA 4.1.
- Navigation clavier sur tous les panneaux.
- Textes alternatifs et descriptions ARIA appropriées.
- Focus visible.
- Composants accessibles (sémantique HTML respectée).
- Messages d'erreur catégorisés par code (timeout, 4xx, 5xx, indisponible).

---

## 11. APIs et services frontend

### 11.1 Services à prévoir

```txt
front/src/services/
├── geoserver/
│   ├── getCapabilities.js
│   ├── getLegendGraphic.js
│   └── getFeatureInfo.js
├── geonode/
│   ├── getLayers.js
│   └── getLayerMetadata.js
├── ign-geoportail/
│   └── createPlanIgnLayer.js     # adaptateur WMTS Plan IGN
├── pgfeatureserv/
│   ├── searchFeatures.js
│   └── getFeatureById.js
├── pgtileserv/
│   └── getTileJson.js
└── auth/
    └── authService.js             # POC: factice, prod: Keycloak
```

### 11.2 Variables d'environnement (préfixe `VITE_` obligatoire pour Vite)

```txt
VITE_GEONODE_API_URL=http://localhost/api/v2
VITE_GEOSERVER_OWS_URL=http://localhost/geoserver/ows
VITE_PG_FEATURESERV_URL=http://localhost:9000
VITE_PG_TILESERV_URL=http://localhost:7800
VITE_IGN_GEOPORTAIL_KEY=<clé-à-obtenir>
VITE_IGN_GEOPORTAIL_URL=https://data.geopf.fr/wmts
```

Aucune URL ni aucun secret ne doit être en dur dans le code. Le `.env.sample` versionné contient uniquement des placeholders.

---

## 12. Critères d'acceptation globaux

> Format Gherkin (Étant donné / Quand / Alors). Tous les seuils numériques sont issus de la section 8.

### CA-01 — Initialisation carte avec fond Plan IGN

```gherkin
Étant donné l'application chargée pour la première fois (cache navigateur vide)
Et la clé VITE_IGN_GEOPORTAIL_KEY définie dans l'environnement
Quand le composant MapView est monté
Alors une carte OpenLayers est instanciée avec :
  | projection | EPSG:2154                              |
  | rendu      | view.fit(extentFranceMetro)            |
  | extent     | [100000, 6100000, 1250000, 7200000]    |
Et la couche WMTS "Plan IGN" est affichée comme fond, alignée en Lambert 93
Et l'initialisation se termine en moins de 2 s sur poste local (LAN)
Et la console n'émet aucun message de niveau "error" pendant les 3 secondes suivant l'initialisation
```

### CA-02 — Activation d'une couche WMS sans recréation de la carte

```gherkin
Étant donné une couche WMS GeoServer "limites_communales" configurée et accessible
Et la carte est déjà initialisée avec son fond Plan IGN
Et l'instance OpenLayers est conservée dans une référence stable (mapRef.current)
Quand l'utilisateur coche la couche "limites_communales" dans le LayerPanel
Alors une requête HTTP est émise vers VITE_GEOSERVER_OWS_URL
Et la couche apparaît sur la carte en moins de 3 s sur poste local
Et le LayerPanel indique l'état "actif" pour cette couche
Et la référence d'instance OpenLayers (mapRef.current) n'a pas été remplacée (identité préservée)
```

### CA-03 — Cohérence de la projection EPSG:2154 (test d'invertibilité)

```gherkin
Étant donné le module shared/constants/projections.js chargé
Et EPSG:2154 enregistré via proj4 avec la définition standard IGN
Quand on convertit le point de Notre-Dame de Paris [2.349014, 48.852968] (EPSG:4326) vers EPSG:2154
Et qu'on reconvertit immédiatement ce résultat de EPSG:2154 vers EPSG:4326
Alors on retrouve le point d'origine avec une tolérance de ±0.0001° sur longitude et latitude (≈ 10 m au sol)
Et le résultat en EPSG:2154 est dans l'extent France métropolitaine [100000, 6100000, 1250000, 7200000]
```

> Pourquoi ce test plutôt qu'une vérification de valeurs Lambert 93 exactes : les coordonnées projetées dépendent de la définition proj4 utilisée (avec ou sans `towgs84`, par exemple) et peuvent varier de quelques mètres entre implémentations. Tester l'invertibilité valide que la chaîne proj4 → OpenLayers est cohérente sans s'attacher à une valeur arbitraire.

### CA-04 — Service indisponible, message utilisateur générique

```gherkin
Étant donné que le service GeoServer répond par un timeout ou une erreur 5xx
Et qu'une couche WMS "limites_communales" est configurée
Quand l'utilisateur active "limites_communales" dans le LayerPanel
Alors un message utilisateur générique est affiché dans les 5 secondes suivant la tentative
Et le message est : "Le service est temporairement indisponible. Réessayez dans quelques instants."
Et l'application reste utilisable (les autres couches restent activables, la carte reste interactive)
Et aucune exception JavaScript brute n'apparaît à l'utilisateur
Et un log technique détaillé (code, URL, timestamp) est inscrit en console pour le développeur
```

> En production, le message sera contextualisé par code (timeout vs 4xx vs 5xx). En POC, un message générique unique suffit.

### CA-05 — Non-recréation de la carte sur changement de visibilité de couche

```gherkin
Étant donné plusieurs couches configurées et la carte initialisée
Et un compteur d'initialisations de la carte exposé pour test (window.__orionMapInitCount ou équivalent en environnement Vitest)
Quand l'utilisateur active puis désactive successivement 5 couches différentes
Alors le compteur d'initialisations de la carte reste à 1
Et la référence d'instance OpenLayers (mapRef.current) reste la même tout au long
Et aucun listener OpenLayers orphelin n'est détecté après démontage/remontage du composant
Et tous les listeners enregistrés (sur la carte, sur les couches, sur les interactions) sont correctement supprimés au unmount du composant MapView
```

> Évolution v0.3 : la dernière assertion (anciennement "la mémoire navigateur ne croît pas anormalement, vérification manuelle") devient automatisable — on vérifie que les listeners ajoutés à `map`, aux `layers` et aux `interactions` ont bien été retirés au démontage. Un helper de test peut intercepter `addEventListener`/`removeEventListener` d'OpenLayers et comparer les compteurs.

### CA-06 — Configuration de couche absente ou invalide

```gherkin
Étant donné une LayerConfig avec un champ "type" non supporté (ni WMS, ni WMTS, ni WFS, ni MVT)
Quand l'application démarre et tente d'enregistrer cette couche
Alors la couche est ignorée silencieusement (pas de crash)
Et un warning est inscrit en console : "LayerConfig ignorée : type non supporté = <valeur>, id = <id>"
Et le LayerPanel n'affiche pas cette couche
```

### CA-07 — Fallback Plan IGN en cas d'indisponibilité

```gherkin
Étant donné la clé VITE_IGN_GEOPORTAIL_KEY absente ou le service Géoportail répondant en erreur
Quand le composant MapView est monté
Alors la carte est initialisée avec succès en EPSG:2154
Et le Plan IGN n'est pas chargé (aucune tuile IGN demandée)
Et un fond neutre gris est affiché à la place
Et si import.meta.env.MODE === 'development', un fond OSM peut être substitué au fond gris
Et un warning console détaillé est émis (cause : "clé manquante" / "service indisponible" / "erreur WMTS", URL, code)
Et l'utilisateur peut tout de même activer les couches WMS métier configurées
```

---

## 13. Tickets de développement

> Format : ID, type, priorité, estimation (S/M/L), description, contraintes, critère d'acceptation, DoD.
> **Note ADR bloquants** : certains tickets ne peuvent pas démarrer avant validation d'un ADR. Voir tableau en section 15.

### FE-001A — Setup Vitest minimal

**Type** : Tech | **Priorité** : Haute | **Estimation** : S | **ADR bloquant** : aucun

**Description** : introduire Vitest dans le front sans toucher à l'architecture existante. Installation, configuration minimale, premier test santé, script `npm test`, validation en CI GitHub Actions.

**Hors périmètre** : refactor feature-based, déplacement de composants, nettoyage architecture. Ces points sont traités par FE-001B et FE-001C.

**Contraintes**
- Aucune modification fonctionnelle de l'app.
- `npm run build` et `npm run lint` continuent de passer.
- Un test exemple (`expect(1 + 1).toBe(2)`) passe via `npm test`.

**Critère d'acceptation** :
```gherkin
Étant donné la branche FE-001A mergée
Quand on exécute `npm test`
Alors la commande termine en succès (exit code 0)
Et au moins un test exécuté est rapporté
Et la CI GitHub Actions exécute aussi ce test en succès
```
**DoD** : `npm test` passe en local et en CI, configuration `vitest.config.js` versionnée, README front mis à jour avec la commande de test, aucune régression build/lint.

### FE-001B — Refactor structure feature-based

**Type** : Refactor | **Priorité** : Haute | **Estimation** : M | **ADR bloquant** : ADR-0003

**Description** : déplacer les composants existants vers la structure cible décrite en 5.2. Périmètre : `Map.jsx` → `features/map/MapView.jsx`, `LayerPanel.jsx` → `features/layers/LayerPanel.jsx`, `SearchBar.jsx` → `features/search/SearchBar.jsx`, `App.jsx` → `app/App.jsx`. Création des dossiers `shared/`, `services/`, `app/`. Mise à jour de tous les imports.

**Règle absolue**
- **Aucun changement fonctionnel autorisé.** L'application doit faire exactement la même chose qu'avant le refactor.
- Build OK, lint OK, tests Vitest existants OK.

**Critère d'acceptation** :
```gherkin
Étant donné la branche FE-001B mergée
Quand on lance `npm run build`, `npm run lint` et `npm test`
Alors les trois commandes terminent en succès
Et le dossier front/src/features/{map,layers,search}/ contient les composants déplacés
Et l'application affichée dans le navigateur est fonctionnellement identique à avant le refactor
```
**DoD** : refactor mergé, build OK, lint OK, tests OK, captures avant/après comparées, ADR-0003 publié.

### FE-001C — Nettoyage architecture frontend

**Type** : Tech | **Priorité** : Moyenne | **Estimation** : S | **ADR bloquant** : aucun (suit FE-001B)

**Description** : stabiliser la nouvelle structure. Nettoyage des imports morts, rédaction du README frontend, documentation des conventions de dossiers (`features/`, `shared/`, `services/`, `app/`), préparation de l'arborescence pour les providers React Query (FE-007).

**Critère d'acceptation** :
```gherkin
Étant donné FE-001B mergé
Quand FE-001C est mergé
Alors le README front documente la structure feature-based
Et aucun import mort n'est détecté par le linter
Et les conventions de dossiers sont écrites dans le README ou un fichier ARCHITECTURE.md
Et `app/providers.jsx` existe (peut être vide ou contenir seulement un placeholder)
```
**DoD** : documentation à jour, structure stabilisée, conventions écrites, app/providers.jsx prêt à recevoir React Query.

### FE-002 — Stabiliser MapView (OpenLayers dans React)

**Type** : Feature | **Priorité** : Haute | **Estimation** : M | **ADR bloquant** : aucun

**Description** : factoriser l'initialisation OpenLayers dans un hook `useMapInstance` ou un service `mapManager`. Le composant `MapView` consomme ce hook et n'appelle plus directement l'API OL pour l'initialisation. Brancher la vue par défaut (cf. 5.5) et le fond Plan IGN.

**Contraintes SIG**
- Vue en EPSG:2154 (projection enregistrée avant initialisation).
- Fond Plan IGN affiché par défaut (cf. FE-011).
- `view.fit(extentFranceMetro)` au démarrage.
- Ne pas recréer la carte au rerender React.
- Nettoyer les listeners au démontage.

**Critère** : voir CA-01 et CA-05.
**DoD** : carte visible avec Plan IGN, pas d'erreur console, listeners nettoyés (vérifiable via test), instance isolée dans le hook/service.

### FE-003 — Centraliser la configuration des couches

**Type** : Tech | **Priorité** : Haute | **Estimation** : S | **ADR bloquant** : aucun

**Description** : définir `LayerConfig` (cf. 6.2) en JSDoc dans `shared/constants/layers.js`, et créer une configuration initiale pour les couches POC (une couche métier WMS d'exemple, par ex. `limites_communales`).

**Contraintes**
- Type obligatoire : WMS / WMTS / WFS / MVT.
- Projection obligatoire.
- URL via variables d'environnement (`VITE_*`).

**Critère** : voir CA-02 et CA-06.
**DoD** : module créé, JSDoc présente, exemple WMS fonctionnel, configurations invalides ignorées avec warning console.

### FE-004 — Adaptateur WMS GeoServer

**Type** : Feature | **Priorité** : Haute | **Estimation** : M | **ADR bloquant** : aucun

**Description** : créer une fonction `createWmsLayer(config)` qui transforme un `LayerConfig` de type WMS en couche OpenLayers exploitable.

**Contraintes SIG**
- URL OWS GeoServer.
- Support du nom technique de couche.
- Attribution et opacité respectées.
- Gérer les erreurs de chargement (event listener OL → propage vers `useLayerError`).

**Critère** : voir CA-02 et CA-04.
**DoD** : couche visible, activation/désactivation OK, erreur utilisateur affichée.

### FE-005 — Panneau de couches

**Type** : Feature | **Priorité** : Haute | **Estimation** : M | **ADR bloquant** : aucun

**Description** : composant `LayerPanel` listant les couches avec cases à cocher, état de chargement, état d'erreur. Le fond Plan IGN n'est pas listé dans le panneau (toujours visible, géré séparément).

**Critère** : voir CA-02 et CA-05.
**DoD** : UI lisible, navigation clavier possible (Tab + Espace), état synchronisé avec la carte.

### FE-006 — Module projections + test d'invertibilité

**Type** : Tech | **Priorité** : Haute | **Estimation** : S | **ADR bloquant** : aucun

**Description** : module `shared/constants/projections.js` qui déclare et enregistre auprès d'OpenLayers EPSG:2154 (via proj4 et `ol/proj/proj4`). Ajouter un test Vitest qui valide l'invertibilité.

**Contraintes SIG**
- EPSG:2154 obligatoire, déclaré avec `setExtent` et `units: 'm'`.
- Enregistré **avant** toute initialisation de carte (sinon OL ne sait pas calculer les résolutions).
- Documenter (commentaire) pourquoi on ne suppose pas EPSG:4326.

**Critère** : voir CA-03.
**DoD** : module créé, test Vitest CA-03 passe, projections enregistrées avant `MapView`.

### FE-007 — React Query pour les APIs métier

**Type** : Tech | **Priorité** : Moyenne | **Estimation** : S | **ADR bloquant** : ADR-0004

**Description** : installer React Query, créer `QueryClientProvider` global dans `app/providers.jsx`, et un premier hook `useLayersCatalog` qui appelle GeoNode pour lister les couches publiées.

**Contraintes**
- Respecter la **règle de scope** définie en 5.3 et ADR-0004 (jamais pour l'état OL).
- Pas de `fetch` dispersé dans les composants UI.
- Gestion `loading` / `error` standardisée.

**Critère d'acceptation** :
```gherkin
Étant donné useLayersCatalog appelé deux fois (dans deux composants distincts)
Quand le second appel a lieu dans la fenêtre de cache (≤ staleTime)
Alors une seule requête HTTP est émise vers VITE_GEONODE_API_URL
Et les deux composants reçoivent les mêmes données via le cache
```
**DoD** : provider en place, hook fonctionnel, test Vitest de mise en cache, exemple d'usage dans un composant, ADR-0004 publié.

### FE-008 — Préparer l'adaptateur MVT (sans activation)

**Type** : Tech | **Priorité** : Moyenne | **Estimation** : M | **ADR bloquant** : aucun

**Description** : créer `createMvtLayer(config)` à côté de `createWmsLayer`, sans nécessairement avoir pg_tileserv branché. Documenter quand utiliser MVT plutôt que WFS.

**Critère** : adaptateur testable avec un service MVT mocké.
**DoD** : adaptateur créé, type `MVT` accepté par `LayerConfig`, doc technique courte.

### FE-009 — Gestion d'erreurs uniforme

**Type** : Tech | **Priorité** : Moyenne | **Estimation** : S | **ADR bloquant** : aucun

**Description** : mécanisme uniforme de remontée d'erreur (`shared/components/ErrorBox.jsx`, hook `useLayerError`). En POC, un message générique unique (cf. CA-04). En production, message catégorisé.

**Cas couverts (POC)** : service indisponible, couche absente, projection non supportée, timeout. (Permission refusée : ajouté en production.)

**Critère** : voir CA-04.
**DoD** : message générique affiché, application non bloquée, log technique en console, test Vitest sur le cas "service down".

### FE-010 — Abstraction d'authentification

**Type** : Tech | **Priorité** : Basse en POC, Haute en production | **Estimation** : M | **ADR bloquant** : aucun (POC) ; ADR dédié à prévoir pour Keycloak

**Description** : créer une interface `authService` (`services/auth/authService.js`) avec les méthodes `getToken()`, `isAuthenticated()`, `login()`, `logout()`. En POC, implémentation factice (no-op). En production, branchement Keycloak.

**Contraintes**
- Pas de secret frontend.
- Tokens jamais stockés en clair (cookie httpOnly géré par backend, ou storage sécurisé).
- Gestion future 401 / 403 prévue dans la signature.

**Critère d'acceptation** :
```gherkin
Étant donné un composant qui consomme authService
Quand on remplace l'implémentation factice par une implémentation Keycloak (test d'extension)
Alors le composant continue de fonctionner sans modification (le contrat de l'interface est respecté)
```
**DoD** : interface créée, implémentation factice en POC, test Vitest d'extension, doc d'extension.

### FE-011 — Adaptateur Plan IGN Géoportail (WMTS)

**Type** : Feature | **Priorité** : Haute | **Estimation** : S | **ADR bloquant** : aucun

**Description** : créer `services/ign-geoportail/createPlanIgnLayer.js` qui produit une couche WMTS OpenLayers configurée pour le Plan IGN en Lambert 93. La couche est ajoutée par `MapView` comme fond par défaut. Implémente le fallback gracieux défini en 7.2.

**Contraintes**
- URL et clé via variables d'environnement (`VITE_IGN_GEOPORTAIL_URL`, `VITE_IGN_GEOPORTAIL_KEY`).
- Layer, style, format, TileMatrixSet à figer après lecture du `GetCapabilities` Géoportail (cf. 7.2).
- Attribution "© IGN — Géoportail" obligatoire sur la carte (conditions d'usage IGN).
- Fallback : si la clé est absente / invalide, ou si le service est indisponible, retourner `null` (ou équivalent) pour que `MapView` applique le fond gris neutre. En `MODE === 'development'`, autoriser un fond OSM de substitution.

**Critère** : voir CA-01 et CA-07.
**DoD** : Plan IGN visible avec attribution IGN, fallback gracieux testé (clé manquante → fond gris ; mode dev → OSM toléré), test Vitest sur l'instanciation de la couche.

---

## 14. Risques identifiés

| Risque | Impact | Mitigation |
|---|---|---|
| Mauvaise projection | Décalage géographique | Déclaration explicite EPSG, test d'invertibilité (CA-03) |
| WFS massif sur gros volumes | Lenteur navigateur, voire crash | Adaptateur MVT prêt, doc claire sur quand utiliser quoi |
| Logique OpenLayers dispersée | Maintenance difficile | Hooks / services dédiés (`mapManager`) |
| Sécurité uniquement frontend | Faille d'autorisation | Backend + RLS PostGIS comme source de vérité |
| Sur-périmètre POC | Retard, perte de focus | Périmètre 4.1 / 4.2 figé, hors-périmètre explicite |
| Dépendances inutiles | Dette technique, surface d'attaque | Toute nouvelle dépendance fait l'objet d'une discussion |
| Refactor structural (FE-001B) bloque les autres tickets | Retard global | Découpage A/B/C : Vitest part en premier sans dépendance, FE-002 et suivants peuvent avancer en parallèle de B |
| Migration TS reportée puis oubliée | Dette qui grossit silencieusement | Décision tracée dans ADR-0002 + rappel à l'industrialisation |
| Indisponibilité ou changement de politique Géoportail IGN | Carte sans fond | Fallback gracieux (FE-011, CA-07), conditions d'usage relues annuellement |
| Migration URL Géoportail (`wxs.ign.fr` → `data.geopf.fr`) déjà historique mais d'autres migrations possibles | URL en dur cassée | URL via env var (`VITE_IGN_GEOPORTAIL_URL`), pas en dur |
| ADR non validé bloque un ticket prêt à partir | Retard de sprint | Tableau ADR bloquants explicite (section 15), ADR à instruire en amont des sprints concernés |

---

## 15. Synthèse POC / Production et ordre d'exécution

### 15.1 Tableau des ADR bloquants

| ADR | Bloque | Motif |
|---|---|---|
| ADR-0002 | (aucun, informatif) | Trajectoire TS — reportée à l'industrialisation, à acter |
| ADR-0003 | FE-001B | Architecture frontend structurante |
| ADR-0004 | FE-007 | Nouvelle dépendance React Query et pattern de cache |

### 15.2 Sprint 1 — POC visible (objectif : carte exploitable rapidement)

Ordre recommandé :

1. **FE-001A** — Vitest minimal (sans dépendance, peut démarrer immédiatement).
2. **FE-006** — Module projections + test d'invertibilité (EPSG:2154 enregistré).
3. **FE-011** — Adaptateur Plan IGN (fond IGN + fallback).
4. **FE-002** — Stabiliser `MapView` (vue Lambert 93, fond IGN branché).
5. **FE-003** — Centraliser la configuration des couches (`LayerConfig`).
6. **FE-004** — Adaptateur WMS GeoServer.
7. **FE-005** — Panneau de couches.

**Sortie de sprint 1** : une carte Lambert 93 avec Plan IGN, sur laquelle l'utilisateur active/désactive une ou plusieurs couches WMS GeoServer via un panneau lisible. Démontrable.

### 15.3 Sprint 2 — Structuration (objectif : base saine pour la suite)

Ordre recommandé :

8. **FE-001B** — Refactor feature-based (ADR-0003 validé).
9. **FE-001C** — Nettoyage architecture.
10. **FE-009** — Gestion d'erreurs uniforme.
11. **FE-007** — React Query pour les APIs métier (ADR-0004 validé).
12. **FE-008** — Préparation adaptateur MVT (sans activation).
13. **FE-010** — Abstraction `authService`.

**Sortie de sprint 2** : structure feature-based en place, erreurs traitées proprement, React Query opérationnel sur un premier hook métier, MVT et auth préparés sans surdéveloppement.

### 15.4 À réserver à la production

1. Keycloak complet (ADR dédié à prévoir).
2. Permissions fines par couche.
3. RLS PostgreSQL côté données.
4. MVT industrialisé.
5. WMTS étendu (multiples fonds : Photo aérienne, Scan 25…).
6. Accessibilité RGAA 4.1 complète.
7. Observabilité frontend.
8. Migration TypeScript (voir ADR-0002).
9. Catégorisation contextuelle des messages d'erreur.

---

## 16. Décisions prises pour cette spec

| ID | Décision | Réf. |
|---|---|---|
| D-01 | Rester en JSX pour le POC (TypeScript reporté à l'industrialisation) | ADR-0002, sections 4.2 et 5.1 |
| D-02 | Adopter une architecture feature-based dès le POC | ADR-0003, FE-001B |
| D-03 | React Query borné aux données serveur métier (jamais pour l'état OL) | ADR-0004, section 5.3 |
| D-04 | Document hybride POC, scindé à l'industrialisation | Notice de lecture |
| D-05 | Vue OpenLayers en EPSG:2154 (et non EPSG:3857 comme initialement supposé) | Sections 5.5, 6.1, 7.1 |
| D-06 | Fond de carte par défaut : Plan IGN Géoportail (WMTS Lambert 93) | Section 7.2, FE-011 |
| D-07 | Vitest introduit dans FE-001A, avant tout refactor | Section 5.1, FE-001A |
| D-08 | Messages d'erreur génériques en POC, catégorisés en production | Section 4.2, CA-04, FE-009 |
| D-09 | CSS Modules comme convention de styling POC | Section 5.1 |
| D-10 | Test de projection par invertibilité (pas de valeurs Lambert 93 hardcodées) | CA-03, FE-006 |
| D-11 | Fallback explicite Plan IGN : gris neutre par défaut, OSM toléré en dev uniquement | Section 7.2, CA-07, FE-011 |
| D-12 | Découpage de FE-001 en trois sous-tickets (Vitest / refactor / nettoyage) | Section 13, FE-001A/B/C |
| D-13 | ADR formellement bloquants pour les tickets associés (ADR-0003 → FE-001B, ADR-0004 → FE-007) | Section 15.1 |

Les ADR-0002, ADR-0003 et ADR-0004 sont produits en parallèle de cette v0.3 dans `docs/adr/`.

---

## 17. Hypothèses et inférences à valider

Décisions qui ne reposent pas (à ce jour) sur une validation explicite et qui peuvent être révisées sans changer la nature de la spec.

| ID | Hypothèse | Marquage dans le doc | Statut |
|---|---|---|---|
| H-02 | Pas besoin de routing côté SPA pour le POC (une seule page carte) | 5.2 ⟦INFÉRÉ⟧ | À trancher (cf. Q-03) |
| H-06 | URL Géoportail actuelle = `https://data.geopf.fr/wmts` (post-migration 2024) | 7.2 ⟦À VÉRIFIER⟧ | À confirmer au branchement |
| H-07 | Layer Plan IGN = `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` | 7.2 ⟦À VÉRIFIER⟧ | À confirmer via GetCapabilities |
| H-08 | Une clé `essentiels` Géoportail (gratuite) suffit pour le POC | 7.2, Q-07 | À valider auprès de l'IGN |

Hypothèses **résolues** dans cette version : H-01 (CSS Modules — voir D-09), H-03 (TypeScript — voir D-01 et ADR-0002), H-04 (vue par défaut — voir D-05 et section 5.5), H-05 (tolérance projection — voir CA-03).

---

## 18. Questions ouvertes

Questions structurantes qui ne bloquent pas la passe v0.3 mais qu'il faut trancher avant exécution complète.

1. ~~Vue par défaut~~ → résolu (cf. 5.5, D-05).
2. ~~CSS Modules vs Tailwind~~ → résolu (CSS Modules, D-09).
3. **Routing** : a-t-on besoin de `react-router` dès le POC (une seule page carte aujourd'hui) ?
4. **Recherche POC** : on commence avec quel endpoint réel ? pg_featureserv sur une table existante, ou mock en attendant ?
5. ~~Catégorisation des messages d'erreur~~ → résolu (D-08, CA-04).
6. **Premier jeu de données POC** : quelle couche WMS GeoServer servira de référence pour valider CA-01 à CA-05 ? Suggestion : une couche de limites communales (ex. `limites_communales` utilisée en exemple dans CA-02).
7. **Clé API Géoportail IGN** : qui la demande, qui la gère ? Quel tier (essentiels gratuit ou pro) ? Quelles conditions d'usage exactes à respecter (attribution, volumes, etc.) ? **Question bloquante pour FE-011.**
8. **Migration des `.jsx` existants** : on touche au code actuel à l'occasion de FE-001B (juste déplacement) ou on refactore aussi le contenu ? (Voir ADR-0002 pour la trajectoire TS.)
9. **Keycloak — futur** : qui opère l'IAM en production ? Self-hosted ou Keycloak existant côté SI ? **Hors POC.**
10. **Compteur d'initialisations carte (CA-05)** : comment exposer la valeur de manière non intrusive (uniquement en environnement test, pas en production) ? `globalThis.__orionMapInitCount` derrière un guard `import.meta.env.MODE === 'test'` ?
11. **Édition de couches** : le besoin est désormais cadré par **BES-2026-001** (statut `Brouillon` au 2026-05-24, 12 questions ouvertes). Hors scope POC, mais l'instruction du BES doit progresser en parallèle de l'exécution des tickets FE-… pour que la future feature `features/edit/` puisse être conçue sans tout retravailler. Question opératoire : **quand programme-t-on l'entretien complémentaire** sur ce BES ?

---

## 19. Matrice de traçabilité

| Item du périmètre POC (4.1) | Module (section 6) | Ticket(s) (section 13) | Critère(s) d'acceptation |
|---|---|---|---|
| Carte OpenLayers intégrée, vue Lambert 93 | Module Carte (6.1) | FE-002, FE-006 | CA-01, CA-03, CA-05 |
| Fond Plan IGN affiché par défaut + fallback | Module Carte (6.1) | FE-011, FE-002 | CA-01, CA-07 |
| Affichage couches WMS GeoServer | Modules Carte + Couches | FE-003, FE-004, FE-005 | CA-02 |
| Configuration centralisée des couches | — (transverse) | FE-003 | CA-02, CA-06 |
| Refactor `components/` → `features/` + Vitest | — (transverse) | FE-001A, FE-001B, FE-001C | CA dans chaque ticket |
| Gestion des états chargement/erreur | — (transverse) | FE-009, FE-004 | CA-04 |
| Premiers appels API via React Query | Module Couches | FE-007 | CA dans FE-007 |
| Support EPSG:2154 (déclaration + test) | — (transverse) | FE-006 | CA-03 |
| Abstraction authService (préparation) | Module Auth (6.5) | FE-010 | CA dans FE-010 |
| Adaptateur MVT préparé (non activé) | — (transverse) | FE-008 | DoD FE-008 |

Couverture : 100 % des items de 4.1 sont rattachés à au moins un ticket et un critère.

---

## 20. Références techniques (pour les agents de développement)

### 20.1 Code existant à migrer (par FE-001B)

| Élément | Fichier actuel | Cible après FE-001B |
|---|---|---|
| Carte | `front/src/components/Map.jsx` | `front/src/features/map/MapView.jsx` |
| Panneau couches | `front/src/components/LayerPanel.jsx` | `front/src/features/layers/LayerPanel.jsx` |
| Barre recherche | `front/src/components/SearchBar.jsx` | `front/src/features/search/SearchBar.jsx` |
| Point d'entrée | `front/src/App.jsx` | `front/src/app/App.jsx` |
| Bootstrap | `front/src/main.jsx` | inchangé |

### 20.2 Nouveaux fichiers à créer (POC)

- `front/vitest.config.js` (FE-001A)
- `front/src/shared/constants/projections.js` (FE-006)
- `front/src/shared/constants/view.js` (FE-002, valeurs en 5.5)
- `front/src/shared/constants/layers.js` (FE-003)
- `front/src/services/ign-geoportail/createPlanIgnLayer.js` (FE-011)
- `front/src/services/geoserver/createWmsLayer.js` (FE-004)
- `front/src/shared/components/ErrorBox.jsx` (FE-009)
- `front/src/app/providers.jsx` — QueryClientProvider (FE-007, squelette posé en FE-001C)
- `front/src/services/geonode/getLayers.js` + hook `useLayersCatalog` (FE-007)
- `front/src/services/auth/authService.js` (FE-010)
- `front/src/**/*.test.js` — tests Vitest (FE-001A, FE-006, FE-007, etc.)

### 20.3 ADR liés (produits avec cette v0.3)

- `orion/docs/adr/0002-migration-typescript.md` (D-01)
- `orion/docs/adr/0003-architecture-feature-based-frontend.md` (D-02)
- `orion/docs/adr/0004-react-query-scope.md` (D-03)

### 20.4 Documentation OGC et IGN à consulter

- WMS 1.3.0 : <https://www.ogc.org/standard/wms/>
- WMTS 1.0.0 : <https://www.ogc.org/standard/wmts/>
- WFS 2.0.0 : <https://www.ogc.org/standard/wfs/>
- Géoportail IGN — documentation développeur : <https://geoservices.ign.fr/>
- proj4js : <https://github.com/proj4js/proj4js>

---

## 21. Historique des versions

| Version | Date | Auteur | Changement |
|---|---|---|---|
| 0.1 | 2026-05-23 | Cowork + relecture | Création — passe A de mise à niveau du document initial (frontmatter, glossaire, scope React Query, refactor en feature-based, retrait TS, marquage inférences, questions ouvertes, références techniques). Gherkin et matrice de traçabilité placés en placeholders pour la passe B. |
| 0.2 | 2026-05-23 | Cowork + Dimitry | Passe B — intégration des décisions : vue par défaut EPSG:2154 + `view.fit(extentFranceMetro)` (D-05), fond Plan IGN Géoportail WMTS (D-06), Vitest introduit dans FE-001 (D-07), messages d'erreur génériques en POC (D-08), CSS Modules confirmé (D-09), test de projection par invertibilité (D-10). Réécriture concrète des 5 critères d'acceptation + ajout de CA-06. Nouveau ticket FE-011 (adaptateur Plan IGN). Matrice de traçabilité complétée. Nouvelles entrées de glossaire (Géoportail, Plan IGN, proj4, Vitest). 4 nouvelles hypothèses à vérifier (URL Géoportail, layer Plan IGN, clé essentiels, etc.). 4 questions ouvertes résolues, 1 nouvelle (Q-10 sur le compteur d'initialisations). |
| 0.3 | 2026-05-24 | Cowork + relecture externe + Dimitry | Intégration d'une proposition de relecture externe. Découpage de FE-001 en FE-001A / FE-001B / FE-001C (Vitest / refactor / nettoyage) — D-12. Réécriture de la dernière assertion de CA-05 (listeners OL orphelins, automatisable) — remplace le contrôle mémoire manuel. Ajout de CA-07 (fallback Plan IGN). Règle de fallback IGN formalisée en 7.2 (gris neutre par défaut, OSM toléré en dev uniquement) — D-11. Statut bumpé à `Brouillon avancé`. Tableau des ADR bloquants explicite (section 15.1) — D-13. Réorganisation en deux sprints (POC visible / structuration) avec FE-003 remonté en sprint 1 pour préserver la cohérence FE-003 → FE-004 → FE-005. ADR-0002, ADR-0003, ADR-0004 produits dans `docs/adr/` en parallèle. |
| 0.3 (annotation) | 2026-05-24 | Cowork | Annotation marginale (pas de bump de version, pas de changement de scope) : sections 4.2, 4.3 et 18 enrichies pour pointer vers le nouveau **BES-2026-001** (édition des couches affichées + manipulation du panneau au-delà de l'activation/désactivation). Le besoin est désormais cadré par un BES distinct ; le scope POC reste strictement inchangé. |
