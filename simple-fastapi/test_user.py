"""
Tests pour les fonctionnalités accessibles à un utilisateur normal (role 'user').
"""
import pytest
import httpx
import time

BASE_URL = "http://localhost:8000"

@pytest.fixture(scope="module")
def user_token():
    # Utilisateur unique à chaque run (timestamp)
    username = f"testuser_{int(time.time())}"
    password = "testpass"
    # Register
    reg_resp = httpx.post(f"{BASE_URL}/register", json={"username": username, "password": password, "role": "user"})
    # Si déjà existant, ce n'est pas grave, on tente le login
    login_resp = httpx.post(f"{BASE_URL}/login", data={"username": username, "password": password})
    try:
        token = login_resp.json()["access_token"]
    except Exception:
        print("Login response:", login_resp.text)
        raise
    return token

def test_get_movies():
    resp = httpx.get(f"{BASE_URL}/movies")
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

def test_get_persons():
    resp = httpx.get(f"{BASE_URL}/persons")
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

def test_search_movies():
    resp = httpx.get(f"{BASE_URL}/search/movies?q=matrix")
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"

def test_add_review(user_token):
    # Peut laisser un avis
    headers = {"Authorization": f"Bearer {user_token}"}
    data = {"movie_title": "The Matrix", "rating": 5, "comment": "Excellent!"}
    resp = httpx.post(f"{BASE_URL}/reviews", json=data, headers=headers)
    assert resp.status_code == 200 or resp.status_code == 201
    assert resp.json()["movie_title"] == "The Matrix"

def test_get_reviews():
    resp = httpx.get(f"{BASE_URL}/reviews/The Matrix")
    assert resp.status_code == 200
    assert "reviews" in resp.json()

def test_user_cannot_crud(user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    # Tentative de création d'un film
    resp = httpx.post(f"{BASE_URL}/movies", json={"title": "Forbidden", "released": 2025}, headers=headers)
    assert resp.status_code == 403 or resp.json()["status"] == "error"
    # Tentative de suppression
    resp = httpx.delete(f"{BASE_URL}/movies/Forbidden", headers=headers)
    assert resp.status_code == 403 or resp.json()["status"] == "error"
