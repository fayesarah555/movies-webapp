#!/usr/bin/env python3
"""
Tests CRUD pour l'API Movies avec Neo4j
"""

import requests
import json
import time
import random

# Configuration
BASE_URL = "http://127.0.0.1:8001"
API_TOKEN = "supersecret"
HEADERS_AUTH = {"Authorization": f"Bearer {API_TOKEN}"}

def test_register():
    """Test de l'inscription d'un nouvel utilisateur (Neo4j)"""
    print("📝 Test /register (inscription utilisateur)")
    username = f"testuser{random.randint(1000,9999)}"
    user_data = {"username": username, "password": "testpass123"}
    response = requests.post(f"{BASE_URL}/register", json=user_data)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Utilisateur inscrit: {data['username']}")
    elif response.status_code == 400 and 'already exists' in response.text:
        print(f"   ⚠️  Utilisateur déjà existant")
    else:
        print(f"   ❌ Erreur: {response.status_code} {response.text}")
    print()
    return username, user_data["password"]

def test_login(username, password):
    """Test du login utilisateur et récupération du token JWT (Neo4j)"""
    print("🔑 Test /login (authentification)")
    data = {"username": username, "password": password}
    response = requests.post(f"{BASE_URL}/login", data=data)
    if response.status_code == 200:
        token = response.json().get("access_token")
        print(f"   ✅ Token reçu: {token[:20]}...")
        return token
    else:
        print(f"   ❌ Erreur: {response.status_code} {response.text}")
    print()
    return None

def test_crud_operations():
    """Test complet des opérations CRUD"""
    print("🎬 Tests CRUD pour l'API Movies")
    print("=" * 50)
    
    # 1. Statistiques initiales
    print("📊 1. Statistiques de la base de données")
    response = requests.get(f"{BASE_URL}/stats")
    if response.status_code == 200:
        stats = response.json()["stats"]
        print(f"   Films: {stats['movies_count']}")
        print(f"   Personnes: {stats['persons_count']}")
        print(f"   Relations ACTED_IN: {stats['relationships']['acted_in']}")
        print(f"   Dernier film: {stats['latest_movie']['title']} ({stats['latest_movie']['released']})")
    print()
    
    # 2. Récupérer tous les films (READ)
    print("📚 2. Récupération des films")
    response = requests.get(f"{BASE_URL}/movies?limit=5")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ {data['count']} films récupérés")
        for movie in data['movies'][:3]:
            print(f"   - {movie['title']} ({movie['released']})")
    print()
    
    # 3. Récupérer un film spécifique
    print("🔍 3. Détails d'un film spécifique")
    response = requests.get(f"{BASE_URL}/movies/The Matrix")
    if response.status_code == 200:
        movie = response.json()["movie"]
        print(f"   ✅ Film: {movie['title']}")
        print(f"   Tagline: {movie['tagline']}")
        print(f"   Acteurs: {len([a for a in movie['actors'] if a['name']])} acteurs")
        print(f"   - {movie['actors'][0]['name']} ({movie['actors'][0]['roles']})")
    print()
    
    # 4. Recherche de films
    print("🔎 4. Recherche de films")
    response = requests.get(f"{BASE_URL}/search/movies?q=matrix")
    if response.status_code == 200:
        data = response.json()
        if "count" in data:
            print(f"   ✅ {data['count']} films trouvés pour 'matrix'")
            for movie in data['movies']:
                print(f"   - {movie['title']} ({movie['released']})")
        else:
            print(f"   ⚠️  Réponse inattendue: {data}")
    else:
        print(f"   ❌ Erreur HTTP: {response.status_code}")
    print()
    
    # 5. Créer un nouveau film (CREATE)
    print("➕ 5. Création d'un nouveau film")
    new_movie = {
        "title": "Test Movie API",
        "released": 2025,
        "tagline": "Un film de test pour l'API"
    }
    response = requests.post(f"{BASE_URL}/movies", json=new_movie, headers=HEADERS_AUTH)
    if response.status_code == 200:
        result = response.json()
        if result["status"] == "success":
            print(f"   ✅ Film créé: {new_movie['title']}")
        else:
            print(f"   ⚠️  {result['message']}")
    print()
    
    # 6. Créer une nouvelle personne
    print("👤 6. Création d'une nouvelle personne")
    new_person = {
        "name": "Test Actor API",
        "born": 1990
    }
    response = requests.post(f"{BASE_URL}/persons", json=new_person, headers=HEADERS_AUTH)
    if response.status_code == 200:
        result = response.json()
        if result["status"] == "success":
            print(f"   ✅ Personne créée: {new_person['name']}")
        else:
            print(f"   ⚠️  {result['message']}")
    print()
    
    # 7. Ajouter un acteur au film
    print("🎭 7. Ajout d'un acteur au film")
    actor_data = {
        "name": "Test Actor API",
        "roles": ["Protagoniste"]
    }
    response = requests.post(f"{BASE_URL}/movies/Test Movie API/actors", json=actor_data, headers=HEADERS_AUTH)
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ {result['message']}")
    print()
    
    # 8. Mettre à jour le film (UPDATE)
    print("✏️  8. Mise à jour du film")
    update_data = {
        "tagline": "Un film de test mis à jour pour l'API"
    }
    response = requests.put(f"{BASE_URL}/movies/Test Movie API", json=update_data, headers=HEADERS_AUTH)
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ {result['message']}")
    print()
    
    # 9. Vérifier la mise à jour
    print("🔍 9. Vérification de la mise à jour")
    response = requests.get(f"{BASE_URL}/movies/Test Movie API")
    if response.status_code == 200:
        movie = response.json()["movie"]
        print(f"   ✅ Nouveau tagline: {movie['tagline']}")
        print(f"   Acteurs: {len([a for a in movie['actors'] if a['name']])} acteur(s)")
    print()
    
    # 10. Récupérer les détails de la personne
    print("👤 10. Détails de la personne créée")
    response = requests.get(f"{BASE_URL}/persons/Test Actor API")
    if response.status_code == 200:
        person = response.json()["person"]
        print(f"   ✅ Personne: {person['name']} (né en {person['born']})")
        print(f"   Films: {len([m for m in person['acted_in'] if m['movie']])} film(s)")
    print()
    
    # 11. Supprimer le film de test (DELETE)
    print("🗑️  11. Suppression du film de test")
    response = requests.delete(f"{BASE_URL}/movies/Test Movie API", headers=HEADERS_AUTH)
    if response.status_code == 200:
        result = response.json()
        print(f"   ✅ {result['message']}")
    print()
    
    # 12. Statistiques finales
    print("📊 12. Statistiques finales")
    response = requests.get(f"{BASE_URL}/stats")
    if response.status_code == 200:
        stats = response.json()["stats"]
        print(f"   Films: {stats['movies_count']}")
        print(f"   Personnes: {stats['persons_count']}")
    print()
    
    print("🎉 Tests CRUD terminés avec succès!")

