# ADR 0002 — Trajectoire TypeScript pour le frontend Orion

**Date** : 2026-05-24
**Statut** : Proposé — non prioritaire POC
**Décideurs** : Directeur équipe géomatique (Dimytdino), architecte SIG Orion
**À valider avant** : toute introduction de TypeScript dans `orion/front/`
**Lié à** : SPEC-2026-001 (sections 4.2, 5.1, D-01)

---

## Contexte

### Le point de départ

Le frontend Orion (`orion/front/`) est écrit en **JavaScript / JSX** :

- **JavaScript** : le langage du navigateur web. Permissif, dynamique, peu de garde-fous à l'écriture.
- **JSX** : extension de syntaxe de JavaScript portée par React, qui permet d'écrire des balises HTML directement dans le code (`<Button label="Valider" />`). Le fichier est lu par un compilateur (Vite, dans notre cas) qui le transforme en JavaScript pur.

Le conventions projet (cf. `orion/CLAUDE.md`) mentionnent par ailleurs **TypeScript** comme cible long terme :

- **TypeScript (TS / TSX)** : surcouche de JavaScript qui ajoute un **système de types**. À l'écriture, on annote ce qu'une fonction attend et ce qu'elle renvoie ; un compilateur (`tsc`) vérifie la cohérence avant exécution. Erreurs détectées **avant** que le code tourne, autocomplétion plus riche dans l'éditeur, meilleur guidage pour des agents IA qui lisent le code.
- Analogie : passer de JavaScript à TypeScript, c'est passer d'un cahier libre à un cahier à colonnes — on perd un peu de souplesse, on gagne beaucoup en relecture et en correction d'erreurs.

### Pourquoi la décision se pose maintenant

À l'occasion de la mise à niveau de la SFD (SPEC-2026-001), la question revient : faut-il migrer vers TypeScript **dans le cadre du POC**, ou plus tard ?

La question n'est pas neutre :

- Migrer maintenant ralentit le POC (apprentissage, refactor des composants existants, configuration du compilateur, ajustement de l'outillage de tests).
- Ne jamais migrer fait grossir silencieusement une dette : plus le frontend grandit en JSX, plus la bascule sera coûteuse.

Il faut donc **acter une trajectoire**, pas un statu quo implicite.

---

## Options envisagées

### Option A — Migration immédiate vers TypeScript (TSX)

**Description** : convertir tous les fichiers `.jsx` en `.tsx` dès maintenant, ajouter `tsconfig.json`, configurer Vite et Vitest pour TypeScript, typer progressivement les composants et les services.

| Avantages | Inconvénients |
|---|---|
| Typage fort dès le début, moins d'erreurs runtime | Ralentit nettement le POC |
| Meilleur guidage pour les agents IA qui lisent le code | Refactor transversal sur un code qui n'est pas encore stabilisé |
| Robustesse accrue des services et adaptateurs SIG | Charge cognitive supplémentaire pour un POC pédagogique |
| Pas de dette de migration à terme | Risque de typer mal au début (types "any" partout = TS sans bénéfice) |

**Verdict** : prématuré. Le POC sert à valider l'architecture et les choix techniques, pas à atteindre la qualité industrielle.

---

### Option B — Rester durablement en JSX

**Description** : assumer que le frontend reste en JavaScript, sans envisager de migration.

| Avantages | Inconvénients |
|---|---|
| Simplicité maximale | Dette qui grossit avec le projet |
| Aucune dépendance ni outillage supplémentaire | Moins robuste à mesure que le code grossit |
| Pas de coût d'apprentissage | Moins industrialisable (services métier non typés en production) |
| | Pas de guidage IA aussi précis qu'avec TS |
| | Va à l'encontre des conventions projet qui visent l'industrialisation |

**Verdict** : à écarter. Adapté à un script jetable, pas à une plateforme qui vise la production.

---

### Option C — JSX en POC, puis migration progressive

**Description** : conserver JSX pour la phase POC (vélocité, simplicité), et **acter explicitement** une migration progressive vers TypeScript à l'industrialisation. La migration commencerait par les zones à forte valeur de typage (services, modèles de données, contrats d'API) et s'étendrait progressivement aux composants UI.

