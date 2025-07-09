# 🎬 FastAPI + Neo4j Movies API

## Présentation

Cette API REST permet de gérer une base de films et de personnes (acteurs, réalisateurs, etc.) connectée à Neo4j, avec authentification sécurisée par JWT. Elle propose :
- Endpoints CRUD pour les films et les personnes (réservés aux admins)
- Recherche de films
- Statistiques sur la base
- Authentification par token Bearer (JWT)
- Inscription et connexion des utilisateurs (stockés dans Neo4j, avec rôle user/admin)
- Gestion des avis utilisateurs sur les films
- Tests automatisés séparés pour les rôles admin et user

## Fonctionnalités principales

- **CRUD Films** : Créer, lire, mettre à jour, supprimer des films (**admin uniquement**)
- **CRUD Personnes** : Créer, lire des personnes, lister leur filmographie (**admin uniquement pour la création**)
- **Recherche** : Rechercher des films par titre
- **Statistiques** : Nombre de films, personnes, relations, dernier film ajouté
- **Avis** : Laisser et consulter des avis sur les films (tous utilisateurs)
- **Authentification** :
  - Inscription (`/register`) : création d’un utilisateur (stocké dans Neo4j, mot de passe hashé, rôle user/admin)
  - Connexion (`/login`) : obtention d’un token JWT
  - Toutes les routes d’écriture sont protégées par Bearer token (JWT)

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
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   ou depuis la racine :
   ```bash
   uvicorn simple-fastapi.main:app --host 127.0.0.1 --port 8000 --reload
   ```
5. **Accéder à la documentation interactive**
   - Swagger UI : [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Authentification & Rôles

- **Inscription** : `POST /register` (JSON `{ "username": ..., "password": ..., "role": "user"|"admin" }`)
- **Connexion** : `POST /login` (form-data `username`, `password`) → retourne un JWT
- **Utilisation du token** : ajouter le header `Authorization: Bearer <token>` sur toutes les routes protégées
- **Rôles** : Seuls les admins peuvent faire du CRUD, les users peuvent lire, rechercher, laisser des avis

## Endpoints principaux

- `GET /movies` : liste des films
- `GET /movies/{title}` : détails d’un film
- `POST /movies` : créer un film (**admin uniquement**)
- `PUT /movies/{title}` : mettre à jour un film (**admin uniquement**)
- `DELETE /movies/{title}` : supprimer un film (**admin uniquement**)
- `GET /persons` : liste des personnes
- `GET /persons/{name}` : détails d’une personne et filmographie
- `POST /persons` : créer une personne (**admin uniquement**)
- `POST /movies/{movie_title}/actors` : ajouter un acteur à un film (**admin uniquement**)
- `GET /search/movies?q=...` : recherche de films
- `GET /stats` : statistiques globales
- `POST /register` : inscription utilisateur
- `POST /login` : connexion utilisateur (JWT)
- `POST /reviews` : laisser un avis sur un film (authentifié)
- `GET /reviews/{movie_title}` : consulter les avis d’un film

## Exemples d'utilisation des routes

### 1. Inscription d'un utilisateur ou admin

**POST /register**
```json
{
  "username": "alice",
  "password": "motdepasse",
  "role": "user"  // ou "admin"
}
```

### 2. Connexion (login)

**POST /login** (form-data)
```
username=alice
password=motdepasse
```
Réponse :
```json
{
  "access_token": "...jwt...",
  "token_type": "bearer"
}
```

### 3. Créer un film (admin uniquement)

**POST /movies**
Header : `Authorization: Bearer <token_admin>`
```json
{
  "title": "The Matrix",
  "released": 1999,
  "tagline": "Welcome to the Real World"
}
```

### 4. Mettre à jour un film (admin uniquement)

**PUT /movies/The Matrix**
Header : `Authorization: Bearer <token_admin>`
```json
{
  "tagline": "Nouveau slogan"
}
```

### 5. Supprimer un film (admin uniquement)

**DELETE /movies/The Matrix**
Header : `Authorization: Bearer <token_admin>`

### 6. Créer une personne (admin uniquement)

**POST /persons**
Header : `Authorization: Bearer <token_admin>`
```json
{
  "name": "Keanu Reeves",
  "born": 1964
}
```

### 7. Ajouter un acteur à un film (admin uniquement)

**POST /movies/The Matrix/actors**
Header : `Authorization: Bearer <token_admin>`
```json
{
  "name": "Keanu Reeves",
  "roles": ["Neo"]
}
```

### 8. Laisser un avis sur un film (user ou admin connecté)

**POST /reviews**
Header : `Authorization: Bearer <token>`
```json
{
  "movie_title": "The Matrix",
  "rating": 5,
  "comment": "Chef d'œuvre !"
}
```

### 9. Rechercher un film

**GET /search/movies?q=matrix**

### 10. Consulter les avis d'un film

**GET /reviews/The Matrix**

### 11. Lire la liste des films ou personnes

**GET /movies**
**GET /persons**

### 12. Détails d'un film ou d'une personne

**GET /movies/The Matrix**
**GET /persons/Keanu Reeves**

---

Chaque requête nécessitant un token doit inclure le header :
```
Authorization: Bearer <votre_token_jwt>
```

Pour tester rapidement, utilisez Swagger UI sur `/docs`.

## Tests automatisés

- **Tests séparés par rôle** :
  - `test_user.py` : tout ce qu’un utilisateur normal peut faire (lecture, recherche, avis, interdiction du CRUD)
  - `test_admin.py` : tout ce qu’un admin peut faire (CRUD complet, ajout d’acteur, etc.)
- **Test de connexion Neo4j** :
  - `test_neo4j.py` : vérifie la connexion à Neo4j, la santé de l’API, les stats, la liste et la recherche de films
- Lancer tous les tests :
  ```bash
  pytest test_neo4j.py -v
  pytest test_user.py -v
  pytest test_admin.py -v
  ```
- Les tests vérifient :
  - Connexion et santé Neo4j
  - Inscription et login utilisateur (Neo4j)
  - Obtention d’un JWT
  - Respect des droits selon le rôle
  - Tous les endpoints CRUD, recherche, avis, statistiques

## Sécurité
- Les mots de passe sont hashés (bcrypt) et jamais stockés en clair.
- Les tokens JWT sont obligatoires pour toutes les routes d’écriture (le token statique n’est plus accepté).
- Les utilisateurs sont stockés dans Neo4j (nœud `:User` avec champ `role`).
- Les messages d’erreur sont explicites en cas d’accès refusé.

## Structure du projet

```
simple-fastapi/
  main.py           # Backend FastAPI principal
  test_neo4j.py     # Test de connexion Neo4j et endpoints publics
  test_user.py      # Tests utilisateur normal
  test_admin.py     # Tests administrateur
  requirements.txt  # Dépendances
  .env              # Configuration Neo4j et clé JWT
```

## Remarques
- Pour réinitialiser les utilisateurs, il suffit de supprimer les nœuds `:User` dans Neo4j.
- Les avis sont stockés comme relations `RATED` entre User et Movie (1 avis par user/film).
- Le projet est prêt pour une extension future (suppression d’avis, rôles multiples, etc.).

---
