# Feuille de route — Projet Orion

> Remplacement de l'infrastructure cartographique Esri par une stack open source.
> Document destiné à l'équipe de direction. Les termes techniques sont expliqués à leur première apparition.

---

## Vue d'ensemble

Le projet Orion migre l'ensemble des outils géomatiques (cartographie, publication de données spatiales, gestion des couches) d'une dépendance à Esri (logiciels propriétaires) vers une infrastructure entièrement open source bâtie autour de **GeoNode 5** — une plateforme web de publication de données géographiques — couplée à une interface cartographique sur mesure développée en React et OpenLayers.

---

## Ce qui est terminé

### Migration de l'architecture GeoNode (2026-05-19)

GeoNode est désormais installé comme une **dépendance logicielle** (à la manière d'un module que l'on installe, et non d'un code que l'on copie et modifie). Cela permet de recevoir les mises à jour de sécurité et de fonctionnalités de GeoNode sans effort manuel, et de garder les personnalisations d'Orion clairement séparées.

Toutes les adaptations propres à Orion (configuration, gabarits visuels, scripts) sont regroupées dans un seul répertoire dédié (`src/orion_geonode/`), ce qui simplifie la maintenance à long terme.

### Validation de bout en bout

L'ensemble de la chaîne fonctionnelle a été testée avec succès :

- Dépôt d'un fichier de données géographiques (shapefile) sur la plateforme
- Affichage de la couche sur la carte via le protocole WMS (standard d'échange de cartes sur le web)
- Authentification des utilisateurs

### Paramètres clés configurés

- **Taille maximale d'upload** : limite configurable via un paramètre d'environnement, fixée à 100 Mo par défaut. Cela évite de modifier le code source pour ajuster cette valeur selon les projets.
- **Délai d'attente uWSGI** (délai avant qu'une requête longue soit interrompue) : porté à 3 600 secondes (1 heure), pour permettre le traitement de gros fichiers géographiques.
- **Port de la base de données PostgreSQL** exposé sur le réseau local, ce qui facilite la connexion d'outils d'administration externes (ex. QGIS, pgAdmin).

### Nettoyage du dépôt

- Les workflows d'intégration continue hérités de GeoNode (qui ne correspondent pas à notre contexte) ont été retirés.
- Les répertoires obsolètes ont été supprimés des deux dépôts.
- Le README du dépôt orion a été mis à jour.

---

## Ce qui est en cours (bloquant)

### Figer la version de GeoNode

**Pourquoi c'est urgent.** Aujourd'hui, le fichier de dépendances (`requirements.txt`) pointe vers la version en développement continu de GeoNode (`master`). En production, cela signifie qu'une mise à jour automatique de GeoNode pourrait introduire une régression ou une rupture sans que l'équipe en soit informée. Figer une version précise garantit la stabilité et la reproductibilité de l'environnement.

**Ce que cela implique.** Identifier la dernière version stable de GeoNode 5 et l'inscrire explicitement dans le fichier de dépendances.

---

## Ce qui est planifié

### Priorité haute — semaines 1 à 2

#### Intégration continue minimale

**Pourquoi.** Chaque modification du code doit pouvoir être vérifiée automatiquement pour détecter les erreurs avant qu'elles n'atteignent la production. Une chaîne d'intégration continue (CI) — un robot qui reconstruit l'image Docker et vérifie la configuration Django après chaque modification — est le filet de sécurité de base de tout projet sérieux.

**Ce que cela implique.** Configurer un pipeline automatisé sur le dépôt `orion-geonode` qui, à chaque modification :
1. Reconstruit l'image Docker (l'environnement conteneurisé de l'application)
2. Lance une vérification de la configuration Django (`manage.py check`)

#### Documentation de l'environnement de développement

**Pourquoi.** Sans documentation claire, chaque nouveau développeur ou chaque retour après une absence nécessite plusieurs heures de tâtonnement pour remettre l'environnement local en état. Ce coût est évitable.

**Ce que cela implique.** Rédiger un guide pas à pas permettant à un développeur de démarrer l'ensemble de la stack (base de données, GeoServer, GeoNode, interface React) sur sa machine en moins d'une heure.

#### Retrait du remote GeoNode upstream

**Pourquoi.** Le dépôt `orion-geonode` conserve encore un lien vers le dépôt officiel de GeoNode (appelé "remote upstream"). Depuis que GeoNode est installé comme dépendance et non comme code forké, ce lien est sans objet et peut prêter à confusion. Le retirer clarifie la nature du dépôt.

---

### Priorité planifiable

#### Tests smoke automatisés

**Pourquoi.** Les tests smoke (terme technique désignant un ensemble minimal de vérifications fonctionnelles — "est-ce que l'application démarre et répond correctement ?") permettent de détecter rapidement une régression majeure sans dérouler une suite de tests complète.

**Ce que cela implique.** Automatiser les scénarios de validation de bout en bout déjà testés manuellement (upload, WMS, authentification).

---

#### Phase 2 — Intégration ArcGIS Server (date non fixée)

**Pourquoi.** Certains partenaires ou services métier peuvent continuer à s'appuyer sur ArcGIS Server pendant la transition. Une passerelle entre GeoNode et ArcGIS Server permettrait d'assurer la continuité de service et de partager des données dans les deux sens.

**Condition préalable.** Cette phase ne peut pas démarrer sans qu'une décision d'architecture formelle (ADR — Architecture Decision Record, un document qui acte une décision structurante et ses justifications) ait été rédigée et validée. L'ADR précisera le périmètre, les risques et les alternatives envisagées.

---

#### Phase 3 — Outils métier : calepinage solaire (date non fixée)

**Pourquoi.** Le calepinage solaire est un outil d'analyse spatiale spécifique aux besoins métier de l'équipe géomatique. Son développement s'appuie sur les fondations mises en place dans les phases précédentes.

**Condition préalable.** Stabilisation complète de l'infrastructure (phases 1 et 2).

---

## Légende des statuts

| Statut | Signification |
|---|---|
| Terminé | Livré et validé en conditions réelles |
| En cours | Travail actif, bloque la suite |
| Planifie — semaines 1-2 | A faire rapidement, date estimée connue |
| Planifiable | Décidé, date à fixer selon les priorités |
| Conditionnel | Ne peut démarrer qu'après une décision formelle (ADR) |

---

*Dernière mise à jour : 2026-05-20 — par l'agent gardien-doc (Projet Orion)*