Pendant la phase POC, on peut ajouter sans douleur du typage léger via **JSDoc** : annoter les types directement dans les commentaires (cf. `LayerConfig` dans SPEC-2026-001 section 6.2). L'éditeur les lit, ils servent d'autocomplétion, sans imposer la conversion en `.tsx`.

| Avantages | Inconvénients |
|---|---|
| POC rapide à mener | Coexistence temporaire JSX/TSX prévue |
| Trajectoire explicite (dette identifiée, pas oubliée) | Nécessite discipline (typage progressif sans tout faire à moitié) |
| Migration faite quand le code est stabilisé (moins de refactor inutile) | |
| JSDoc permet d'amorcer le typage sans coût |  |

**Verdict** : meilleur compromis. Préserve la vélocité POC sans renoncer à la robustesse à terme.

---

## Décision

**Option retenue : Option C — JSX conservé pour le POC, migration TypeScript progressive à l'industrialisation.**

### Pourquoi

Le projet Orion est encore en POC. La priorité est de **valider l'architecture cible** (stack open source, OpenLayers, projections, services OGC) et le **modèle de données** (couches, projections, recherche). Forcer une migration TS maintenant détournerait l'attention de ces validations et ferait porter le coût du refactor à un code qui va lui-même beaucoup bouger.

À l'inverse, ne pas tracer la migration laisserait s'installer une dette discrète. La décision explicite (avec ce ticket d'ADR) garantit que la migration sera reprise au passage à l'industrialisation et que les choix POC (architecture feature-based, séparation services / features / shared) restent **compatibles** avec TS.

### Règles POC

Autorisé pendant le POC :

- JSX (`.jsx`).
- JSDoc pour annoter les types des structures importantes (`LayerConfig`, contrats de service, retours d'API).
- Typage léger via `@typedef` et `@param` dans les commentaires (lu par l'éditeur).

Interdit pendant le POC :

- Introduction partielle de TSX sans plan d'ensemble (mélange `.jsx` et `.tsx` non maîtrisé).
- Suppression du typage JSDoc déjà présent (il sert de base à la migration future).

### Règles à l'industrialisation

Au moment de la décision d'industrialiser, prévoir un ADR dédié qui :

1. Acte le calendrier de migration.
2. Définit l'ordre des migrations (priorité aux services et modèles de données, puis aux composants UI).
3. Choisit le degré de strictness (`strict: true` ou progressif).
4. Définit la stratégie de coexistence temporaire (compatibilité `allowJs`, conversion fichier par fichier).

### Ce que l'on ne décide pas encore ici

- La version de TypeScript cible.
- L'outil de migration (manuel, codemod, `ts-migrate` de Airbnb, etc.).
- Le degré de strictness final.
- Si l'on adopte aussi TypeScript côté Python (sans objet : Python a son propre système d'annotations).

---

## Conséquences

### Accepté

- Le code POC reste en `.jsx`.
- Le typage léger via JSDoc est encouragé sur les contrats critiques (services, structures de données).
- La trajectoire TS est explicitement tracée pour ne pas être oubliée.

### Travail induit (à l'industrialisation, hors POC)

- Rédaction d'un ADR dédié pour le passage TS.
- Configuration `tsconfig.json` et adaptation de Vite, Vitest, ESLint.
- Migration progressive des services puis des composants.
- Formation éventuelle de l'équipe au typage TS.

### Risques résiduels

- **Migration repoussée puis oubliée** : risque récurrent des dettes "à plus tard". Mitigation : rappel explicite dans la section 4.2 de SPEC-2026-001 et dans la liste "À réserver à la production" (15.4).
- **JSDoc partiel** : si on annote certaines fonctions et pas d'autres, le bénéfice est inégal. Mitigation : convention "tout service exporté reçoit son JSDoc" à inscrire dans le README front lors de FE-001C.

---

## Impact sur les tickets de SPEC-2026-001

| Ticket | Impact |
|---|---|
| Aucun ticket bloqué | Cet ADR est informatif, il ne bloque aucun ticket POC. |
| FE-001C | Inscrire la convention JSDoc dans le README front lors du nettoyage architecture. |

---

## Références

- TypeScript handbook : <https://www.typescriptlang.org/docs/>
- JSDoc + TypeScript : <https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html>
- SPEC-2026-001 — sections 4.2, 5.1, D-01.
