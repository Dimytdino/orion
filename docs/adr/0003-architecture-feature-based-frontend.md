# ADR 0003 — Architecture frontend feature-based

**Date** : 2026-05-24
**Statut** : Proposé — **obligatoire avant FE-001B**
**Décideurs** : Directeur équipe géomatique (Dimytdino), architecte SIG Orion
**À valider avant** : exécution du ticket FE-001B (refactor structurel)
**Lié à** : SPEC-2026-001 (sections 5.2, D-02, FE-001B)

---

## Contexte

### La situation actuelle

Le frontend Orion (`orion/front/`) suit aujourd'hui une **structure plate** :

```txt
front/src/
├── App.jsx
├── main.jsx
└── components/
    ├── Map.jsx
    ├── LayerPanel.jsx
    └── SearchBar.jsx
```

Tous les composants vivent dans un même dossier `components/`. La hiérarchie est uniquement par **nature technique** (un composant React = un fichier `.jsx` sous `components/`).

Cette structure :

- **Fonctionne bien** pour un POC à 3 composants.
- **Devient difficile à maintenir** lorsque le frontend grossit : on ne sait plus d'un coup d'œil quel composant appartient à quelle fonctionnalité, où se trouvent les hooks et services associés, ni quelles sont les responsabilités.

### Qu'est-ce qu'une architecture feature-based ?

Plutôt que d'organiser le code **par nature technique** (un dossier `components/`, un dossier `hooks/`, un dossier `services/`), on l'organise **par fonctionnalité métier** (un dossier `map/`, un dossier `layers/`, un dossier `search/`), chacun contenant ses propres composants, hooks et services dédiés.

Analogie : passer d'une organisation "à la française" (tout le linge dans une armoire, toute la vaisselle dans un placard) à une organisation "par pièce" (chaque chambre regroupe ce dont elle a besoin). La première est intuitive quand on a peu d'affaires, la seconde devient indispensable quand le logement s'agrandit.

Concrètement, la cible Orion ressemble à ceci :

```txt
front/src/
├── app/                # bootstrap React (App, providers, routing éventuel)
├── features/
│   ├── map/            # MapView, useMapInstance, mapManager
│   ├── layers/         # LayerPanel, hooks de visibilité
│   └── search/         # SearchBar, hooks de recherche
├── shared/             # composants et utilitaires réutilisables (Button, Spinner, ErrorBox)
└── services/           # adaptateurs vers les services externes (GeoServer, GeoNode, IGN, auth)
```

Trois principes implicites :

1. **Une feature regroupe tout ce qui la concerne** (UI, état local, hooks, types).
2. **Les services parlent au monde extérieur** (HTTP, OGC, auth) et exposent une API stable.
3. **Le `shared/` ne dépend de rien** : composants génériques, constantes, helpers.

### Pourquoi la décision se pose maintenant

