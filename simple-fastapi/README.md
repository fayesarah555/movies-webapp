# 🎬 FastAPI + Neo4j Movies API

## Présentation

Cette API REST permet de gérer une base de films et de personnes (acteurs, réalisateurs, etc.) connectée à Neo4j, avec authentification sécurisée par JWT. Elle propose :
- Endpoints CRUD pour les films et les personnes
- Recherche de films
- Statistiques sur la base
- Authentification par token Bearer (JWT)
- Inscription et connexion des utilisateurs (stockés dans Neo4j)
- Tests automatisés

## Fonctionnalités principales

- **CRUD Films** : Créer, lire, mettre à jour, supprimer des films
- **CRUD Personnes** : Créer, lire des personnes, lister leur filmographie
- **Recherche** : Rechercher des films par titre
- **Statistiques** : Nombre de films, personnes, relations, dernier film ajouté
- **Authentification** :
  - Inscription (`/register`) : création d’un utilisateur (stocké dans Neo4j, mot de passe hashé)
  - Connexion (`/login`) : obtention d’un token JWT
  - Toutes les routes d’écriture sont protégées par Bearer token (JWT ou token statique)

## Démarrage rapide

1. **Cloner le projet**
2. **Configurer Neo4j**
   - Renseigner les variables dans `.env` :
     ```
     NEO4J_URI=neo4j+s://... (Aura ou local)
     NEO4J_USERNAME=...
     NEO4J_PASSWORD=...
     API_TOKEN=supersecret
     ```
3. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```
4. **Lancer le serveur**
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8001 --reload
   ```
   ou depuis la racine :
   ```bash
   uvicorn simple-fastapi.main:app --host 127.0.0.1 --port 8001 --reload
   ```
5. **Accéder à la documentation interactive**
   - Swagger UI : [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

## Authentification

- **Inscription** : `POST /register` (JSON `{ "username": ..., "password": ... }`)
- **Connexion** : `POST /login` (form-data `username`, `password`) → retourne un JWT
- **Utilisation du token** : ajouter le header `Authorization: Bearer <token>` sur toutes les routes protégées

## Endpoints principaux

- `GET /movies` : liste des films
- `GET /movies/{title}` : détails d’un film
- `POST /movies` : créer un film (protégé)
- `PUT /movies/{title}` : mettre à jour un film (protégé)
- `DELETE /movies/{title}` : supprimer un film (protégé)
- `GET /persons` : liste des personnes
- `GET /persons/{name}` : détails d’une personne et filmographie
- `POST /persons` : créer une personne (protégé)
- `POST /movies/{movie_title}/actors` : ajouter un acteur à un film (protégé)
- `GET /search/movies?q=...` : recherche de films
- `GET /stats` : statistiques globales
- `POST /register` : inscription utilisateur
- `POST /login` : connexion utilisateur (JWT)

## Tests automatisés

- Lancer tous les tests :
  ```bash
  python test_crud.py
  ```
- Les tests vérifient :
  - Inscription et login utilisateur (Neo4j)
  - Obtention d’un JWT
  - Tous les endpoints CRUD et recherche
  - Statistiques et intégrité de la base

## Sécurité
- Les mots de passe sont hashés (bcrypt) et jamais stockés en clair.
- Les tokens JWT sont utilisés pour sécuriser toutes les routes d’écriture.
- Les utilisateurs sont stockés dans Neo4j (nœud `:User`).

## Structure du projet

```
simple-fastapi/
  main.py           # Backend FastAPI principal
  test_crud.py      # Tests automatisés
  requirements.txt  # Dépendances
  .env              # Configuration Neo4j et token
```

## Remarques
- Le token statique (`API_TOKEN`) reste accepté pour compatibilité, mais privilégier le JWT.
- Pour réinitialiser les utilisateurs, il suffit de supprimer les nœuds `:User` dans Neo4j.

---
