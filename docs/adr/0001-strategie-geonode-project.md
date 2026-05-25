# ADR 0001 — Stratégie d'organisation du dépôt GeoNode : fork ou geonode-project ?

**Date** : 2026-05-19
**Statut** : Implémenté (2026-05-19)
**Décideurs** : Directeur équipe géomatique (Dimytdino), architecte SIG Orion
**À valider avant** : toute migration du dépôt `orion-geonode` ou modification structurante du `docker-compose.yml`

---

## Contexte

### La situation actuelle

Le projet Orion repose sur deux dépôts Git distincts :

- **`orion`** : contient le front-end cartographique (React + OpenLayers), la configuration Docker, et la documentation.
- **`orion-geonode`** : contient une copie intégrale du code source de GeoNode (le "coeur"), avec quelques modifications locales :
  - augmentation de la taille maximale d'upload de fichiers
  - ajustement du paramètre `harakiri` de uWSGI (uWSGI = le serveur qui fait tourner l'application Django derrière Nginx ; `harakiri` = délai au-delà duquel uWSGI tue un processus trop lent)

En pratique, le `docker-compose.yml` de `orion` monte le dossier `orion-geonode` dans le conteneur Django via un volume, ce qui revient à remplacer le code GeoNode d'origine par notre version modifiée.

### Pourquoi cette décision se pose maintenant

Ce montage fonctionne pour un POC local. Mais il crée une dette structurelle : chaque mise à jour de GeoNode upstream (corrections de bugs, nouvelles fonctionnalités, correctifs de sécurité) doit être intégrée manuellement dans notre fork — un travail de fond coûteux et risqué.

La communauté GeoNode a anticipé ce problème et propose une solution : le **template `geonode-project`**.

### Qu'est-ce que geonode-project ?

`geonode-project` (https://github.com/GeoNode/geonode-project) est le gabarit officiel pour créer un projet GeoNode personnalisé. Son principe fondamental : **GeoNode devient une dépendance de bibliothèque** (installée via `pip`, le gestionnaire de paquets Python), et non plus un code que l'on modifie directement.

Pour faire une analogie : plutôt que de modifier le moteur d'une voiture de série pour l'adapter à ses besoins, on commande la voiture en précisant les options souhaitées — on garde la garantie constructeur et les mises à jour automatiques.

Concrètement, `geonode-project` permet de :
- surcharger les paramètres de configuration (fichiers `settings.py`)
- personnaliser les gabarits HTML et les fichiers CSS/JS (templates et statics)
- ajouter des commandes Django spécifiques au projet
- créer des applications Django supplémentaires (nouvelles fonctionnalités métier)

...sans jamais toucher au code source de GeoNode lui-même.

---

## Options envisagées

### Option A — Continuer avec le fork actuel (`orion-geonode`)

**Description** : conserver `orion-geonode` comme dépôt fork du coeur GeoNode, y appliquer les modifications directement dans le code source, et monter ce dossier dans Docker via un volume.

| Avantages | Inconvénients |
|---|---|
| Aucune migration à faire — fonctionne déjà | Mises à jour GeoNode entièrement manuelles (risque de sécurité) |
| Liberté totale de modification | Conflit potentiel à chaque merge upstream |
| Familier pour quelqu'un habitué à Git basique | Impossible de distinguer "notre code" du "code GeoNode" |
| | Pratique non recommandée par la communauté GeoNode |
| | Difficile à onboarder pour un nouveau contributeur |
| | Pas scalable vers l'industrialisation |

**Verdict** : acceptable uniquement pour un POC de très courte durée, non viable à moyen terme.

---

### Option B — Migrer vers `geonode-project` (template officiel)

**Description** : créer un nouveau dépôt basé sur le gabarit `geonode-project`. GeoNode est installé comme une bibliothèque pip (ex : `geonode==4.4.x`). Les personnalisations actuelles (upload size, uWSGI) sont reportées dans les fichiers de configuration prévus à cet effet.

| Avantages | Inconvénients |
|---|---|
| Mises à jour GeoNode réduites à un changement de numéro de version | Migration à planifier (travail ponctuel estimé : 1 à 2 jours) |
| Séparation claire entre "code Orion" et "code GeoNode" | Nécessite de comprendre la structure du gabarit avant de commencer |
| Architecture recommandée et documentée par la communauté | Le gabarit peut avoir des décalages avec la version GeoNode utilisée |
| Compatible avec une industrialisation future (CI/CD, Kubernetes) | |
| Facilite les contributions de nouveaux membres d'équipe | |
| Toutes les personnalisations dans un seul dépôt cohérent | |

**Verdict** : solution structurellement saine, effort de migration raisonnable, gain durable.

---

### Option C — Fusionner tout dans un seul dépôt (`orion`) sans geonode-project

**Description** : rapatrier les modifications GeoNode directement dans `orion`, en conservant un sous-dossier dédié, sans utiliser le gabarit officiel.

| Avantages | Inconvénients |
|---|---|
| Un seul dépôt à gérer | Mêmes problèmes que l'Option A sur les mises à jour upstream |
| Simplifie l'organisation superficielle | Structure non standard, difficile à documenter |
| | Mélange des responsabilités : infra, front, et fork GeoNode dans un même endroit |

**Verdict** : à écarter. Cette option cumule les inconvénients des deux autres sans en reprendre les avantages.

---

## Décision

**Option retenue : Option B — Migration vers `geonode-project`.**

### Pourquoi

Les deux modifications actuelles dans `orion-geonode` (taille d'upload et timeout uWSGI) sont des paramètres de configuration, pas des modifications du coeur applicatif. Elles trouvent leur place naturelle dans les fichiers de settings de `geonode-project` sans la moindre perte fonctionnelle.

En contrepartie, conserver un fork expose le projet à un risque structurel dès la première mise à jour de sécurité GeoNode : merger manuellement plusieurs mois d'évolutions upstream est une opération délicate, même pour un développeur expérimenté.

La migration vers `geonode-project` est le choix qui maximise la maintenabilité future tout en restant proportionné à l'effort — un critère central en phase POC.

### Ce que l'on ne décide pas encore ici

- Le nommage du nouveau dépôt — **décidé** : `orion-geonode` (dépôt déjà créé sur GitHub : https://github.com/Dimytdino/orion-geonode)
- La consolidation éventuelle en mono-dépôt (front + plateforme) — à traiter dans un ADR dédié si la question se pose
- La version GeoNode cible à figer dans le `requirements.txt`

---

## Conséquences

### Gains attendus

- **Maintenabilité** : une mise à jour GeoNode devient une modification d'une ligne (`geonode==X.Y.Z` dans `requirements.txt` — le fichier qui liste les bibliothèques Python nécessaires au projet).
- **Clarté** : tout ce qui est dans le dépôt "Orion" est du code Orion. Plus de mélange avec le code upstream.
- **Confiance** : on suit la voie recommandée par la communauté GeoNode, ce qui facilite la recherche de solutions et l'aide en ligne.
- **Industrialisation** : la structure `geonode-project` est celle que les intégrateurs GeoNode connaissent ; elle s'adapte directement à un pipeline CI/CD (intégration continue — automatisation des tests et du déploiement) et à Kubernetes.

### Travail induit

- Initialiser le dépôt `orion-geonode` (déjà créé sur GitHub) à partir du gabarit `geonode-project`.
- Reporter les deux paramètres actuels (`DEFAULT_MAX_UPLOAD_SIZE`, timeout uWSGI) dans les fichiers de configuration du gabarit.
- Mettre à jour le `docker-compose.yml` dans `orion` pour pointer vers la nouvelle image construite à partir du gabarit.
- Valider que le POC fonctionne à l'identique après migration (tests manuels sur les fonctions clés : upload de couche, affichage WMS, authentification).
- Mettre à jour ce CLAUDE.md et le README une fois la migration confirmée.

### Risques résiduels

- **Décalage de version** : le gabarit `geonode-project` est parfois en légère avance ou en retard par rapport à la version GeoNode utilisée. Vérifier la compatibilité avant de lancer la migration.
- **Perte de la configuration locale** : le `.env` actuel contient de nombreux paramètres ; s'assurer qu'ils sont tous reportés dans la nouvelle configuration.

---

## Références

- Template officiel : https://github.com/GeoNode/geonode-project
- Documentation GeoNode sur la personnalisation : https://docs.geonode.org/en/master/install/advanced/project/index.html
- Dépôt actuel à migrer : https://github.com/Dimytdino/orion-geonode
