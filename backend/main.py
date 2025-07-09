#!/usr/bin/env python3
"""
FastAPI Movie Database Application - Version Simple
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv
from app.database.connection import init_db, close_db

# Charger les variables d'environnement
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🔗 Initialisation de la connexion Neo4j...")
    db_connected = init_db()
    if not db_connected:
        print("❌ Échec de la connexion à Neo4j")
    else:
        print("✅ Connexion Neo4j établie")
    
    yield
    
    # Shutdown
    print("🔌 Fermeture de la connexion Neo4j...")
    close_db()

# Création de l'application FastAPI
app = FastAPI(
    title="Movie Database API",
    description="API pour explorer une base de données de films stockée dans Neo4j",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
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

@app.get("/health/neo4j")
def neo4j_health_check():
    """Vérifier l'état de la connexion Neo4j"""
    from app.database.connection import get_db
    
    try:
        db = get_db()
        if db.driver is None:
            return {
                "status": "error",
                "message": "Aucune connexion Neo4j active",
                "connected": False
            }
        
        # Test de la connexion
        with db.driver.session() as session:
            result = session.run("RETURN 'Neo4j is connected!' as message")
            message = result.single()["message"]
            
        return {
            "status": "success",
            "message": message,
            "connected": True,
            "uri": db.uri
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erreur Neo4j: {str(e)}",
            "connected": False
        }

if __name__ == "__main__":
    print("🚀 Démarrage du serveur Movie Database API")
    uvicorn.run(app, host="localhost", port=8000, reload=True)