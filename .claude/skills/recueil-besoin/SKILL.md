---
name: recueil-besoin
description: Transformer des notes brutes (entretien, réunion de cadrage, mail métier) en fiche de besoin métier (BES) structurée et exploitable. Produit un fichier `docs/besoins/BES-AAAA-NNN-<slug>.md` en statut `Brouillon`. À invoquer dès qu'une matière première existe (notes, transcript, échanges) et qu'il faut la figer dans un livrable Orion. Ne décrit pas la solution — uniquement le problème à résoudre, le périmètre métier et les critères de succès.
---

# Skill `recueil-besoin`

> Procédure d'écriture d'une **fiche de besoin métier (BES)** dans le projet Orion. Invoquée par un agent (typiquement `architecte-orion` ou `gardien-doc`) ou directement par l'utilisateur après un entretien / une réunion de cadrage.

---

## 1. Quand invoquer ce skill

- À l'issue d'un entretien métier, d'une réunion de cadrage, ou de la réception de notes brutes (mail, transcript, post-it).
- Quand le besoin est exprimé en langage métier et qu'il faut le **figer dans un livrable** avant de passer à la conception.
- **Avant** toute SPEC, tout ADR, tout ticket de développement.

**Ne pas invoquer si** :
- Le besoin est déjà décrit dans un BES existant (préférer une nouvelle version du même BES).
- La demande est purement technique (préférer un ADR via `architecte-orion`).
- Il s'agit d'un correctif ponctuel sans enjeu métier (un ticket suffit).

---

## 2. Principes d'écriture

1. **Décrire le problème, pas la solution.** Un BES répond à « quel besoin métier ? » et « pour qui ? ». Il ne préempte ni l'architecture, ni la techno, ni l'UI. Si une solution est mentionnée, c'est comme **hypothèse à valider**, jamais comme décision.
2. **Vulgariser.** L'utilisateur principal d'Orion (directeur géomatique) lira ce document. Tout terme technique non métier est explicité (en note de bas de page ou dans une mini-section glossaire si nécessaire).
3. **Tracer les sources.** Toute affirmation provient d'un entretien, d'un document, d'une décision actée. Les inférences sont signalées explicitement (`⟦INFÉRÉ — à valider⟧`).
4. **Séparer le certain du supposé.** Ce qui est validé en réunion va dans le corps du document ; ce qui est déduit ou supposé va en section « Hypothèses à valider » ou « Questions ouvertes ».
5. **Pas d'enchaînement automatique.** À la fin du skill, le BES sort en statut `Brouillon`. **Aucun agent ne déclenche la SPEC** : il faut une relecture humaine et un passage explicite en statut `Validé` (frontmatter + signature `valide_par_metier`).

---

## 3. Procédure

### Étape 1 — Rassembler la matière première

Vérifier que tu disposes d'au moins l'un des éléments suivants :

- notes textuelles d'un entretien ou d'une réunion ;
- transcript automatique (Fireflies, Otter, etc.) ;
- mail ou ticket métier exprimant un besoin ;
- compte-rendu de comité de pilotage.

Si la matière est trop pauvre, **ne pas inventer** : poser des questions ouvertes en section 10 du BES, ou refuser de produire le livrable et demander un entretien complémentaire.

### Étape 2 — Choisir l'identifiant

Identifiant : `BES-AAAA-NNN` où

- `AAAA` = année de création (4 chiffres) ;
- `NNN` = numéro incrémental dans l'année, sur 3 chiffres (`001`, `002`, …).

Lister les fichiers existants dans `docs/besoins/` pour trouver le prochain numéro disponible **dans l'année courante** (l'incrémentation est annuelle, pas globale).

### Étape 3 — Choisir le slug

`<slug>` = description courte en kebab-case, anglais ou français selon l'usage du projet (Orion = français).

Exemples : `import-couches-cadastre`, `gestion-droits-publication`, `consolidation-fonds-de-plan`.

