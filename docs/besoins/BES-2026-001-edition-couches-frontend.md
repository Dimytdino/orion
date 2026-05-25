---
id: BES-2026-001
titre: Édition de couches affichées dans le frontend cartographique Orion
version: 0.1
statut: Validé
date_creation: 2026-05-24
date_derniere_modif: 2026-05-24
auteur: Cowork (skill `recueil-besoin`) à partir d'une demande directe de la direction géomatique
demandeur: Direction géomatique
sources:
  - Demande utilisateur formulée le 2026-05-24 en session Cowork : « ajoute dans les fonctionnalités du front la nécessité de pouvoir modifier une couche qui est affichée (pas uniquement de la lecture) ».
  - Questions de cadrage Cowork (2026-05-24) confirmant : (1) édition des objets — géométrie + attributs ; (2) réorganisation dans le panneau (ordre, opacité, visibilité). Les autres options (style de rendu, métadonnées de couche) n'ont pas été retenues à ce stade.
  - SPEC-2026-001 v0.3 (section 4.2) qui exclut explicitement l'« édition géographique complète » du périmètre POC.
valide_par_metier:
  nom: "Dimitry"
  date: "2026-05-24"
tags:
  - SIG
  - frontend
  - édition
  - vectoriel
  - WFS-T
  - panneau-couches
---

# BES-2026-001 — Édition de couches affichées dans le frontend cartographique Orion

> **Notice de lecture.**
> Ce document décrit **un besoin métier**, pas une solution. Il sert de point d'entrée à une éventuelle SPEC (`SPEC-AAAA-NNN`) ou à un amendement de `SPEC-2026-001`. Tant que le statut reste `Brouillon`, le contenu peut bouger sans préavis.
> **Particularité de ce BES** : il est issu d'une **demande directe** (pas d'un entretien structuré). Le cadrage minimal a été établi par questions de clarification au sein d'une session Cowork. Beaucoup de zones d'ombre subsistent — listées explicitement en sections 9 et 10. Un entretien complémentaire avec la direction géomatique est nécessaire **avant** tout passage en statut `Validé`.

---

## 1. Contexte et motivation

Le frontend cartographique Orion est aujourd'hui spécifié en lecture seule pour la phase POC (SPEC-2026-001). Les couches métier sont **consultables** (affichage WMS, recherche, activation/désactivation) mais **non modifiables** depuis l'interface : toute correction d'un objet doit aujourd'hui repasser par un outil bureautique (QGIS, ArcMap legacy) puis par une republication serveur.

Ce mode de travail :

- crée une **friction** pour les utilisateurs métier qui repèrent une erreur en consultation et doivent changer d'outil pour la corriger ;
- entretient la dépendance à des outils bureautiques (parfois Esri), à rebours de l'objectif open source d'Orion ;
- ralentit les boucles d'amélioration de la donnée (saisie, correction, validation).

La direction géomatique souhaite que **le frontend puisse aussi servir d'outil de modification** — au moins pour les actions courantes — sans réinventer un SIG bureautique complet.

## 2. Acteurs concernés

| Acteur / rôle | Implication |
|---|---|
| **Technicien SIG** (consommateur/producteur de la donnée) | Cible principale. Doit pouvoir corriger une erreur, ajouter ou supprimer un objet, ajuster un attribut directement depuis la carte. |
| **Administrateur SIG** | Doit pouvoir configurer quelles couches sont éditables, par qui, dans quelles conditions. |
| **Directeur géomatique** | Commanditaire. Veut limiter la dépendance aux outils bureautiques et accélérer les boucles de correction de la donnée. |
| **Lecteur (consultation pure)** | Non concerné par l'édition mais doit voir une donnée à jour. |
| **Développeur frontend** | Implémente les modules d'édition et de réorganisation. |
| **Équipe back-end GeoNode/GeoServer** ⟦INFÉRÉ — à valider⟧ | Doit exposer un endpoint d'écriture (WFS-T ou équivalent) sur les couches éditables, et gérer les droits côté serveur. |

## 3. Problème à résoudre

Aujourd'hui, **un technicien SIG ne peut pas corriger ou compléter directement la donnée d'une couche affichée dans le frontend Orion** parce que l'interface est cantonnée à la consultation. Conséquence : toute modification, même mineure, oblige à changer d'outil (QGIS, voire un outil Esri legacy), à republier la couche, et à attendre la propagation — alors que l'erreur a été détectée sur la carte qu'il regardait déjà.

