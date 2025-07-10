# Frontend React (Vite + TypeScript) pour Movies API

Ce projet est une interface web moderne pour l’API FastAPI/Neo4j Movies.

## Fonctionnalités prévues
- Authentification JWT (login, inscription)
- Liste des films, détail d’un film (avec avis et acteurs)
- CRUD films/personnes (admin)
- Recherche, statistiques, recommandations
- Gestion du token JWT côté client (localStorage ou context React)
- Utilisation d’Axios pour les requêtes HTTP
- Configuration de l’URL de l’API backend via `.env`
- UI claire, responsive, navigation simple

## Démarrage rapide

1. Copier le fichier `.env` et adapter l’URL de l’API si besoin.
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
4. Accéder à l’interface sur [http://localhost:5173](http://localhost:5173)

## Structure de base
- `src/api.ts` : configuration Axios et gestion du token JWT
- `src/` : composants React (à créer)
- `.env` : configuration de l’URL backend

## À faire
- Créer les pages et composants React pour chaque fonctionnalité
- Sécuriser les routes selon le rôle utilisateur
- Ajouter une navigation claire et responsive

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