def test_real_data_queries():
    """Test avec des données réelles de la base"""
    print("\n🎭 Tests avec les données réelles")
    print("=" * 50)
    
    # Test avec des acteurs célèbres
    famous_actors = ["Keanu Reeves", "Tom Hanks", "Jack Nicholson"]
    
    for actor in famous_actors:
        print(f"\n🌟 Filmographie de {actor}:")
        response = requests.get(f"{BASE_URL}/persons/{actor}")
        if response.status_code == 200:
            person = response.json()["person"]
            if actor == "Keanu Reeves":
                print(f"   [DEBUG] Réponse brute: {json.dumps(person, indent=2, ensure_ascii=False)}")
            acted_movies = [m for m in person['acted_in'] if m['movie']]
            directed_movies = [m for m in person['directed'] if m]
            
            print(f"   ✅ {len(acted_movies)} films en tant qu'acteur")
            for movie in acted_movies[:3]:  # Top 3
                print(f"   - {movie['movie']} {movie['roles']}")
            
            if directed_movies:
                print(f"   🎬 {len(directed_movies)} films dirigés")
                for movie in directed_movies[:2]:
                    print(f"   - {movie}")
        else:
            print(f"   ❌ {actor} non trouvé")

if __name__ == "__main__":
    print("🔍 Vérification du serveur...")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print(f"❌ Serveur non accessible sur {BASE_URL}")
            exit(1)
    except:
        print(f"❌ Serveur non accessible sur {BASE_URL}")
        print("💡 Assurez-vous que le serveur est démarré avec:")
        print("   uvicorn main:app --host 127.0.0.1 --port 8001 --reload")
        exit(1)
    
    print(f"✅ Serveur accessible sur {BASE_URL}")
    
    # Exécuter les tests
    username, password = test_register()
    token = test_login(username, password)
    test_crud_operations()
    test_real_data_queries()
