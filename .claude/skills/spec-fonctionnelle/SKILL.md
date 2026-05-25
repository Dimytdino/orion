---
name: spec-fonctionnelle
description: Transformer une fiche de besoin métier validée (BES en statut `Validé`) en spécification fonctionnelle détaillée (SPEC) exploitable par les agents de développement. Produit un fichier `docs/specs/SPEC-AAAA-NNN-<slug>.md` en statut `Brouillon` puis `Brouillon avancé`. Calibré sur SPEC-2026-001 (référence canonique). À invoquer uniquement quand un BES est marqué `Validé` et signé par le métier.
---

# Skill `spec-fonctionnelle`

> Procédure d'écriture d'une **spécification fonctionnelle détaillée (SPEC)** dans le projet Orion. Invoquée par un agent (typiquement `architecte-orion` après cadrage, ou `gardien-doc` après un comité) ou directement par l'utilisateur quand un BES est validé.

---

## 1. Quand invoquer ce skill

- Un BES (`BES-AAAA-NNN`) est en statut `Validé` (signé `valide_par_metier`).
- Le besoin est suffisamment stable pour qu'une conception détaillée ait du sens.
- Les agents de développement (`dev-geo`, `dev-front`, Claude Code) doivent disposer d'un livrable exécutable (tickets, contraintes, architecture, critères d'acceptation).

**Ne pas invoquer si** :
- Aucun BES n'existe ou le BES est encore en `Brouillon` → invoquer d'abord `recueil-besoin`, ou compléter et valider le BES existant.
- Il s'agit d'une décision structurante isolée (techno, architecture) → un ADR via `architecte-orion` suffit.
- Le périmètre est trivial (correctif ponctuel, tweak UI) → un ticket suffit.

---

## 2. Prérequis durs

Avant de commencer la rédaction, vérifier :

1. Le BES source existe sous `docs/besoins/BES-AAAA-NNN-<slug>.md`.
2. Son frontmatter contient `statut: Validé` et `valide_par_metier.nom` est rempli.
3. Les questions ouvertes du BES ont été tranchées ou explicitement reportées (et tracées dans la SPEC).

Si l'un de ces prérequis manque, **refuser de produire la SPEC** et expliquer ce qui manque. Pour le cas POC hybride (BES + SPEC dans le même document), voir section 7.

---

## 3. Principes d'écriture

