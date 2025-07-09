#!/usr/bin/env python3
"""
Script pour tester la création de films avec personnes
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_movie_creation_with_people():
    """Test de création d'un film avec acteurs, réalisateurs et producteurs"""
    
    # 1. Créer un utilisateur admin
    print("1. Création d'un utilisateur admin...")
    admin_data = {
        "username": "admin_test",
        "password": "admin123",
        "role": "admin"
    }
    
    # Inscription
    register_response = requests.post(f"{BASE_URL}/register", json=admin_data)
    print(f"Inscription: {register_response.status_code}")
    
    # Connexion
    login_data = {
        "username": "admin_test",
        "password": "admin123"
    }
    login_response = requests.post(f"{BASE_URL}/login", data=login_data)
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Connexion: {login_response.status_code}")
    
    # 2. Créer un film avec personnes
    print("\n2. Création d'un film avec personnes...")
    movie_data = {
        "title": "Test Movie with People",
        "released": 2024,
        "tagline": "A test movie with full cast and crew",
        "directors": ["Christopher Nolan", "Quentin Tarantino"],
        "producers": ["Warner Bros", "Legendary Pictures"],
        "actors": [
            {"name": "Leonardo DiCaprio", "roles": ["Dom Cobb"]},
            {"name": "Marion Cotillard", "roles": ["Mal Cobb"]},
            {"name": "Tom Hardy", "roles": ["Eames"]}
        ]
    }
    
    create_response = requests.post(f"{BASE_URL}/movies", json=movie_data, headers=headers)
    print(f"Création du film: {create_response.status_code}")
    print(f"Réponse: {create_response.json()}")
    
    # 3. Vérifier que le film a été créé avec toutes les relations
    print("\n3. Vérification du film créé...")
    movie_response = requests.get(f"{BASE_URL}/movies/Test Movie with People")
    print(f"Récupération du film: {movie_response.status_code}")
    if movie_response.status_code == 200:
        movie_details = movie_response.json()
        print(f"Détails du film: {json.dumps(movie_details, indent=2)}")
    
    # 4. Tester les endpoints de personnes
    print("\n4. Test des endpoints de personnes...")
    
    # Récupérer les films de Leonardo DiCaprio
    actor_response = requests.get(f"{BASE_URL}/actors/Leonardo DiCaprio/movies")
    print(f"Films de Leonardo DiCaprio: {actor_response.status_code}")
    if actor_response.status_code == 200:
        print(f"Réponse: {json.dumps(actor_response.json(), indent=2)}")
    
    # Récupérer les acteurs du film
    cast_response = requests.get(f"{BASE_URL}/movies/Test Movie with People/actors")
    print(f"Acteurs du film: {cast_response.status_code}")
    if cast_response.status_code == 200:
        print(f"Réponse: {json.dumps(cast_response.json(), indent=2)}")
    
    # 5. Test de modification
    print("\n5. Test de modification du film...")
    update_data = {
        "tagline": "Updated tagline",
        "directors": ["Christopher Nolan"],  # Enlever Tarantino
        "actors": [
            {"name": "Leonardo DiCaprio", "roles": ["Dom Cobb", "Narrator"]},  # Ajouter un rôle
            {"name": "Tom Hardy", "roles": ["Eames"]}  # Enlever Marion Cotillard
        ]
    }
    
    update_response = requests.put(f"{BASE_URL}/movies/Test Movie with People", json=update_data, headers=headers)
    print(f"Modification du film: {update_response.status_code}")
    print(f"Réponse: {update_response.json()}")
    
    # 6. Vérifier les modifications
    print("\n6. Vérification des modifications...")
    updated_movie_response = requests.get(f"{BASE_URL}/movies/Test Movie with People")
    if updated_movie_response.status_code == 200:
        updated_movie = updated_movie_response.json()
        print(f"Film modifié: {json.dumps(updated_movie, indent=2)}")
    
    # 7. Nettoyage - supprimer le film de test
    print("\n7. Nettoyage...")
    delete_response = requests.delete(f"{BASE_URL}/movies/Test Movie with People", headers=headers)
    print(f"Suppression du film: {delete_response.status_code}")
    print(f"Réponse: {delete_response.json()}")

if __name__ == "__main__":
    try:
        test_movie_creation_with_people()
    except Exception as e:
        print(f"Erreur: {e}")
        import traceback
        traceback.print_exc()
