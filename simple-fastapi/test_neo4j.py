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
