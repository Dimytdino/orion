# ADR 0004 — Périmètre d'utilisation de React Query dans Orion

**Date** : 2026-05-24
**Statut** : Proposé — **obligatoire avant FE-007**
**Décideurs** : Directeur équipe géomatique (Dimytdino), architecte SIG Orion
**À valider avant** : exécution du ticket FE-007 (introduction de React Query)
**Lié à** : SPEC-2026-001 (sections 5.3, D-03, FE-007)

---

## Contexte

### Qu'est-ce que React Query ?

**React Query** (officiellement "TanStack Query") est une bibliothèque React qui gère :

- Le **cache** des appels API (on évite de redemander la même donnée deux fois).
- Les **états standardisés** d'un appel : `loading`, `success`, `error`.
- Les **stratégies de fraîcheur** : `staleTime` (au bout de combien de temps une donnée est considérée comme périmée), `refetchInterval` (rafraîchissement périodique).
- La **synchronisation entre composants** : si deux composants demandent la même donnée, un seul appel HTTP est émis et la donnée est partagée.

Analogie : React Query est un **majordome** pour les appels serveur — il évite que chaque composant aille frapper à la porte de l'API en doublon, il garde une réserve de réponses récentes, et il sait quand rafraîchir.

### Pourquoi la question se pose dans Orion

Le frontend Orion doit consommer plusieurs sources de données serveur :

- **APIs métier** : catalogues GeoNode (liste des couches publiées), métadonnées de couche.
- **Recherches** : `pg_featureserv`, recherches attributaires.
- **Services OGC** : `GetCapabilities` GeoServer, légendes WMS (`GetLegendGraphic`).

Pour ces appels, React Query apporte un vrai bénéfice (cache, états standardisés, déduplication des requêtes).

**Mais** Orion a une particularité : il s'appuie aussi sur **OpenLayers**, qui gère son propre univers :

- Sa propre instance (`new Map(...)`).
- Son propre cycle de vie (création, ajout/retrait de couches, démontage).
- Son propre cache de tuiles.
- Ses propres listeners (clic, déplacement, zoom).

Mélanger React Query avec ce monde OpenLayers est **dangereux** :

- React Query déclenche des **rerenders React** quand le cache se rafraîchit. Si l'instance OpenLayers est exposée comme une "donnée React Query", chaque rerender risque de **recréer la carte**.
- React Query suppose que les données sont **rejouables** (on peut refaire la même requête et obtenir le même résultat). Une instance OpenLayers n'est pas rejouable — c'est un objet mutable, vivant.
- Les listeners OpenLayers ajoutés au fil de la vie de la carte ne sont pas du **server state** ; les gérer via React Query ne ferait que les perdre.

Il faut donc **acter une règle de scope** claire avant d'introduire React Query dans le code (FE-007).

---

## Options envisagées

### Option A — Pas de React Query du tout

**Description** : faire les appels API à la main, avec `fetch` direct dans les composants ou via un wrapper minimal, et gérer manuellement `loading` / `error` / cache.

| Avantages | Inconvénients |
|---|---|
| Simplicité immédiate | Duplication des `fetch` dans plusieurs composants |
| Une dépendance de moins | Gestion `loading` / `error` à réécrire à chaque endroit |
| | Cache à gérer à la main (rapidement bricolé) |
| | Pas de déduplication automatique des requêtes |
| | Va à l'encontre des standards React modernes |

**Verdict** : à écarter. Le bénéfice de React Query sur la donnée serveur métier est réel et le coût de la dépendance est faible.

---

### Option B — React Query partout

**Description** : adopter React Query comme **gestionnaire d'état global**, y compris pour l'instance OpenLayers, les couches en mémoire, et l'état cartographique.