Plus spécifiquement, deux besoins distincts coexistent :

### 3.1 Édition des objets d'une couche (géométrie + attributs)

L'utilisateur doit pouvoir, sur une couche autorisée :

- créer un nouvel objet (point, ligne, polygone selon la couche) ;
- modifier la géométrie d'un objet existant (déplacer un sommet, redessiner) ;
- modifier les attributs d'un objet (formulaire d'édition) ;
- supprimer un objet.

Ces modifications doivent être **persistées côté serveur** (pas seulement dans le navigateur).

### 3.2 Manipulation du panneau de couches (ordre, opacité, visibilité)

L'utilisateur doit pouvoir, sans toucher à la donnée elle-même :

- réordonner les couches dans la pile (ce qui s'affiche au-dessus) ;
- ajuster l'opacité d'une couche (typiquement pour comparer deux couches superposées) ;
- activer/désactiver une couche.

Le 3 (visibilité) est déjà partiellement prévu par le `LayerPanel` de SPEC-2026-001 ; les 1 et 2 (ordre, opacité) sont nouveaux.

## 4. Périmètre métier

### 4.1 Inclus

- **Édition d'objets vectoriels** (géométrie + attributs) sur les couches **explicitement déclarées éditables** par l'administrateur SIG.
- **Réorganisation des couches** dans le panneau : ordre, opacité, visibilité.
- **Persistance serveur** des modifications d'objets.
- **Persistance utilisateur** (préférence) de l'ordre et de l'opacité ⟦INFÉRÉ — à valider⟧.
- **Trace serveur** des modifications (qui a modifié quoi, quand) ⟦INFÉRÉ — à valider⟧.

### 4.2 Exclu

- **Création de nouvelles couches** depuis le frontend (upload d'un shapefile, par exemple). Reste du domaine du portail GeoNode.
- **Édition du style de rendu / symbologie** (couleurs, classifications, légendes). Pas mentionné dans la demande initiale.
- **Édition des métadonnées de couche** (titre, description, mots-clés). Pas mentionné dans la demande initiale.
- **Édition collaborative temps réel** (deux utilisateurs sur la même entité au même instant). Hors scope par défaut sauf besoin métier explicite ⟦INFÉRÉ — à valider⟧.
- **Édition hors ligne** (mode déconnecté). Hors scope par défaut ⟦INFÉRÉ — à valider⟧.
- **Couches raster** (édition de pixel). Hors scope — l'édition concerne les couches vectorielles uniquement ⟦INFÉRÉ — à valider⟧.

## 5. Cas d'usage et scénarios

Les scénarios ci-dessous sont **plausibles mais non confirmés** par un entretien terrain. À valider lors du recueil complémentaire.

> **Scénario 1 — Correction d'une erreur de saisie**
> Acteur : technicien SIG.
> Déclencheur : il consulte la couche « réseau de fibrage » sur la carte et repère qu'un tronçon est mal positionné.
> Déroulé attendu : il clique sur le tronçon, entre en mode édition, déplace les sommets concernés, valide. La modification est enregistrée côté serveur. Un message confirme la sauvegarde.
> Résultat attendu : la carte est rafraîchie avec la nouvelle géométrie ; les autres utilisateurs voient la correction à leur prochain chargement.

> **Scénario 2 — Ajout d'un nouvel objet repéré sur le terrain**
> Acteur : technicien SIG.
> Déclencheur : il revient d'une mission terrain où il a relevé une nouvelle bouche d'incendie.
> Déroulé attendu : il sélectionne la couche « bouches d'incendie », clique sur le bouton « ajouter », place le point sur la carte, renseigne les attributs obligatoires (identifiant, type, diamètre…), valide.
> Résultat attendu : l'objet apparaît dans la couche et est visible immédiatement.

> **Scénario 3 — Comparaison de deux couches superposées**
> Acteur : technicien SIG ou administrateur.
> Déclencheur : il veut comparer le tracé d'un réseau avec un fond cadastral.
> Déroulé attendu : il affiche les deux couches, ajuste l'opacité du réseau à ~50 % via un slider dans le panneau, peut intervertir l'ordre des deux couches d'un glisser-déposer.
> Résultat attendu : il visualise simultanément les deux couches avec une lisibilité ajustable.

> **Scénario 4 — Suppression contrôlée d'un objet obsolète**
> Acteur : technicien SIG.
> Déclencheur : il identifie qu'un objet n'a plus lieu d'être (par ex. équipement démantelé).
> Déroulé attendu : il sélectionne l'objet, choisit « supprimer », confirme dans une boîte de dialogue qui rappelle quel objet est en train d'être supprimé.
> Résultat attendu : l'objet est retiré de la couche après confirmation ; une trace serveur garde mémoire de la suppression (qui, quand) ⟦INFÉRÉ — à valider⟧.

## 6. Contraintes métier

- **Compatibilité OGC.** L'édition doit s'appuyer sur des protocoles standard (typiquement WFS-T — *Web Feature Service Transactional*, le pendant en écriture du WFS de lecture), pour rester cohérente avec l'objectif open source d'Orion et compatible avec une future bascule d'outil bureautique. ⟦INFÉRÉ — à valider⟧
- **Sécurité.** Les droits d'édition doivent être appliqués **côté serveur** (pas uniquement côté interface). Une couche que l'utilisateur n'a pas le droit d'éditer ne doit pas être éditable, même par contournement de l'UI.
- **Cohérence avec QGIS et les outils bureautiques.** Une donnée éditée depuis le frontend Orion doit pouvoir être ré-éditée sans surprise depuis QGIS, et inversement. Pas de divergence de schéma, pas de format propriétaire.
- **Projection.** L'édition se fait sur des données stockées en Lambert 93 (EPSG:2154), conformément à la projection principale d'Orion (cf. SPEC-2026-001, section 7). Les transformations de projection éventuelles côté client doivent être transparentes pour l'utilisateur.
- **Traçabilité.** Toute modification (création, déplacement, suppression) doit être imputable à un utilisateur authentifié ⟦INFÉRÉ — à valider⟧.
- **Pas de réinvention d'un SIG bureautique.** L'édition front doit couvrir les **cas courants** (correction simple, ajout, suppression). Les chantiers lourds (édition topologique avancée, calculs géométriques complexes) restent du ressort de QGIS.

## 7. Critères de succès métier

- Un technicien SIG corrige une erreur géométrique simple **sans changer d'outil** et constate la mise à jour sur la carte dans la même session.
- Un nouvel objet ajouté depuis le frontend est immédiatement visible par les autres utilisateurs en lecture.
- Un utilisateur sans droit d'édition sur une couche ne voit pas les contrôles d'édition pour cette couche (et un appel forcé est refusé côté serveur).
- L'historique serveur permet de répondre à la question « qui a modifié cet objet, et quand ? » ⟦INFÉRÉ — à valider⟧.
- L'ordre et l'opacité que l'utilisateur a définis dans le panneau sont conservés d'une session à l'autre ⟦INFÉRÉ — à valider⟧.

## 8. Risques métier identifiés

| Risque | Probabilité | Impact | Mitigation envisagée |
|---|---|---|---|
| Corruption ou perte de donnée par édition non contrôlée (mauvais clic, validation trop facile) | Moyenne | Élevé | Confirmation explicite avant suppression, historique côté serveur, droits par couche. |
| Conflit silencieux (deux utilisateurs éditent simultanément la même entité) | Moyenne ⟦INFÉRÉ⟧ | Moyen | À cadrer (verrouillage optimiste vs pessimiste — sujet ouvert, question Q-04). |
| Dérive entre la donnée serveur et la vue affichée si le rafraîchissement n'est pas systématique | Moyenne | Moyen | Politique de rafraîchissement explicite après chaque édition. |
| Adoption faible si l'ergonomie d'édition est en deçà de QGIS | Moyenne | Moyen | Cibler les cas d'usage courants identifiés, accepter que les cas complexes restent en QGIS. |
| Sécurité contournée côté UI mais ouverte côté API | Faible | Élevé | Tests d'intrusion ciblés sur l'endpoint d'édition. |

## 9. Hypothèses à valider

- **H-01** : ⟦INFÉRÉ — à valider⟧ Toutes les couches éditables sont **vectorielles** (point/ligne/polygone). L'édition raster n'est pas attendue.
- **H-02** : ⟦INFÉRÉ — à valider⟧ L'édition se fait **en ligne** (mode connecté), pas hors ligne.
- **H-03** : ⟦INFÉRÉ — à valider⟧ Une modification est **immédiatement publiée** (pas de workflow de validation à deux niveaux : pas de brouillon → revue → publication).
- **H-04** : ⟦INFÉRÉ — à valider⟧ La **persistance utilisateur** de l'ordre et de l'opacité (préférences) est souhaitée. Sinon, ces réglages valent pour la session uniquement.
- **H-05** : ⟦INFÉRÉ — à valider⟧ Le **protocole d'édition** retenu côté serveur sera WFS-T (standard OGC), exposé par GeoServer. Une alternative (API REST custom GeoNode) pourrait être envisagée mais s'écarterait du standard.
- **H-06** : ⟦INFÉRÉ — à valider⟧ La trace serveur des modifications est attendue (audit/historique), au moins au niveau « qui a modifié, quand ».

## 10. Questions ouvertes

- **Q-01** : Quelles couches métier sont concernées en premier ? Y a-t-il une couche prioritaire pour le pilote ?
- **Q-02** : Quels rôles ont le droit d'éditer ? Tous les techniciens, ou un sous-ensemble ? Le rôle « Lecteur » est-il totalement exclu de l'édition ?
- **Q-03** : Y a-t-il un workflow de validation avant publication (brouillon → revue → publication) ? Ou une modification est immédiatement visible par tous ?
- **Q-04** : Politique de conflit en cas d'édition concurrente — verrouillage optimiste (le second qui sauvegarde est rejeté avec message), verrouillage pessimiste (lock côté serveur le temps de l'édition), ou autre ?
- **Q-05** : Doit-on conserver un **historique des versions** d'un objet (pouvoir revenir en arrière), ou seulement une trace d'audit (qui a fait quoi) ?
- **Q-06** : Granularité de l'audit — niveau objet, niveau attribut, niveau session ?
- **Q-07** : Cas des **attributs obligatoires** non renseignés à la création — bloquant, ou tolérance avec mention « incomplet » ?
- **Q-08** : Quelles règles de **qualité géométrique** sont attendues à l'édition (snapping, fermeture de polygone, non-superposition…) ?
- **Q-09** : Volume typique d'objets édités par utilisateur par jour (quelques-uns, dizaines, centaines) ?
- **Q-10** : L'édition est-elle **liée au pilote sur une couche spécifique** (POC d'édition restreint), ou doit être généralisable dès le départ à toutes les couches d'un certain type ?
- **Q-11** : Le panneau de couches doit-il offrir d'autres réorganisations que ordre / opacité / visibilité (par exemple : regroupement, dossiers, filtrage par thématique) ?
- **Q-12** : Y a-t-il une attente d'**outils de mesure** ou d'aide à l'édition (longueur, surface, accrochage à un objet existant) ?

