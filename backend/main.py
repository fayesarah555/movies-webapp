# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Créer l'application FastAPI
app = FastAPI(
    title="Movie Database API", 
    version="1.0.0",
    description="API pour la base de données de films avec Neo4j"
)

# Configuration CORS pour React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL de votre app React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("🚀 API Movie Database démarrée")
    print("📊 Documentation disponible sur: http://localhost:8000/docs")
    print("🔗 Neo4j Browser: http://localhost:7474")

@app.on_event("shutdown")
async def shutdown_event():
    from app.database.connection import close_db
    close_db()
    print("🔌 Connexion Neo4j fermée")

# Import et inclusion des routes
from app.routes import movies, users, auth, ratings

app.include_router(auth.router, prefix="/api/auth", tags=["🔐 Authentication"])
app.include_router(movies.router, prefix="/api/movies", tags=["🎬 Movies"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["⭐ Ratings"])
app.include_router(users.router, prefix="/api/users", tags=["👥 Users"])

@app.get("/")
def read_root():
    return {
        "message": "🎬 Movie Database API is running!",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/health")
def health_check():
    """Point de santé de l'API"""
    try:
        from app.database.connection import get_db
        db = get_db()
        
        # Test simple de connexion
        with db.driver.session() as session:
            result = session.run("RETURN 1 as test")
            test_result = result.single()
            
        return {
            "status": "healthy",
            "database": "connected" if test_result else "disconnected",
            "message": "API fonctionnelle"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000")),
        reload=os.getenv("DEBUG", "True").lower() == "true"
    )