Règle : ≤ 5 mots, sans accent, sans caractères spéciaux.

Nom final du fichier : `docs/besoins/BES-AAAA-NNN-<slug>.md`.

### Étape 4 — Rédiger le BES à partir du template ci-dessous

Le template est **prescriptif sur la structure**, **adaptatif sur le volume** : pour un besoin simple, certaines sections tiennent en deux lignes. Aucune section ne peut être supprimée, mais une section peut contenir « Sans objet pour ce besoin. » avec une justification.

### Étape 5 — Boucler la cohérence

Avant de livrer :

- L'identifiant est unique (pas déjà pris dans `docs/besoins/`).
- Le statut est bien `Brouillon`.
- `valide_par_metier` est vide (à remplir par l'humain).
- Toutes les inférences sont marquées `⟦INFÉRÉ — à valider⟧`.
- Les questions ouvertes sont listées en section 10.
- Le fichier respecte la nomenclature `BES-AAAA-NNN-<slug>.md`.

### Étape 6 — Livrer et annoncer la suite

Annoncer à l'utilisateur :

- le chemin du fichier créé ;
- le statut (`Brouillon`) ;
- l'action humaine attendue : relecture, complétion des questions ouvertes, passage en `Validé` (et seulement après, possibilité d'invoquer le skill `spec-fonctionnelle`).

---

## 4. Template intégré

```markdown
---
id: BES-AAAA-NNN
titre: <Titre court et explicite>
version: 0.1
statut: Brouillon
date_creation: AAAA-MM-JJ
date_derniere_modif: AAAA-MM-JJ
auteur: <Nom ou agent rédacteur>
demandeur: <Personne / direction à l'origine du besoin>
sources:
  - <réunion du AAAA-MM-JJ avec X>
  - <mail de Y du AAAA-MM-JJ>
  - <transcript Z>
valide_par_metier:
  nom: ""
  date: ""
tags:
  - <domaine métier>
  - <thématique transverse>
---

# BES-AAAA-NNN — <Titre>

> **Notice de lecture.**
> Ce document décrit **un besoin métier**, pas une solution. Il sert de point d'entrée à une éventuelle SPEC (`SPEC-AAAA-NNN`). Tant que le statut reste `Brouillon`, le contenu peut bouger sans préavis. Toute mention `⟦INFÉRÉ — à valider⟧` n'a pas été explicitement validée par le demandeur.

---

## 1. Contexte et motivation

Pourquoi ce besoin émerge maintenant ? Quelle situation l'a déclenché (changement réglementaire, incident, opportunité, demande utilisateur récurrente) ?

Quelques phrases — pas un essai. Le lecteur doit comprendre en 30 secondes pourquoi on s'en occupe.

## 2. Acteurs concernés

| Acteur / rôle | Implication |
|---|---|
| <ex : technicien SIG terrain> | <ex : consommateur principal, fournit la donnée brute> |
| <ex : direction géomatique> | <ex : commanditaire, valide le besoin> |
| <ex : DSI> | <ex : impactée pour l'hébergement> |

## 3. Problème à résoudre

Énoncé du problème **en langage métier**, sans solution. Format conseillé :

> Aujourd'hui, [acteur] ne peut pas [action métier] parce que [contrainte]. Conséquence : [impact mesurable ou ressenti].

Si plusieurs problèmes coexistent, les lister en sous-points numérotés (3.1, 3.2, …) et préciser leurs priorités relatives.

## 4. Périmètre métier

### 4.1 Inclus

- Liste explicite de ce qui entre dans le périmètre de ce besoin.

### 4.2 Exclu

- Liste explicite de ce qui n'entre **pas** dans le périmètre (et donc, qui ne sera pas traité dans la SPEC qui en découlera).

Cette séparation est cruciale : elle évite l'inflation de périmètre lors du passage à la SPEC.

## 5. Cas d'usage et scénarios

Décrire 2 à 5 scénarios concrets de la vie d'un utilisateur. Un scénario = un acteur, un déclencheur, une suite d'actions métier, un résultat attendu.

Format conseillé :

> **Scénario 1 — <nom court>**
> Acteur : <…>
> Déclencheur : <…>
> Déroulé : <étapes métier, pas techniques>
> Résultat attendu : <…>

## 6. Contraintes métier

Tout ce qui contraint la solution future **sans la prescrire** :

- contraintes réglementaires (RGPD, INSPIRE, etc.) ;
- contraintes calendaires (jalon, comité, livrable régalien) ;
- contraintes organisationnelles (équipe limitée, dépendance externe) ;
- contraintes de données (volumes, fréquence de mise à jour, qualité attendue).

## 7. Critères de succès métier

Comment saura-t-on que le besoin est satisfait ? Critères **observables** et **mesurables** si possible. Pas de critère technique (latence, uptime…) — ces critères-là appartiendront à la SPEC.

Exemples :

- « Un technicien terrain peut consulter la dernière version d'une couche métier en moins d'une consultation par jour, sans appeler le SIG. »
- « Le directeur valide qu'un livrable trimestriel est généré sans intervention manuelle. »

## 8. Risques métier identifiés

Risques **du non-aboutissement** ou **d'un aboutissement mal calibré**. Pas les risques techniques de mise en œuvre — ceux-ci iront dans la SPEC.

Format : `Risque` — `Probabilité` — `Impact` — `Mitigation envisagée`.

## 9. Hypothèses à valider

Liste explicite de tout ce qui a été supposé et qui n'a pas été confirmé par le demandeur. Une entrée par hypothèse.

- H-01 : ⟦INFÉRÉ — à valider⟧ <hypothèse> — confirmation attendue de <qui> avant <quand>.

## 10. Questions ouvertes

Tout ce qui doit être éclairci avant le passage en `Validé` ou avant la SPEC.

- Q-01 : <question>
- Q-02 : <question>

## 11. Liens et références

- Compte-rendu de réunion : <lien ou chemin>
- Transcript : <lien>
- Documents source : <liens>
- BES liés : <BES-AAAA-NNN, le cas échéant>

## 12. Historique des versions

| Version | Date | Auteur | Changement |
|---|---|---|---|
| 0.1 | AAAA-MM-JJ | <agent / nom> | Création (Brouillon initial) |
```

