# AGENTS.md — Projet Orion

> Point d'entrée standard pour tout agent IA qui interagit avec ce dépôt (Claude, Codex, Cursor, Aider, etc.).
> **La source de vérité du contexte projet est `CLAUDE.md`** (à la racine de ce repo). Lis-le en premier.

---

## Projet en une phrase

**Orion** = migration de l'infrastructure géomatique d'une équipe Esri vers une stack 100 % open source (GeoNode + PostGIS + GeoServer + React/OpenLayers). Projet en phase **POC**, à dimension pédagogique forte.

---

## Conventions essentielles (extrait — détails dans `CLAUDE.md`)

- **Langue** : français.
- **Vulgarisation prioritaire** : l'utilisateur principal n'est pas développeur. Expliquer chaque terme technique brièvement à sa première apparition. Citer le "pourquoi" avant le "comment".
- **Code** : React fonctionnel (hooks, pas de classes), Python 3.11+, GeoPandas/Shapely côté SIG.
- **Tests** : Vitest côté front, pytest côté Python. Toute fonction métier non-triviale a au moins un test.
- **Pas de secrets en clair** : tout via variables d'environnement, jamais dans Git. Les `.env.sample` ne contiennent que des placeholders.
- **Branches** : ne jamais commiter directement sur `master`, toujours passer par une branche dédiée + Pull Request.
- **Pas de retour à Esri** : l'objectif est explicitement l'open source. Ne pas proposer d'alternative propriétaire.

---

## Organisation des dépôts

Ce repo (**`orion`**) contient :

- `front/` — application cartographique React 19 / Vite 8 / OpenLayers 10
- `docs/adr/` — décisions d'architecture (ADR numérotées séquentiellement)
- `docs/specs/` — spécifications fonctionnelles détaillées (SPEC)
- `docs/besoins/` — fiches de besoin métier (BES) — créé au premier BES
- `docs/journal/` — journaux de session
- `docs/ROADMAP.md` — feuille de route du projet
- `.claude/agents/` — équipe de **sous-agents Claude Code** spécialisés (`architecte-orion`, `dev-geo`, `dev-front`, `relecteur`, `gardien-doc`). Concept propre à Claude Code, **distinct de cet AGENTS.md**.
- `.claude/skills/` — **skills documentaires** Claude Code (`recueil-besoin`, `spec-fonctionnelle`) : procédures d'écriture standardisées pour produire BES et SPEC, calibrées sur SPEC-2026-001.

Le **back-end** (GeoNode, GeoServer, PostgreSQL/PostGIS, Docker Compose) est dans le repo séparé **`orion-geonode`** : `github.com/Dimytdino/orion-geonode`.

---

## Pour aller plus loin

Lis **`CLAUDE.md`** à la racine de ce repo — c'est la mémoire complète et à jour du projet (objectifs, profil utilisateur, stack, conventions détaillées, état d'avancement, glossaire interne, répartition Claude Code ↔ Cowork).

---

*Dernière mise à jour : 2026-05-24 — source de vérité : `CLAUDE.md`*
