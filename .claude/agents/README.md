# Équipe d'agents — Projet Orion

Ce dossier contient les **sous-agents Claude Code** du projet. Chaque fichier `.md` définit un agent spécialisé avec son rôle, ses principes et son comportement attendu.

## Comment ça marche

Quand tu travailles avec Claude Code dans VS Code, ces agents sont chargés automatiquement. Tu peux :

- **Les invoquer explicitement** dans une conversation : "demande à `dev-geo` d'écrire un script qui...".
- **Laisser Claude déléguer automatiquement** : si tu demandes une revue de code, Claude proposera de passer la main à `relecteur`.

Chaque agent a son **propre contexte de conversation** (il ne voit pas tout l'historique du chat principal — c'est plus propre) et son **propre prompt système** défini dans le frontmatter et le corps du fichier `.md`.

## Composition de l'équipe

| Agent | Rôle | Quand l'invoquer |
|---|---|---|
| `architecte-orion` | Décisions structurantes, ADR | Choix de techno, organisation de code, arbitrages POC vs industrialisation |
| `dev-geo` | Code back / données | Python, PostGIS, intégrations GeoNode/GeoServer, ETL |
| `dev-front` | Code front cartographique | React, OpenLayers, composants UI, services OGC |
| `relecteur` | Revue de code indépendante | Avant chaque PR/merge, ponctuellement sur un diff |
| `gardien-doc` | Documentation, ADR, README | Après une décision, un changement structurel, doc utilisateur |

## Faire évoluer un agent

Tu peux **modifier librement** ces fichiers — ils ne sont que du Markdown. Pour changer le comportement d'un agent :

1. Ouvre son `.md`
2. Modifie le frontmatter (`name`, `description`) ou le corps (le prompt système)
3. Commit la modification — comme n'importe quel code

Les changements prennent effet à la prochaine invocation.

## Bonnes pratiques

- **Garde les rôles distincts.** Si deux agents font la même chose, fusionne-les ou affine leurs descriptions.
- **Évite l'inflation.** Plus d'agents = plus de complexité. Ajoute un nouveau rôle seulement quand un besoin réel émerge.
- **Versionne tout.** Ces fichiers font partie du projet — leur historique git documente l'évolution de la méthode de travail.