---

## 5. Anti-patterns à éviter

- **Glisser de la techno dans un BES.** « On utilisera PostGIS pour stocker… » → non. Le choix de PostGIS appartient à la SPEC ou à un ADR.
- **Sur-spécifier l'UI.** « Le bouton bleu en haut à droite ouvrira un panneau… » → non. L'UI sera traitée dans la SPEC, après validation du besoin.
- **Confondre « ce qu'on a entendu » et « ce qui est décidé ».** Si le demandeur a dit « peut-être qu'on voudra… », c'est une hypothèse, pas une décision.
- **Inventer des chiffres de critères de succès.** Mieux vaut un critère qualitatif honnête qu'un seuil chiffré non validé.
- **Enchaîner directement sur la SPEC.** Le passage en `Validé` est un acte humain. Le skill ne déclenche jamais le suivant.

---

## 6. Cas hybride POC

Sur la phase POC d'Orion, **un document hybride** (BES + SPEC dans le même fichier) reste toléré quand le périmètre est très resserré et que les deux sont rédigés en parallèle. Ce cas est explicitement balisé dans la SPEC résultante (cf. SPEC-2026-001, notice de lecture, « chemin B »). À l'industrialisation, cette tolérance disparaît : un BES précède toujours une SPEC.

---

## 7. Référence

- `\\wsl.localhost\ubuntu-24.04\home\dimylinux\orion\.claude\skills\README.md` — convention de nommage et flux nominal.
- SPEC-2026-001 — exemple canonique (hybride POC) où les sections 1 à 4 jouent le rôle d'un BES.
