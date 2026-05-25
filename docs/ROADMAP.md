# Feuille de route — Projet Orion

> Remplacement de l'infrastructure cartographique Esri par une stack open source.
> Document destiné à l'équipe de direction. Les termes techniques sont expliqués à leur première apparition.

---

## Vue d'ensemble

Le projet Orion migre l'ensemble des outils géomatiques (cartographie, publication de données spatiales, gestion des couches) d'une dépendance à Esri (logiciels propriétaires) vers une infrastructure entièrement open source bâtie autour de **GeoNode 5** — une plateforme web de publication de données géographiques — couplée à une interface cartographique sur mesure développée en React et OpenLayers.

Le projet est aujourd'hui sur deux fronts parallèles :

- un **back-end** (GeoNode + base de données + serveur cartographique) installé en local et stable ;
- un **front-end** (interface utilisateur) en cours de cadrage méthodologique, dont l'exécution attend la validation formelle de sa spécification et de ses décisions d'architecture.

---

## Ce qui est terminé

### Back-end GeoNode (mai 2026)

- **Migration d'architecture** (2026-05-19) : GeoNode est installé comme une **dépendance logicielle** (à la manière d'un module qu'on installe et non d'un code qu'on copie et modifie). Cela permet de recevoir les mises à jour de sécurité de GeoNode sans effort manuel, et de garder les personnalisations d'Orion clairement séparées dans un répertoire dédié (`src/orion_geonode/`).
- **Validation de bout en bout** : dépôt d'un fichier de données géographiques, affichage de la couche sur la carte via le protocole WMS (standard d'échange de cartes sur le web), authentification utilisateur — tout fonctionne.
- **Version figée** (2026-05-20) : GeoNode est désormais attaché à une version précise (identifiant `SHA`), ce qui garantit qu'un redéploiement de l'environnement produit toujours le même résultat.
- **Intégration continue** (2026-05-20) : un robot (GitHub Actions) reconstruit l'image Docker et vérifie automatiquement à chaque modification que la configuration Django est correcte, et qu'au moins quatre points d'entrée critiques de l'application répondent (tests dits *smoke*).
- **Documentation de l'environnement local** (2026-05-20) : un guide permet à un nouveau développeur de remettre la stack debout en local en moins d'une heure.

### Front-end — cadrage méthodologique (semaine du 19 au 24 mai 2026)

