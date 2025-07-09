import httpx

def test_neo4j_connection():
    # Test de santé Neo4j
    resp = httpx.get("http://localhost:8000/neo4j/test")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "Neo4j works!" in data["message"]

    # Test stats
    resp = httpx.get("http://localhost:8000/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["status"] == "success"
    assert "movies_count" in stats["stats"]

    # Test liste de films
    resp = httpx.get("http://localhost:8000/movies")
    assert resp.status_code == 200
    movies = resp.json()
    assert movies["status"] == "success"
    assert isinstance(movies["movies"], list)

    # Test recherche de film (même si vide)
    resp = httpx.get("http://localhost:8000/search/movies?q=matrix")
    assert resp.status_code == 200
    search = resp.json()
    assert search["status"] == "success"
    assert "movies" in search
    assert isinstance(search["movies"], list)

def test_movies_by_actor():
    resp = httpx.get("http://localhost:8000/actors/Keanu Reeves/movies")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["actor"] == "Keanu Reeves"
    assert isinstance(data["movies"], list)

def test_actors_by_movie():
    resp = httpx.get("http://localhost:8000/movies/The Matrix/actors")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["movie"] == "The Matrix"
    assert isinstance(data["actors"], list)

def test_collaborations():
    resp = httpx.get("http://localhost:8000/collaborations?person1=Keanu Reeves&person2=Laurence Fishburne")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["person1"] == "Keanu Reeves"
    assert data["person2"] == "Laurence Fishburne"
    assert isinstance(data["movies"], list)
    assert isinstance(data["collaborations"], int)