1. **Issue de**. Le frontmatter `issue_de:` doit pointer explicitement le BES source. Pas de SPEC orpheline.
2. **Spécifier sans implémenter.** La SPEC décrit le quoi détaillé (modules, contraintes, critères d'acceptation, tickets) ; le comment fin reste au code. Si une décision techno apparaît dans la SPEC, elle doit être adossée à un ADR.
3. **Vulgariser.** Public mixte (directeur géomatique + agents de dev). Tout terme technique est défini en glossaire (section 0) — quitte à dupliquer le glossaire projet pour rendre la SPEC autonome.
4. **Trace les hypothèses.** Toute affirmation non confirmée porte la marque `⟦INFÉRÉ — à valider⟧`. Toute décision intermédiaire est listée en section 16.
5. **Pose les ADR.** Si la SPEC nécessite des décisions structurantes (choix de techno, organisation du code, scope d'une lib), ne pas les enterrer dans la SPEC : référencer un ADR dédié dans le frontmatter (`adr_lies`). Si l'ADR n'existe pas encore, l'ouvrir avant ou en parallèle.
6. **Pas d'enchaînement automatique.** La SPEC sort en `Brouillon` puis évolue vers `Brouillon avancé`. Le passage en `Validé` exige relecture humaine + signatures `valide_par_metier` et `valide_par_tech`. Aucun ticket de développement n'est exécuté tant que la SPEC n'est pas validée — sauf décision explicite POC.

---

## 4. Procédure

### Étape 1 — Lire le BES source

Charger `docs/besoins/BES-AAAA-NNN-<slug>.md`. Identifier :

- le problème métier et son contexte ;
- les acteurs ;
- le périmètre inclus / exclu ;
- les cas d'usage ;
- les contraintes métier et critères de succès ;
- les hypothèses et questions ouvertes encore vivantes.

### Étape 2 — Choisir l'identifiant

`SPEC-AAAA-NNN` où

- `AAAA` = année de création (4 chiffres) ;
- `NNN` = numéro incrémental dans l'année, sur 3 chiffres (`001`, `002`, …).

L'incrémentation SPEC est **indépendante** de l'incrémentation BES. Un `SPEC-2026-001` n'a aucun lien numérique avec un `BES-2026-001`. Le lien explicite est porté par le champ `issue_de`.

### Étape 3 — Choisir le slug

`<slug>` = description courte en kebab-case, alignée si possible sur le slug du BES (pas obligatoire).

Nom final du fichier : `docs/specs/SPEC-AAAA-NNN-<slug>.md`.

### Étape 4 — Identifier les ADR à produire

Lister les décisions structurantes que la SPEC va trancher implicitement. Pour chacune, créer (ou demander à `architecte-orion` de créer) un ADR dédié dans `docs/adr/NNNN-<slug>.md`.

Exemples typiques de décisions structurantes :

- choix d'une bibliothèque transverse ;
- organisation du code (structure des dossiers, monorepo / multi-repos) ;
- scope d'usage d'un outil (cf. ADR-0004 sur React Query) ;
- choix d'un protocole / format (vector tiles vs WMS, JWT vs session, etc.).

Renseigner ces ADR dans `adr_lies:` du frontmatter.

### Étape 5 — Rédiger la SPEC à partir du template

Le template ci-dessous reprend la structure de **SPEC-2026-001**, qui sert de **référence canonique** au projet. Toutes les sections sont obligatoires en présence (jamais supprimées), mais leur **volume est adaptatif** :

- pour un POC resserré, certaines sections tiennent en 3-5 lignes ;
- pour une SPEC industrielle, certaines sections deviennent des sous-documents (parfois éclatées en annexes).

Une section sans contenu utile doit afficher `Sans objet pour cette SPEC.` avec une justification d'une ligne, pas être supprimée.

### Étape 6 — Boucler la cohérence

Avant de livrer :

- L'identifiant est unique dans `docs/specs/`.
- Le statut est `Brouillon` (ou `Brouillon avancé` si on a déjà passé une première relecture interne).
- `valide_par_metier` et `valide_par_tech` sont vides (à remplir par l'humain).
- `issue_de` pointe le BES source.
- `adr_lies` liste les ADR effectivement existants ; ceux à créer sont marqués `À créer`.
- Toutes les inférences sont marquées `⟦INFÉRÉ — à valider⟧`.
- Les questions ouvertes sont listées en section 18.
- Tous les tickets de développement de la section 13 ont :
  - un identifiant unique (`FE-001`, `BE-001`, etc.) ;
  - une estimation (`XS / S / M / L / XL`) ;
  - une Definition of Done (DoD) explicite ;
  - leurs dépendances (`bloqué par`) le cas échéant.

### Étape 7 — Livrer et annoncer la suite

Annoncer à l'utilisateur :

- le chemin du fichier créé ;
- son statut ;
- la liste des ADR à créer ou compléter avant validation ;
- l'action humaine attendue : relecture métier (statut `Validé` côté métier), relecture technique (statut `Validé` côté tech), arbitrage des questions ouvertes.

---

## 5. Template intégré

```markdown
---
id: SPEC-AAAA-NNN
titre: <Titre court et explicite>
version: 0.1
statut: Brouillon
type: <standard | hybride-poc>
date_creation: AAAA-MM-JJ
date_derniere_modif: AAAA-MM-JJ
auteur: <Nom ou agent rédacteur>
demandeur: <Personne / direction à l'origine>
issue_de: BES-AAAA-NNN
valide_par_metier:
  nom: ""
  date: ""
valide_par_tech:
  nom: ""
  date: ""
adr_lies:
  - ADR-NNNN
tags:
  - <domaine>
  - <thématique>
---

# SPEC-AAAA-NNN — <Titre>

> **Notice de lecture.**
> Document **spécification fonctionnelle détaillée** issu de `BES-AAAA-NNN`. Toute mention `⟦INFÉRÉ — à valider⟧` n'est pas confirmée. Le statut `Brouillon` autorise les évolutions sans préavis ; le statut `Brouillon avancé` signale un document exploitable par les agents de développement mais en attente des signatures `valide_par_metier` et `valide_par_tech`. Tant que ces signatures ne sont pas posées, aucun ticket de la section 13 n'est exécuté.

---

## 0. Glossaire

Glossaire autonome (peut dupliquer celui de `CLAUDE.md`). Tous les termes techniques utilisés dans la SPEC sont définis ici, même les plus courants pour le métier.

| Terme | Définition |
|---|---|
| <terme> | <définition courte, en français> |

## 1. Rappel du besoin métier

Reformulation synthétique du BES source (contexte, problème, périmètre métier). 5-15 lignes max — pas un copier-coller du BES, une **synthèse**.

## 2. Objectifs

Liste numérotée des objectifs que la SPEC doit atteindre, alignés sur les critères de succès du BES. Format conseillé : `O-01`, `O-02`, …

Chaque objectif renvoie en section 19 (matrice de traçabilité) vers les modules et tickets qui le concrétisent.

## 3. Acteurs et rôles

Repris du BES mais affiné côté système : qui appelle quoi, qui consulte quoi, qui administre quoi.

## 4. Périmètre fonctionnel

### 4.1 Inclus

Liste des fonctionnalités que la SPEC engage à livrer.

### 4.2 Exclu

Liste explicite des fonctionnalités hors périmètre, avec justification courte.

## 5. Architecture cible

Description haut-niveau de la cible technique : composants principaux, échanges entre eux, dépendances externes.

Pas le détail d'implémentation — la structure générale et les choix structurants. Tout choix structurant renvoie à un ADR (`adr_lies`).

## 6. Modules fonctionnels

Décomposition en modules ou features. Pour chacun :

- nom et rôle ;
- entrées / sorties ;
- dépendances ;
- exigences fonctionnelles ;
- exigences non fonctionnelles particulières.

## 7. Contraintes techniques (et métier reportées)

Tout ce qui contraint l'implémentation : technos imposées, formats, protocoles, projections (cf. CRS), versions, compatibilité.

## 8. Performance

Cibles chiffrées si possible (latence, débit, volume) — sinon, qualitatives. Distinguer POC / cible industrialisation.

## 9. Sécurité

Authentification, autorisation, gestion des secrets, RLS, conformité (RGPD, INSPIRE…).

## 10. Accessibilité et UX

Principes de design, conformité (RGAA, WCAG), parcours utilisateur clés.

## 11. APIs et services

Endpoints consommés, contrats d'interface, formats d'échange, comportements en cas d'erreur.

## 12. Critères d'acceptation globaux

Critères transverses qui qualifient la SPEC comme livrée. Distincts des critères par ticket (section 13) — ici, c'est ce qui qualifie l'ensemble.

## 13. Tickets de développement

Liste exhaustive des tickets à exécuter, idéalement organisée par ordre d'exécution.

Pour chaque ticket :

- identifiant (`FE-001`, `BE-001`, `INFRA-001`, …) ;
- intitulé ;
- description ;
- estimation (`XS` / `S` / `M` / `L` / `XL`) ;
- dépendances (`bloqué par`) ;
- Definition of Done (DoD) explicite ;
- agent recommandé (`dev-front`, `dev-geo`, `architecte-orion`, …).

## 14. Risques identifiés

Risques techniques et organisationnels de mise en œuvre, avec mitigation envisagée.

## 15. Synthèse POC / Production et ordre d'exécution

Ce qui est dans le scope POC, ce qui est reporté à l'industrialisation, et l'ordre d'exécution conseillé des tickets.

## 16. Décisions prises pour cette SPEC

Liste des décisions structurantes prises au cours de la rédaction, avec leurs justifications courtes. Chaque décision majeure renvoie à un ADR (créé ou à créer).

| ID | Décision | Justification | ADR lié |
|---|---|---|---|
| D-01 | <décision> | <pourquoi> | ADR-NNNN |

## 17. Hypothèses et inférences à valider

Toutes les hypothèses prises pendant la rédaction qui n'ont pas été confirmées par le demandeur ou par un ADR existant.

- H-01 : ⟦INFÉRÉ — à valider⟧ <hypothèse> — confirmation attendue de <qui> avant <quand>.

## 18. Questions ouvertes

Tout ce qui doit être tranché avant `Validé`.

- Q-01 : <question>
- Q-02 : <question>

## 19. Matrice de traçabilité

Tableau qui croise les objectifs (section 2), les modules (section 6), les tickets (section 13) et les critères d'acceptation (section 12). Permet de vérifier qu'aucun objectif n'est orphelin et qu'aucun ticket n'est gratuit.

| Objectif | Modules | Tickets | Critères d'acceptation |
|---|---|---|---|
| O-01 | M-01, M-02 | FE-001, FE-002 | CA-01 |

## 20. Références techniques

Liens utiles pour les agents de développement : documentation officielle, ADR Orion, autres SPEC liées, ressources externes.

## 21. Historique des versions

| Version | Date | Auteur | Changement |
|---|---|---|---|
| 0.1 | AAAA-MM-JJ | <agent / nom> | Création (Brouillon initial) |
```

---

## 6. Anti-patterns à éviter

- **SPEC sans BES.** Refuser de produire la SPEC tant que le BES n'existe pas et n'est pas `Validé`, sauf cas hybride POC explicitement assumé (cf. section 7).
- **Trancher une décision structurante sans ADR.** Si la SPEC choisit React Query, choisit une architecture feature-based, ou choisit un protocole, il faut un ADR adossé — pas une décision enterrée au paragraphe 5.3.
- **Glisser de l'implémentation fine.** « Le hook utilisera `useMemo` avec une dépendance sur `mapInstance` » → non. La SPEC décrit le contrat ; le code décide les détails. Sauf si un détail est structurant — auquel cas, ADR.
- **Sur-spécifier un POC.** Mieux vaut une SPEC honnête à 12 sections succinctes qu'une SPEC industrielle à 80 pages pour valider une preuve de concept. Le statut `hybride-poc` du frontmatter assume cette tolérance.
- **Enchaîner sur l'exécution des tickets.** Les tickets de la section 13 ne s'exécutent qu'après validation humaine — métier ET technique. Cette règle est absolue.

---

## 7. Cas hybride POC

Sur la phase POC, et **uniquement à ce stade**, un document hybride (BES + SPEC en un seul fichier) est toléré. Dans ce cas :

- le frontmatter porte `type: hybride-poc` ;
- la notice de lecture en tête du document signale explicitement que les sections 1-4 jouent le rôle d'un BES ;
- `issue_de:` peut porter une mention `(non séparé — document hybride POC)` ;
- l'engagement est pris que **toute évolution majeure post-POC** déclenche la séparation en `BES-XXX` + `SPEC-XXX` distincts.

C'est exactement le cas de **SPEC-2026-001**, qui sert de référence.

---

## 8. Référence

- `\\wsl.localhost\ubuntu-24.04\home\dimylinux\orion\.claude\skills\README.md` — convention de nommage et flux nominal.
- `\\wsl.localhost\ubuntu-24.04\home\dimylinux\orion\.claude\skills\recueil-besoin\SKILL.md` — skill prédécesseur dans le flux nominal.
- **SPEC-2026-001** (`docs/specs/SPEC-2026-001-frontend-orion-poc.md`) — référence canonique, à utiliser pour calibrer toute évolution de ce skill.
- ADR-0003 (architecture feature-based frontend) et ADR-0004 (scope React Query) — exemples d'ADR adossés à SPEC-2026-001.
