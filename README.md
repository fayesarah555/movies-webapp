# 🎬 Movies Database - Application Web

Une application web moderne pour explorer et gérer une base de données de films utilisant **React** (front-end), **FastAPI** (backend) et **Neo4j** (base de données graphique).

## 📋 Fonctionnalités

- **Navigation intuitive** : Interface utilisateur moderne et responsive
- **Liste des films** : Affichage paginé de tous les films
- **Recherche avancée** : Recherche floue et tolérante aux erreurs
- **Détails complets** : Informations détaillées sur les films, acteurs, réalisateurs
- **Recommandations** : Suggestions de films similaires
- **Monitoring** : Vérification de l'état des services (API + Neo4j)

## 🏗️ Architecture

```
movies-webapp/
├── front/           # Application React + Vite
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── api.ts        # Configuration API et types
│   │   ├── App.tsx       # Composant principal
│   │   └── App.css       # Styles CSS
│   └── package.json
├── simple-fastapi/  # API FastAPI
│   ├── main.py           # Point d'entrée API
│   └── requirements.txt  # Dépendances Python
├── db/             # Scripts et données Neo4j
└── start.ps1       # Script de démarrage Windows
```

## 🚀 Installation et Configuration

### Prérequis

- **Node.js** (version 18+)
- **Python** (version 3.8+)
- **Neo4j** (version 4.0+)

### 1. Installation des dépendances

#### Front-end (React)
```bash
cd front
npm install
```

#### Backend (FastAPI)
```bash
cd simple-fastapi
pip install -r requirements.txt
```

### 2. Configuration de Neo4j

1. Démarrez Neo4j Desktop ou Neo4j Server
2. Créez une base de données (par défaut : `bolt://localhost:7687`)
3. Importez les données avec le script fourni :
   ```bash
   cd db
   # Exécutez le script d'import CQL
   ```

### 3. Variables d'environnement

#### Front-end (`front/.env`)
```env
VITE_API_URL=http://localhost:8000
```

#### Backend (`simple-fastapi/.env`)
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
```

## 🏃‍♂️ Démarrage

### Option 1 : Script automatique (Windows)
```powershell
# Exécuter le script PowerShell
.\start.ps1
```

### Option 2 : Démarrage manuel

#### 1. Démarrer l'API
```bash
cd simple-fastapi
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Démarrer le front-end
```bash
cd front
npm run dev
```

### 3. Accès à l'application

- **Front-end** : http://localhost:5173
- **API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

## 🔧 Fonctionnalités Détaillées

### Interface Utilisateur

#### 1. Liste des Films
- Affichage en grille responsive
- Pagination avec "Charger plus"
- Clic sur un film pour voir les détails

#### 2. Recherche
- Recherche en temps réel
- Algorithme de similarité floue
- Résultats instantanés

#### 3. Détails des Films
- Informations complètes (titre, année, tagline)
- Distribution complète avec rôles
- Réalisateurs et producteurs
- Recommandations de films similaires

#### 4. Monitoring
- État de l'API FastAPI
- Connexion Neo4j
- Détails de la base de données

### API Endpoints

#### Films
- `GET /movies` - Liste paginée des films
- `GET /movies/{title}` - Détails d'un film
- `GET /search/movies?q={query}` - Recherche de films

#### Recommandations
- `GET /recommend/movies/similar/{title}` - Films similaires

#### Santé
- `GET /health` - État de l'API
- `GET /neo4j/test` - Test de connexion Neo4j

## 🎨 Personnalisation

### Styles CSS
Le fichier `front/src/App.css` contient tous les styles personnalisables :
- Couleurs et thèmes
- Responsive design
- Animations et transitions

### Configuration API
Le fichier `front/src/api.ts` centralise :
- Configuration axios
- Types TypeScript
- Gestion des erreurs
- Authentification JWT (préparée)

## 🔐 Sécurité

### CORS
L'API est configurée pour accepter les requêtes depuis :
- `http://localhost:3000` (React dev server)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:8080` (autres serveurs de dev)

### Authentification
Le code est préparé pour l'authentification JWT :
- Gestion des tokens
- Intercepteurs axios
- Redirection automatique en cas d'expiration

## 📊 Monitoring et Débogage

### Logs
- L'API affiche les connexions et erreurs
- Le front-end gère les erreurs avec des messages utilisateur

### Outils de développement
- **React DevTools** pour le debugging front-end
- **FastAPI Swagger** pour tester l'API
- **Neo4j Browser** pour explorer la base de données

## 🚨 Dépannage

### Problèmes courants

#### 1. Erreur de connexion Neo4j
```
❌ Neo4j n'est pas en cours d'exécution sur le port 7687
```
**Solution** : Vérifiez que Neo4j est démarré et accessible.

#### 2. Erreur CORS
```
Access to XMLHttpRequest at 'http://localhost:8000' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solution** : Vérifiez la configuration CORS dans `main.py`.

#### 3. Erreur de dépendances
```
Module not found: axios
```
**Solution** : 
```bash
cd front
npm install axios
```

#### 4. Port déjà utilisé
```
Error: listen EADDRINUSE: address already in use :::8000
```
**Solution** : Arrêtez les processus existants ou changez le port.

## 🛠️ Développement

### Structure du code

#### Front-end
- **Components** : Composants React réutilisables
- **API Layer** : Centralisation des appels API
- **Types** : Définitions TypeScript pour la sécurité

#### Backend
- **FastAPI** : API REST moderne et rapide
- **Neo4j Driver** : Connexion à la base de données
- **Pydantic** : Validation des données

### Bonnes pratiques
- Gestion d'erreurs robuste
- Loading states pour l'UX
- Types TypeScript stricts
- Code modulaire et réutilisable

## 📈 Performance

### Optimisations
- Pagination pour les grandes listes
- Debouncing pour la recherche
- Lazy loading des détails
- Cache des requêtes

### Monitoring
- Timeouts configurables
- Retry automatique
- Indicateurs de performance

## 🤝 Contribution

Pour contribuer au projet :

1. Fork le repository
2. Créez une branche feature
3. Commitez vos changements
4. Poussez vers la branche
5. Créez une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Créé avec ❤️ en utilisant React, FastAPI et Neo4j**