| Avantages | Inconvénients |
|---|---|
| Homogénéité apparente du code | Conflit frontal avec le cycle de vie OpenLayers |
| Cache global unifié | Risque de recréation de la carte à chaque rerender |
| | Bugs subtils (double rendu, listeners non nettoyés, perte de l'état OL) |
| | Sur-complexification de cas simples |
| | Mauvaise séparation des responsabilités |

**Verdict** : à écarter. C'est précisément le type d'erreur qui produit les bugs cartographiques les plus difficiles à reproduire.

---

### Option C — React Query limité aux données serveur métier

**Description** : adopter React Query **uniquement** pour ce qu'il sait bien faire : les appels API qui retournent de la donnée serveur cachée, rejouable, et partagée entre composants. **Interdire** son usage pour l'instance OpenLayers et tout ce qui relève du cycle de vie cartographique impératif.

| Avantages | Inconvénients |
|---|---|
| Cache utile là où il a du sens | Demande une discipline d'architecture (la frontière à respecter) |
| Compatibilité préservée avec OpenLayers | |
| Séparation claire entre "ce qui vient du serveur" et "ce qui vit dans le navigateur" | |
| Faible complexité ajoutée | |
| Aligné avec les bonnes pratiques de la communauté React Query | |

**Verdict** : meilleur compromis. La frontière est nette et facilement enseignable.

---

## Décision

**Option retenue : Option C — React Query limité aux données serveur métier.**

### Ce qui est autorisé pour React Query

- **Catalogue GeoNode** : liste des couches publiées, métadonnées.
- **Recherche métier** : `pg_featureserv`, GetFeature, recherche attributaire.
- **Services OGC métadonnées** : `GetCapabilities` GeoServer, `GetLegendGraphic`.
- **APIs REST** métier futures.

Pour ces cas, on crée un **hook dédié** (`useLayersCatalog`, `useFeatureSearch`, `useCapabilities`, etc.) qui appelle `useQuery` avec une `queryKey` stable et un `staleTime` explicite.

### Ce qui est interdit pour React Query

- L'**instance OpenLayers** (`new Map(...)`) — vit dans un `useRef` ou un hook impératif dédié (`useMapInstance`).
- Les **couches OpenLayers en mémoire** (`new TileLayer(...)`, `new VectorLayer(...)`) — gérées par l'instance OL elle-même.
- Les **interactions cartographiques** (clics, survol, sélection vivante) — événements DOM/OL, pas du *server state*.
- Les **listeners OpenLayers** — gérés via `useEffect` avec nettoyage explicite.

### Règles techniques

**Toujours**

- Un **hook dédié** par usage (`useLayersCatalog`, pas `useQuery(...)` directement dans un composant UI).
- Un **`staleTime` explicite** sur chaque `useQuery` (évite les rafraîchissements involontaires).
- Une **stratégie de `retry` contrôlée** (par défaut React Query retente 3 fois ; pour Orion, fixer une valeur explicite par type d'appel).
- **Séparation UI / API** : les composants UI consomment des hooks, pas `fetch`.

**Interdit**

- `fetch` direct dispersé dans les composants UI.
- `QueryClient` utilisé pour stocker l'état cartographique.
- Cache OL stocké dans React Query.
- Mélange de plusieurs sources dans une même `queryKey` (une `queryKey` = une ressource).

### Ce que l'on ne décide pas encore ici

- La stratégie de `refetchOnWindowFocus` (par défaut React Query le fait — à reconsidérer pour les catalogues SIG qui changent peu).
- L'usage éventuel de **React Query Mutations** pour les appels d'écriture (édition, publication de couche) — viendra avec le besoin.
- L'usage de **persistance offline** (`@tanstack/react-query-persist-client`) — non requis en POC.

---

## Conséquences

### Accepté

- React Query est ajouté au `package.json` du front (FE-007).
- Un `QueryClientProvider` global est posé dans `app/providers.jsx` (squelette préparé en FE-001C).
- Un premier hook `useLayersCatalog` est créé pour appeler GeoNode (FE-007).
- La règle de scope est inscrite dans le README front et rappelée en code review.

### Travail induit

- Exécution de FE-007 (introduction effective de React Query, hook GeoNode, test de mise en cache).
- Mise à jour du README front (FE-001C ou FE-007) pour expliquer la règle de scope.
- Code review attentive : pas de `useQuery` direct dans un composant UI, pas de référence à l'instance OL dans une `queryKey`.

### Risques résiduels

- **Frontière contournée par inadvertance** : un développeur pressé pourrait stocker une référence OL dans un `useQuery`. Mitigation : règle inscrite dans le README + vérification systématique en code review + exemple "à ne pas faire" documenté.
- **`staleTime` mal réglé** : un `staleTime` trop court entraîne des rafraîchissements inutiles ; trop long, des données périmées affichées. Mitigation : commencer à 5 minutes pour les catalogues et ajuster avec l'usage.
- **Recréation involontaire de hooks** : si un hook React Query est utilisé dans un composant qui se monte/démonte fréquemment, le cache joue son rôle, mais les rerenders peuvent surprendre. Mitigation : convention "un hook par usage stable, pas dans une condition".

---

## Impact sur les tickets de SPEC-2026-001

| Ticket | Impact |
|---|---|
| FE-007 | **Principal** : ce ticket exécute la décision (installation React Query, provider, premier hook). Bloqué tant que cet ADR n'est pas validé. |
| FE-003 | Indirect : la centralisation des `LayerConfig` est compatible — la liste statique reste un objet JS, pas une donnée React Query. |
| FE-005 | Indirect : `LayerPanel` consommera plus tard `useLayersCatalog` (FE-007) pour le catalogue dynamique GeoNode. |
| FE-002 | **Aucun usage de React Query** pour gérer l'instance OL. La carte vit dans un `useRef` au sein de `useMapInstance`. |

---

## Références

- Documentation officielle React Query (TanStack Query) : <https://tanstack.com/query/latest>
- "When should I use React Query" — guide officiel : <https://tanstack.com/query/latest/docs/framework/react/guides/does-this-replace-client-state>
- SPEC-2026-001 — sections 5.3, D-03, FE-007.
- ADR-0003 — l'architecture feature-based prévoit l'emplacement des hooks (`features/<nom>/hooks/`).
