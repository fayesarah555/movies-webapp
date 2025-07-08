# 🎬 Movie Database API

Une API complète pour une base de données de films construite avec **FastAPI** et **Neo4j**.

## 🚀 Démarrage rapide

### 1. Installation des dépendances

```bash
cd backend
python -m pip install -r requirements.txt
```

### 2. Configuration de Neo4j

**Option A: Avec Docker (recommandé)**
```bash
# Démarrer Neo4j
docker-compose up -d

# Vérifier que Neo4j fonctionne
docker-compose logs neo4j
```

**Option B: Installation locale**
- Télécharger Neo4j Desktop
- Créer une base de données avec le mot de passe `motdepasse123`

### 3. Configuration de l'environnement

Le fichier `.env` est déjà configuré avec :
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=motdepasse123
SECRET_KEY=votre-cle-secrete-super-longue-et-complexe-ici-123456789
```

### 4. Initialisation de la base de données

```bash
# Initialiser la structure et créer des données d'exemple
python database/init_db.py
```

### 5. Démarrage de l'API

```bash
# Démarrer l'API en mode développement
uvicorn main:app --reload
```

## 🎯 Accès aux interfaces

- **API Documentation**: http://localhost:8000/docs
- **API Alternative**: http://localhost:8000/redoc  
- **Neo4j Browser**: http://localhost:7474
- **Health Check**: http://localhost:8000/health

## 🔐 Comptes par défaut

**Administrateur**
- Email: `admin@moviedb.com`
- Mot de passe: `admin123`

## 📚 Endpoints principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Films
- `GET /api/movies/` - Liste des films
- `GET /api/movies/{id}` - Détails d'un film
- `POST /api/movies/` - Créer un film (admin)
- `DELETE /api/movies/{id}` - Supprimer un film (admin)
- `GET /api/movies/search/?q=terme` - Rechercher des films

### Avis
- `POST /api/ratings/` - Créer/modifier un avis
- `GET /api/ratings/movie/{movie_id}` - Avis d'un film
- `GET /api/ratings/user/me` - Mes avis
- `DELETE /api/ratings/{movie_id}` - Supprimer mon avis

### Utilisateurs
- `GET /api/users/` - Liste des utilisateurs (admin)
- `GET /api/users/{id}` - Profil utilisateur
- `GET /api/users/{id}/stats` - Statistiques utilisateur

## 🧪 Test rapide

### 1. Créer un compte utilisateur
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Se connecter
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Récupérer la liste des films
```bash
curl "http://localhost:8000/api/movies/"
```

## 🛠️ Développement

### Structure du projet
```
backend/
├── main.py                 # Point d'entrée de l'API
├── requirements.txt        # Dépendances Python
├── .env                   # Variables d'environnement
├── docker-compose.yml     # Configuration Neo4j
├── app/
│   ├── models/
│   │   └── schemas.py     # Modèles Pydantic
│   ├── routes/           # Endpoints de l'API
│   │   ├── auth.py
│   │   ├── movies.py
│   │   ├── ratings.py
│   │   └── users.py
│   ├── services/         # Logique métier
│   │   └── user_service.py
│   ├── auth/            # Authentification
│   │   └── dependencies.py
│   └── database/        # Connexion Neo4j
│       └── connection.py
└── database/
    └── init_db.py       # Script d'initialisation
```

### Commandes utiles

```bash
# Redémarrer Neo4j
docker-compose restart neo4j

# Voir les logs de l'API
uvicorn main:app --reload --log-level debug

# Réinitialiser la base de données
python database/init_db.py

# Tester l'API
python -m pytest  # (à configurer)
```

## 🔧 Résolution de problèmes

### Neo4j ne démarre pas
```bash
# Vérifier les logs
docker-compose logs neo4j

# Redémarrer complètement
docker-compose down
docker-compose up -d
```

### Erreur de connexion à la base
1. Vérifier que Neo4j fonctionne : http://localhost:7474
2. Vérifier les credentials dans `.env`
3. Tester la connexion : `python database/init_db.py`

### Erreur d'import Python
```bash
# S'assurer d'être dans le bon répertoire
cd backend

# Vérifier l'installation des dépendances
pip install -r requirements.txt
```

## 🎯 Prochaines étapes

1. **Frontend React** - Créer l'interface utilisateur
2. **Fonctionnalités avancées** - Recommandations, favoris, historique
3. **Upload d'images** - Posters et photos d'acteurs
4. **API externe** - Intégration TMDB/OMDB
5. **Tests** - Tests unitaires et d'intégration
6. **Déploiement** - Docker, CI/CD

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la section "Résolution de problèmes"
2. Consultez les logs : `docker-compose logs neo4j`
3. Testez la santé de l'API : http://localhost:8000/health

---

🎬 **Bon développement !** Votre API de films est maintenant prête à être utilisée et étendue.