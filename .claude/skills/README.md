# Skills documentaires — Projet Orion

Ce dossier contient les **skills documentaires** du projet Orion. Chaque skill correspond à un **savoir-faire d'écriture** qu'un agent peut invoquer pour produire un livrable conforme à la méthodologie Orion.

## Différence entre `.claude/agents/` et `.claude/skills/`

- Un **agent** (dans `.claude/agents/`) est un **rôle** — il a une personnalité, des principes, un domaine d'intervention. Il décide *quoi* faire.
- Un **skill** (dans `.claude/skills/`) est une **procédure** — il décrit *comment* produire un livrable précis (un BES, une SPEC, un ADR, etc.). Il est invoqué par un agent (ou directement par l'utilisateur) quand le besoin se présente.

Analogie : un agent est un médecin, un skill est un protocole de soin. Le médecin choisit quel protocole appliquer.

## Skills disponibles

| Skill | Rôle | Quand l'invoquer |
|---|---|---|
| `recueil-besoin` | Transformer des notes brutes en fiche de besoin métier (BES) | À l'issue d'un entretien ou d'une réunion de cadrage, quand des notes existent et qu'il faut produire un livrable structuré |
| `spec-fonctionnelle` | Transformer une fiche de besoin validée en spécification fonctionnelle détaillée (SPEC) | Quand un BES est marqué `Validé` et qu'il faut produire la SPEC exploitable par les agents de développement |

## Convention de nommage des livrables

- **BES** (besoin métier) : `docs/besoins/BES-AAAA-NNN-<slug>.md`
- **SPEC** (spécification fonctionnelle détaillée) : `docs/specs/SPEC-AAAA-NNN-<slug>.md`
- **ADR** (décision d'architecture) : `docs/adr/NNNN-<slug>.md`

L'identifiant `AAAA-NNN` :

- `AAAA` = année de création (4 chiffres).
- `NNN` = numéro incrémental dans l'année, sur 3 chiffres (`001`, `002`, …).

L'incrémentation est globale par type (un BES `BES-2026-001` n'a aucun rapport numérique avec une SPEC `SPEC-2026-001`).

## Flux nominal d'utilisation

```
Notes brutes (entretien, réunion)
   ↓ skill `recueil-besoin`
BES-AAAA-NNN-<slug>.md (statut: Brouillon)
   ↓ relecture humaine + validation
BES-AAAA-NNN-<slug>.md (statut: Validé)
   ↓ skill `spec-fonctionnelle`
SPEC-AAAA-NNN-<slug>.md (statut: Brouillon → Brouillon avancé)
   ↓ relecture humaine + validation
SPEC-AAAA-NNN-<slug>.md (statut: Validé)
   ↓ exécution par les agents de développement (Claude Code, dev-geo, dev-front)
Tickets implémentés
```

**Règle absolue** : aucun skill n'enchaîne automatiquement sur le suivant. Le passage d'un livrable à l'état `Validé` exige une action humaine explicite (modification du frontmatter, signature dans `valide_par_metier` / `valide_par_tech`).

## Faire évoluer un skill

Comme pour les agents, ces fichiers sont du Markdown versionné :

1. Ouvre le `SKILL.md` du skill concerné.
2. Modifie le frontmatter (`name`, `description`) ou le corps (procédure d'écriture, templates intégrés).
3. Commit la modification.

Les changements prennent effet à la prochaine invocation.

## Référence

Le document **SPEC-2026-001** (frontend cartographique Orion POC) est utilisé comme **référence canonique** pour calibrer le skill `spec-fonctionnelle`. Toute évolution méthodologique majeure du skill doit être testée en repassant SPEC-2026-001 dans le pipeline et en vérifiant que le résultat reste cohérent.