## 11. Liens et références

- SPEC-2026-001 v0.3 — `docs/specs/SPEC-2026-001-frontend-orion-poc.md`, sections 3 (acteurs), 4 (périmètre), 6.2 (module couches), 7 (contraintes SIG), 9 (sécurité). À mettre à jour pour pointer vers le présent BES.
- ADR-0003 — `docs/adr/0003-architecture-feature-based-frontend.md` : la future feature `features/edit/` s'inscrira dans cette grille.
- ADR-0004 — `docs/adr/0004-react-query-scope.md` : les **mutations React Query** seront vraisemblablement mobilisées pour les appels d'écriture (cf. section « Ce que l'on ne décide pas encore ici » de l'ADR-0004).
- Skill `recueil-besoin` — `\\wsl.localhost\ubuntu-24.04\home\dimylinux\orion\.claude\skills\recueil-besoin\SKILL.md` : procédure utilisée pour produire ce BES.
- BES liés : aucun pour l'instant.

## 12. Historique des versions

| Version | Date | Auteur | Changement |
|---|---|---|---|
| 0.1 | 2026-05-24 | Cowork (skill `recueil-besoin`) | Création (Brouillon initial à partir d'une demande directe + questions de cadrage Cowork). Beaucoup de questions ouvertes, entretien complémentaire requis. |
