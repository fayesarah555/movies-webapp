import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ajouter le répertoire courant au path pour l'import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app, neo4j_conn

# Client de test FastAPI
client = TestClient(app)

class TestAPI:
    """Tests pour l'API FastAPI"""
    
    def test_read_root(self):
        """Test de l'endpoint racine"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Hello World!"
    
    def test_health_check(self):
        """Test du health check"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "OK"
    
    def test_items_endpoint(self):
        """Test de l'endpoint items avec paramètres"""
        item_id = 42
        query_param = "test"
        
        response = client.get(f"/items/{item_id}?q={query_param}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["item_id"] == item_id
        assert data["q"] == query_param
    
    def test_items_without_query(self):
        """Test de l'endpoint items sans paramètre query"""
        item_id = 123
        
        response = client.get(f"/items/{item_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["item_id"] == item_id
        assert data["q"] is None

class TestNeo4j:
    """Tests pour la connexion Neo4j"""
    
    def test_neo4j_test_endpoint(self):
        """Test de l'endpoint de test Neo4j"""
        response = client.get("/neo4j/test")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        
        # Si la connexion fonctionne
        if data["status"] == "success":
            assert data["message"] == "Neo4j works!"
            assert "time" in data
            assert "uri" in data
            assert data["uri"] == "neo4j+s://9bd559cc.databases.neo4j.io"
        # Si la connexion échoue (pour les tests sans vraie DB)
        elif data["status"] == "error":
            assert "message" in data
    
    def test_neo4j_connection_object(self):
        """Test de l'objet de connexion Neo4j"""
        assert neo4j_conn is not None
        assert hasattr(neo4j_conn, 'uri')
        assert hasattr(neo4j_conn, 'username')
        assert hasattr(neo4j_conn, 'driver')
        
        # Vérifier que les variables d'environnement sont chargées
        assert neo4j_conn.uri == "neo4j+s://9bd559cc.databases.neo4j.io"
        assert neo4j_conn.username == "neo4j"

class TestAPIDocumentation:
    """Tests pour la documentation de l'API"""
    
    def test_openapi_schema(self):
        """Test du schéma OpenAPI"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        
        schema = response.json()
        assert "openapi" in schema
        assert "info" in schema
        assert schema["info"]["title"] == "Simple API with Neo4j"
        assert schema["info"]["version"] == "1.0.0"
    
    def test_docs_endpoint(self):
        """Test de l'endpoint de documentation"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

# Tests d'intégration
class TestIntegration:
    """Tests d'intégration complets"""
    
    def test_app_startup_and_endpoints(self):
        """Test que l'app démarre et que tous les endpoints répondent"""
        endpoints = [
            "/",
            "/health", 
            "/items/1",
            "/neo4j/test",
            "/docs",
            "/openapi.json"
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 200, f"Endpoint {endpoint} failed"
    
    def test_neo4j_integration_flow(self):
        """Test du flux complet avec Neo4j"""
        # 1. Vérifier que l'API fonctionne
        response = client.get("/health")
        assert response.status_code == 200
        
        # 2. Tester la connexion Neo4j
        response = client.get("/neo4j/test")
        assert response.status_code == 200
        
        data = response.json()
        
        # 3. Si Neo4j est disponible, vérifier les données
        if data.get("status") == "success":
            assert "message" in data
            assert "time" in data
            print(f"✅ Neo4j test successful: {data['message']}")
        else:
            print(f"⚠️  Neo4j test failed: {data.get('message', 'Unknown error')}")

if __name__ == "__main__":
    # Exécuter les tests directement
    pytest.main([__file__, "-v"])
