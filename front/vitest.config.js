// vitest.config.js — configuration du runner de test pour le front Orion
//
// Pourquoi un fichier séparé de vite.config.js ?
// Vitest peut étendre la config Vite existante, mais on le sépare ici pour
// que les options de test ne polluent pas la configuration de build de production.

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // On réutilise le plugin React d'@vitejs/plugin-react pour que Vitest
  // puisse comprendre la syntaxe JSX et les features React (hooks, etc.).
  plugins: [react()],

  test: {
    // 'jsdom' simule un environnement navigateur (window, document, DOM…)
    // dans Node.js. Indispensable pour tester des composants React qui
    // manipulent le DOM, sans ouvrir un vrai navigateur.
    environment: 'jsdom',

    // Les imports de describe/it/expect sont explicites dans chaque fichier
    // de test (pas de globals implicites) pour rester compatible avec ESLint
    // sans configuration supplémentaire.
    globals: false,

    // Fichiers de test reconnus : tout fichier *.test.js ou *.spec.js
    // dans src/, à n'importe quel niveau de profondeur.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
