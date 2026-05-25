import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Vite 8 / Rolldown utilise le runtime JSX classique (React.createElement).
      // React doit donc être importé dans tout fichier .jsx, mais ESLint ne voit
      // pas cette utilisation implicite et le signale comme "inutilisé".
      // On exclut React du contrôle no-unused-vars plutôt que de lutter contre
      // le runtime bundler.
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
    },
  },
])
