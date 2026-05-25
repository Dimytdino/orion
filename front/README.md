# Front — Orion

Application cartographique du projet Orion. React 19 + OpenLayers 10, en projection EPSG:2154 (Lambert 93). Données servies par GeoNode / GeoServer.

---

## Prérequis

- **Node.js 20+** (LTS recommandé)
- **npm 10+**

---

## Installation

```bash
cd front
npm install
```

---

## Lancer l'application en développement

```bash
npm run dev
```

L'application est accessible sur `http://localhost:5173` (port par défaut de Vite).

---

## Commandes disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement avec HMR |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualiser le build de production en local |
| `npm run lint` | Vérification ESLint |
| `npm test` | Lancer tous les tests Vitest (une seule passe, mode CI) |
| `npm run test:watch` | Lancer Vitest en mode watch (rechargement à chaque sauvegarde) |

---

## Tests

Les tests utilisent **Vitest** avec l'environnement **jsdom** (simulation de navigateur).

```bash
# Exécuter tous les tests une fois (mode CI)
npm test

# Exécuter en mode watch (développement)
npm run test:watch
```

Les fichiers de test suivent la convention `*.test.js` ou `*.spec.js` dans `src/`.

**Exemple de sortie attendue :**

```
✓ src/tests/sanity.test.js (2 tests)

Test Files  1 passed (1)
     Tests  2 passed (2)
```

---

## Variables d'environnement

Copier `.env.sample` en `.env` et renseigner les valeurs locales :

```bash
cp .env.sample .env
```

> Le fichier `.env` ne doit jamais être commité. Seul `.env.sample` (avec des placeholders) est versionné.

---

## Structure du code

```
front/src/
├── App.jsx           # Composant racine
├── main.jsx          # Point d'entrée (montage React)
├── components/       # Composants actuels (avant refactor FE-001B)
│   ├── Map.jsx
│   ├── LayerPanel.jsx
│   └── SearchBar.jsx
└── tests/            # Tests Vitest
    └── sanity.test.js
```

> **Note :** La structure sera réorganisée en architecture feature-based lors du ticket FE-001B (après validation de ADR-0003). Voir `docs/adr/0003-architecture-feature-based-frontend.md`.

---

## Documentation

- **SPEC** : `docs/specs/SPEC-2026-001-frontend-orion-poc.md` — spécification complète du frontend POC
- **ADR** : `docs/adr/` — décisions d'architecture (TypeScript différé, feature-based, React Query)
- **ROADMAP** : `docs/ROADMAP.md`
