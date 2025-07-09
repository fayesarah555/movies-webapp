"""
Tests pour les fonctionnalités accessibles à un administrateur (role 'admin').
"""
import pytest
import httpx
import time

BASE_URL = "http://localhost:8000"

@pytest.fixture(scope="module")
def admin_token():
    username = "adminuser"
    password = "adminpass"
    # Register
    httpx.post(f"{BASE_URL}/register", json={"username": username, "password": password, "role": "admin"})
    # Login
    resp = httpx.post(f"{BASE_URL}/login", data={"username": username, "password": password})
    token = resp.json()["access_token"]
    return token

@pytest.fixture(scope="module")
def unique_movie_title():
    # Génère un titre unique pour tous les tests du module
    return f"Test Movie {int(time.time() * 1000)}"

def test_create_movie(admin_token, unique_movie_title):
    headers = {"Authorization": f"Bearer {admin_token}"}
    data = {"title": unique_movie_title, "released": 2025, "tagline": "Test tagline"}
    resp = httpx.post(f"{BASE_URL}/movies", json=data, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

def test_update_movie(admin_token, unique_movie_title):
    headers = {"Authorization": f"Bearer {admin_token}"}
    data = {"tagline": "Updated tagline"}
    resp = httpx.put(f"{BASE_URL}/movies/{unique_movie_title}", json=data, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

def test_create_person(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    unique_name = f"Test Person {int(time.time())}"
    data = {"name": unique_name, "born": 1990}
    resp = httpx.post(f"{BASE_URL}/persons", json=data, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

def test_add_actor_to_movie(admin_token, unique_movie_title):
    headers = {"Authorization": f"Bearer {admin_token}"}
    # S'assurer que le film existe
    movie_data = {"title": unique_movie_title, "released": 2025, "tagline": "Test tagline"}
    httpx.post(f"{BASE_URL}/movies", json=movie_data, headers=headers)
    # S'assurer que la personne existe
    person_data = {"name": "Test Person", "born": 1990}
    httpx.post(f"{BASE_URL}/persons", json=person_data, headers=headers)
    # Ajouter l'acteur au film
    data = {"name": "Test Person", "roles": ["Neo"]}
    resp = httpx.post(f"{BASE_URL}/movies/{unique_movie_title}/actors", json=data, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

def test_delete_movie(admin_token, unique_movie_title):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = httpx.delete(f"{BASE_URL}/movies/{unique_movie_title}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