Le frontend Orion va grossir au cours du POC (adaptateurs WMS, panneau de couches, recherche, gestion d'erreurs, plus tard MVT, auth, sélection vectorielle…). Si on continue à empiler les composants dans `components/` sans plan, la dette s'installe vite. Le ticket FE-001B propose de basculer maintenant ; il faut acter le pourquoi avant d'exécuter.

---

## Options envisagées

### Option A — Conserver la structure plate

**Description** : continuer à empiler les composants sous `components/`, sans hiérarchie métier.

| Avantages | Inconvénients |
|---|---|
| Aucun travail de refactor | Maintenance qui se dégrade vite |
| Familier, simple | Responsabilités mélangées (UI / logique / services) |
| Pas de réflexion préalable | Faible lisibilité pour les agents IA qui doivent comprendre le projet |
| | Mauvais signal pour la suite (industrialisation difficile) |

**Verdict** : à écarter. Le coût d'un refactor tardif est exponentiel par rapport à un refactor anticipé.

---

### Option B — Architecture feature-based progressive

**Description** : adopter immédiatement la structure `features/`, `shared/`, `services/`, `app/`, en déplaçant les composants existants sans changer leur comportement. Pas de migration TS, pas de refactor métier — uniquement un déplacement structuré.

| Avantages | Inconvénients |
|---|---|
| Séparation claire des responsabilités | Coût initial du refactor (mais maîtrisé : 3 composants à déplacer) |
| Maintenance facilitée à mesure que le code grossit | Plus abstrait que la structure plate pour un POC très petit |
| Meilleure lisibilité pour les agents IA (chaque feature est autonome) | Demande une discipline ("où je mets ce composant ?") |
| Cohérent avec les standards React modernes |  |
| Compatible avec l'industrialisation (Kubernetes, monorepo, etc.) |  |

**Verdict** : meilleur compromis pour Orion. Le coût est faible aujourd'hui (3 composants), l'effort sera disproportionné plus tard.

---

### Option C — Architecture hexagonale / DDD complète

**Description** : adopter une architecture en couches strictes (domaine, application, infrastructure, présentation), inspirée du Domain-Driven Design ou de l'architecture hexagonale.

| Avantages | Inconvénients |
|---|---|
| Robustesse maximale | Coût d'apprentissage et de mise en place disproportionné pour un POC |
| Pertinent pour des systèmes très métier | Plus de fichiers et de couches pour un bénéfice non démontré à cette taille |
| | Risque de sur-ingénierie |

**Verdict** : prématuré. À reconsidérer si la complexité métier croît significativement (édition vectorielle, workflows, etc.).

---

## Décision

**Option retenue : Option B — Architecture feature-based progressive.**

### Pourquoi

Le frontend Orion va grossir, mais reste à taille humaine pendant le POC. Le feature-based offre le bon ratio :

- **Coût immédiat faible** : déplacer 3 composants et mettre à jour leurs imports.
- **Bénéfice immédiat lisible** : chaque agent IA (ou nouveau venu) comprend la structure en quelques secondes.
- **Compatible avec la suite** : MVT, auth Keycloak, sélection vectorielle s'inscriront naturellement dans la même grille (`features/selection/`, etc.).

L'architecture hexagonale est rejetée par principe de proportion : on n'introduit pas de couche dont on n'a pas démontré le besoin.

### Règles d'application

**Périmètre du refactor (FE-001B)**

- Déplacement des composants existants vers `features/{map,layers,search}/`.
- Création des dossiers `shared/`, `services/`, `app/`.
- Mise à jour des imports.
- **Aucune modification fonctionnelle.** L'application doit être strictement identique avant/après.

**Conventions de placement**

- Un composant ou un hook qui n'a de sens que dans une feature → `features/<nom>/`.
- Un composant utilisé par plusieurs features → `shared/components/`.
- Tout appel HTTP ou intégration externe → `services/<système>/`.
- Le bootstrap (App, providers, routing éventuel) → `app/`.

**Ce qui est refusé dans le POC**

- Architecture hexagonale, ports/adapters formalisés.
- Microfrontend.
- State management global lourd (Redux, Zustand global).
- Sur-abstraction des couches.

### Ce que l'on ne décide pas encore ici

- L'utilisation éventuelle d'un router (`react-router`) — question ouverte Q-03 dans SPEC-2026-001.
- L'introduction de `features/selection/`, `features/edit/` — viendront avec les besoins métier.
- La granularité des services (un service par flux OGC vs un par fournisseur) — à affiner au fil de la pratique.

---

## Conséquences

### Accepté

- Création des dossiers `app/`, `features/`, `shared/`, `services/`.
- Déplacement des composants existants.
- Mise à jour des imports.
- Convention "où mets-tu quoi" documentée dans le README front (FE-001C).

### Travail induit

- Exécution de FE-001B (déplacement strict, M selon estimation SPEC).
- Exécution de FE-001C (nettoyage, documentation des conventions, S).
- Mise à jour des imports dans les tests Vitest si certains référencent les anciens chemins.

### Risques résiduels

- **Convention floue à mesure que le projet grossit** : on hésite à placer un composant entre `shared/` et `features/`. Mitigation : ajouter une règle simple dans le README ("utilisé par une seule feature = dans la feature ; utilisé par plusieurs = dans `shared/`") et arbitrer au cas par cas en code review.
- **Imports rompus si on oublie un fichier** : risque temporaire pendant FE-001B. Mitigation : `npm run build` et `npm test` après le refactor avant merge.

---

## Impact sur les tickets de SPEC-2026-001

| Ticket | Impact |
|---|---|
| FE-001B | **Principal** : ce ticket exécute directement la décision. Bloqué tant que cet ADR n'est pas validé. |
| FE-001C | Nettoyage et documentation des conventions issues de cet ADR. |
| FE-002 | La nouvelle structure conditionne l'emplacement de `useMapInstance` (`features/map/hooks/`). |
| FE-005 | `LayerPanel` vit dans `features/layers/`. |
| FE-007 | `QueryClientProvider` posé dans `app/providers.jsx`. |
| FE-010 | `authService` vit dans `services/auth/`. |

---

## Références

- Article de référence sur le feature-based React : <https://www.robinwieruch.de/react-folder-structure/>
- SPEC-2026-001 — sections 5.2, D-02, FE-001B.
- ADR-0001 — précédent ADR du projet (modèle de format).
