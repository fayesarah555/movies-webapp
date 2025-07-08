# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Movie Database API", version="1.0.0")

# Configuration CORS pour React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL de votre app React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Neo4j
class Neo4jConnection:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            auth=(
                os.getenv("NEO4J_USER", "neo4j"),
                os.getenv("NEO4J_PASSWORD", "password")
            )
        )
    
    def close(self):
        self.driver.close()
    
    def execute_query(self, query, parameters=None):
        with self.driver.session() as session:
            return session.run(query, parameters or {})

# Instance globale de connexion
db = Neo4jConnection()

# Security
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Ici vous implémenterez la vérification du JWT
    # Pour l'instant, retourne un utilisateur fictif
    return {"id": "admin", "role": "admin"}

@app.on_event("startup")
async def startup_event():
    print("API démarrée - Connexion à Neo4j établie")

@app.on_event("shutdown")
async def shutdown_event():
    db.close()
    print("Connexion Neo4j fermée")

# Import des routes
from app.routes import movies, users, auth

app.include_router(movies.router, prefix="/api/movies", tags=["movies"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])

@app.get("/")
def read_root():
    return {"message": "Movie Database API is running!"}