#!/usr/bin/env python3
"""
FastAPI Movie Database Application - Version Simple
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Création de l'application FastAPI
app = FastAPI(
    title="🎬 Movie Database API",
    description="API pour explorer une base de données de films stockée dans Neo4j",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "🎬 Bienvenue dans l'API Movie Database !",
        "version": "2.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Movie Database API",
        "version": "2.0.0"
    }

@app.get("/api/test-neo4j")
async def test_neo4j():
    """Test de connexion à Neo4j"""
    try:
        from neo4j import GraphDatabase
        
        uri = os.getenv("NEO4J_URI")
        username = os.getenv("NEO4J_USERNAME")
        password = os.getenv("NEO4J_PASSWORD")
        
        driver = GraphDatabase.driver(uri, auth=(username, password))
        
        with driver.session() as session:
            result = session.run("MATCH (m:Movie) RETURN COUNT(m) as count")
            movies_count = result.single()["count"]
            
            result = session.run("MATCH (p:Person) RETURN COUNT(p) as count")
            persons_count = result.single()["count"]
            
        driver.close()
        
        return {
            "status": "success",
            "data": {
                "movies_count": movies_count,
                "persons_count": persons_count,
                "database": "Neo4j Aura"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Neo4j: {str(e)}")

if __name__ == "__main__":
    host = os.getenv("API_HOST", "localhost")
    port = int(os.getenv("API_PORT", "8000"))
    
    print(f"""
🚀 Démarrage du serveur Movie Database API
📍 URL: http://{host}:{port}
📚 Documentation: http://{host}:{port}/docs
    """)
    
    uvicorn.run(app, host=host, port=port, reload=True)
