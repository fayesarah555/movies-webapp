from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db.neo4j_conn import neo4j_conn
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

# Importer les routers modulaires
from routes.movies import router as movies_router
from routes.persons import router as persons_router
from routes.users import router as users_router
from routes.reviews import router as reviews_router
from routes.stats import router as stats_router
from routes.users import login as users_login
from routes.users import register as users_register

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🔗 Connexion à Neo4j...")
    neo4j_conn.connect()
    yield
    # Shutdown
    neo4j_conn.close()

# Créer l'application FastAPI
app = FastAPI(
    title="Simple API with Neo4j", 
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS pour permettre la communication avec le front-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],  # Ports courants pour le dev front-end
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes de base
@app.get("/")
def read_root():
    return {"message": "Hello World!"}

@app.get("/health")
def health_check():
    return {"status": "OK"}

@app.get("/neo4j/test")
def test_neo4j():
    """Tester la connexion Neo4j"""
    try:
        if not neo4j_conn.driver:
            return {"status": "error", "message": "Aucune connexion Neo4j"}
        with neo4j_conn.driver.session() as session:
            result = session.run("RETURN 'Neo4j works!' as message, datetime() as time")
            record = result.single()
        return {
            "status": "success",
            "message": record["message"],
            "time": str(record["time"]),
            "uri": neo4j_conn.uri
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Inclusion des routers modulaires
app.include_router(movies_router, prefix="/movies", tags=["movies"])
app.include_router(persons_router, prefix="/persons", tags=["persons"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
app.include_router(stats_router, prefix="/stats", tags=["stats"])

# Correction FastAPI : redirection /movies vers /movies/
@app.get("/movies", include_in_schema=False)
def redirect_movies():
    return RedirectResponse(url="/movies/")

# Correction FastAPI : redirection /search/movies vers /movies/search/movies
@app.get("/search/movies", include_in_schema=False)
def redirect_search_movies(q: str, limit: int = 10, fuzzy: bool = True):
    return RedirectResponse(url=f"/movies/search/movies?q={q}&limit={limit}&fuzzy={str(fuzzy).lower()}")

# Correction FastAPI : redirections pour compatibilité avec l'ancien front
@app.get("/persons", include_in_schema=False)
def redirect_persons():
    return RedirectResponse(url="/persons/")

@app.get("/users", include_in_schema=False)
def redirect_users():
    return RedirectResponse(url="/users/")

@app.get("/reviews", include_in_schema=False)
def redirect_reviews():
    return RedirectResponse(url="/reviews/")

@app.get("/stats", include_in_schema=False)
def redirect_stats():
    return RedirectResponse(url="/stats/")

# Correction FastAPI : redirection /recommend/movies/similar/{title} vers /movies/recommend/movies/similar/{title}
@app.get("/recommend/movies/similar/{title}", include_in_schema=False)
def redirect_recommend_similar_movies(title: str, limit: int = 10):
    return RedirectResponse(url=f"/movies/recommend/movies/similar/{title}?limit={limit}")

# Correction FastAPI : proxy POST /login vers la fonction login du module users
@app.post("/login", include_in_schema=False)
def proxy_login(form_data: OAuth2PasswordRequestForm = Depends()):
    return users_login(form_data)

# Correction FastAPI : proxy POST /register vers la fonction register du module users
class UserRegisterProxy(BaseModel):
    username: str
    password: str
    role: str = "user"

@app.post("/register", include_in_schema=False)
def proxy_register(user: UserRegisterProxy):
    return users_register(user)