- **Spécification fonctionnelle SPEC-2026-001 v0.3** (`docs/specs/`) : le périmètre du frontend cartographique POC est formalisé. Le document couvre les objectifs, l'architecture cible, les modules, les contraintes (projection Lambert 93, accessibilité, sécurité), et une trentaine de tickets de développement avec leur Definition of Done (critère de fin clair). Statut actuel : **Brouillon avancé** — exploitable par les agents de développement, en attente de signatures métier et technique avant exécution.
- **Trois décisions d'architecture (ADR)** extraites de la SPEC et formalisées :
  - **ADR-0002** — migration TypeScript reportée hors POC (rester en JavaScript + JSDoc évite un coût d'apprentissage non justifié à ce stade).
  - **ADR-0003** — adoption d'une architecture **feature-based** (organisation du code par fonctionnalité métier plutôt que par nature technique). Bloque le ticket de refactor structurel.
  - **ADR-0004** — règle d'usage de **React Query** (bibliothèque de gestion du cache des appels serveur) : limitée aux données métier, interdite pour la carte interactive. Bloque le ticket d'introduction de la bibliothèque.

### Méthodologie et outillage agents (24 mai 2026)

- **Skills documentaires** (`.claude/skills/`) : deux procédures d'écriture standardisées créées pour les agents IA — `recueil-besoin` (transformer des notes brutes en fiche de besoin métier) et `spec-fonctionnelle` (transformer une fiche de besoin validée en spécification fonctionnelle détaillée). Calibrées sur SPEC-2026-001 comme référence canonique.
- **Convention de frontmatter** standardisée sur tous les livrables Orion (statut, validation métier, validation technique) — sert de point d'ancrage aux agents pour refuser de produire un livrable aval tant qu'un livrable amont n'est pas signé.
- **Équipe d'agents** (`.claude/agents/`) en place depuis le 19 mai : `architecte-orion`, `dev-geo`, `dev-front`, `relecteur`, `gardien-doc`.

### Premier besoin métier formalisé (24 mai 2026)

- **BES-2026-001 — Édition des couches affichées** (`docs/besoins/`) : premier vrai BES produit via le skill `recueil-besoin`. Couvre deux besoins distincts — l'édition des objets vectoriels (géométrie + attributs) et la manipulation du panneau de couches (ordre, opacité, visibilité). Statut `Brouillon`, 12 questions ouvertes, entretien complémentaire requis avant validation. Pas de scope POC modifié : SPEC-2026-001 a été annotée pour pointer ce BES sans incorporer son contenu.

---

## Ce qui est en cours (bloquant)

### Validation humaine de la SPEC et des ADR

**Pourquoi c'est bloquant.** La SPEC-2026-001 et les ADR-0002 / 0003 / 0004 sont rédigés mais portent encore le statut `Brouillon avancé` (côté SPEC) et `Proposé` (côté ADR). Les ADR-0003 et ADR-0004 portent une mention explicite « obligatoire avant FE-001B » et « obligatoire avant FE-007 ». Tant que ces documents ne sont pas signés (champs `valide_par_metier` et `valide_par_tech` du frontmatter), **aucun ticket de développement front ne peut être exécuté**.

**Ce que cela implique.** Une session de relecture du directeur géomatique (validation métier) et d'un référent technique (validation architecture), puis dépôt de la signature dans le frontmatter de chaque document.

---

## Ce qui est planifié

### Priorité haute — semaines 1 à 2 (après validation)

#### Exécution des tickets de la SPEC frontend

Une fois la SPEC et les ADR validés, dérouler les ~30 tickets `FE-…` dans l'ordre prévu en section 13 de SPEC-2026-001 et en section 15 (synthèse POC / production). Les premiers chantiers sont :

- **FE-001B** — refactor structurel vers l'architecture feature-based (déplacement des composants existants, aucune modification fonctionnelle).
- **FE-001C** — nettoyage post-refactor et documentation des conventions.
- **FE-002** — externalisation propre de l'instance OpenLayers dans un hook dédié.
- **FE-003** — centralisation de la configuration des couches.
- **FE-005** — panneau de couches dynamique.
- **FE-007** — introduction de React Query selon la règle de scope définie dans l'ADR-0004 (premier hook : catalogue GeoNode).

Chaque ticket porte sa Definition of Done dans la SPEC ; l'exécution se fait par les agents `dev-front` (et `dev-geo` selon les besoins back).

#### Instruction du BES-2026-001 (édition des couches)

Le skill `recueil-besoin` a été éprouvé sur le sujet « édition des couches affichées » : **BES-2026-001** existe en statut `Brouillon` mais comporte douze questions ouvertes (qui édite, quelles couches, conflit, audit, etc.). Un entretien complémentaire avec la direction géomatique est nécessaire pour les trancher et passer le BES en `Validé`. Tant que ce n'est pas fait, aucune SPEC d'édition ne peut être ouverte.

#### Premier BES sur un sujet Phase 2 ou Phase 3

Indépendamment du BES-2026-001 (qui concerne le front en cours), il reste à rédiger un BES sur **la passerelle ArcGIS Server** (Phase 2) ou sur **le calepinage solaire** (Phase 3), pour débloquer la condition « BES + ADR préalables » imposée par les Phases 2 et 3.

---

### Priorité planifiable

#### Phase 2 — Intégration ArcGIS Server (date non fixée)

**Pourquoi.** Certains partenaires ou services métier peuvent continuer à s'appuyer sur ArcGIS Server pendant la transition. Une passerelle entre GeoNode et ArcGIS Server assurerait la continuité de service et le partage de données dans les deux sens.

**Condition préalable.** Rédaction d'un **BES** (fiche de besoin métier) précisant les cas d'usage, puis d'un **ADR** précisant le périmètre, les risques et les alternatives. Tant que ces deux livrables n'existent pas, la phase ne démarre pas.

---

#### Phase 3 — Outils métier : calepinage solaire (date non fixée)

**Pourquoi.** Le calepinage solaire est un outil d'analyse spatiale spécifique aux besoins métier de l'équipe géomatique. Son développement s'appuie sur les fondations mises en place dans les phases précédentes.

**Condition préalable.** Stabilisation complète de l'infrastructure (Phase 1 livrée, Phase 2 décidée ou explicitement reportée) **et** rédaction d'un BES + d'un ADR sur l'approche retenue.

---

## Légende des statuts

| Statut | Signification |
|---|---|
| Terminé | Livré et validé en conditions réelles |
| En cours (bloquant) | Travail actif qui bloque l'exécution de la suite |
| Planifié — semaines 1-2 | À enclencher dès la levée du blocage en cours |
| Planifiable | Décidé, date à fixer selon les priorités |
| Conditionnel | Ne peut démarrer qu'après une décision formelle (BES + ADR) |

---

*Dernière mise à jour : 2026-05-24 — par l'agent `gardien-doc` (Projet Orion)*
