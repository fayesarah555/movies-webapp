from fastapi import FastAPI, Depends, HTTPException, status, Body
from neo4j import GraphDatabase
from dotenv import load_dotenv
import os
from contextlib import asynccontextmanager
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm
from pydantic import BaseModel
import bcrypt
import json
from typing import Optional
from fastapi import Response
from jose import jwt, JWTError
from datetime import datetime, timedelta

# Charger les variables d'environnement
load_dotenv()

# Configuration Neo4j
class Neo4jConnection:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI")
        self.username = os.getenv("NEO4J_USERNAME")
        self.password = os.getenv("NEO4J_PASSWORD")
        self.driver = None
    
    def connect(self):
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password)
            )
            # Test de connexion
            with self.driver.session() as session:
                result = session.run("RETURN 'Connected to Neo4j!' as message")
                message = result.single()["message"]
                print(f"✅ {message}")
            return True
        except Exception as e:
            print(f"❌ Erreur Neo4j: {e}")
            return False
    
    def close(self):
        if self.driver:
            self.driver.close()
            print("🔌 Connexion Neo4j fermée")

# Instance globale
neo4j_conn = Neo4jConnection()

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

# ===== CRUD ENDPOINTS =====

@app.get("/movies")
def get_all_movies(limit: int = 20, skip: int = 0):
    """Récupérer tous les films avec pagination"""
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (m:Movie)
                RETURN m.title as title, m.released as released, m.tagline as tagline
                ORDER BY m.released DESC
                SKIP $skip LIMIT $limit
            """, skip=skip, limit=limit)
            
            movies = [dict(record) for record in result]
            
        return {
            "status": "success",
            "movies": movies,
            "count": len(movies)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/movies/{title}")
def get_movie_by_title(title: str):
    """Récupérer un film par son titre (tolérant, fuzzy) avec cast complet"""
    try:
        with neo4j_conn.driver.session() as session:
            # Recherche tolérante (fuzzy) sur le titre
            cypher = '''
            MATCH (m:Movie)
            WITH m, apoc.text.sorensenDiceSimilarity(toLower(m.title), toLower($title)) AS similarity
            WHERE similarity > 0.5
            OPTIONAL MATCH (p:Person)-[r:ACTED_IN]->(m)
            OPTIONAL MATCH (d:Person)-[:DIRECTED]->(m)
            OPTIONAL MATCH (prod:Person)-[:PRODUCED]->(m)
            RETURN m.title as title, m.released as released, m.tagline as tagline,
                   collect(DISTINCT {name: p.name, roles: r.roles}) as actors,
                   collect(DISTINCT d.name) as directors,
                   collect(DISTINCT prod.name) as producers,
                   similarity
            ORDER BY similarity DESC
            LIMIT 1
            '''
            result = session.run(cypher, title=title)
            record = result.single()
            if not record or not record["title"]:
                return {"status": "error", "message": "Film non trouvé"}
            return {
                "status": "success",
                "title": record["title"],
                "released": record["released"],
                "tagline": record["tagline"],
                "actors": [a for a in record["actors"] if a["name"]],
                "directors": [d for d in record["directors"] if d],
                "producers": [p for p in record["producers"] if p],
                "similarity": record["similarity"]
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/persons")
def get_all_persons(limit: int = 20, skip: int = 0):
    """Récupérer toutes les personnes"""
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (p:Person)
                RETURN p.name as name, p.born as born
                ORDER BY p.name
                SKIP $skip LIMIT $limit
            """, skip=skip, limit=limit)
            
            persons = [dict(record) for record in result]
            
        return {
            "status": "success",
            "persons": persons,
            "count": len(persons)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/persons/{name}")
def get_person_by_name(name: str):
    """Récupérer une personne (tolérant, fuzzy) avec sa filmographie"""
    try:
        with neo4j_conn.driver.session() as session:
            cypher = '''
            MATCH (p:Person)
            WITH p, apoc.text.sorensenDiceSimilarity(toLower(p.name), toLower($name)) AS similarity
            WHERE similarity > 0.5
            OPTIONAL MATCH (p)-[r:ACTED_IN]->(m:Movie)
            WITH p, similarity, collect(CASE WHEN m IS NOT NULL THEN {movie: m.title, roles: r.roles} END) AS acted_in_raw
            OPTIONAL MATCH (p)-[:DIRECTED]->(dm:Movie)
            WITH p, similarity, acted_in_raw, collect(dm.title) AS directed_raw
            OPTIONAL MATCH (p)-[:PRODUCED]->(pm:Movie)
            WITH p, similarity, acted_in_raw, directed_raw, collect(pm.title) AS produced_raw
            RETURN p.name as name, p.born as born,
                   [x IN acted_in_raw WHERE x IS NOT NULL] as acted_in,
                   [d IN directed_raw WHERE d IS NOT NULL] as directed,
                   [pr IN produced_raw WHERE pr IS NOT NULL] as produced,
                   similarity
            ORDER BY similarity DESC
            LIMIT 1
            '''
            result = session.run(cypher, name=name)
            record = result.single()
            if not record or not record["name"]:
                return {"status": "error", "message": "Personne non trouvée"}
            return {
                "status": "success",
                "name": record["name"],
                "born": record["born"],
                "acted_in": record["acted_in"],
                "directed": record["directed"],
                "produced": record["produced"],
                "similarity": record["similarity"]
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

API_TOKEN = os.getenv("API_TOKEN", "supersecret")
security = HTTPBearer()

# Auth: JWT obligatoire, plus de token statique
SECRET_KEY = os.getenv("API_TOKEN", "supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_admin(username: str = Depends(verify_token)):
    with neo4j_conn.driver.session() as session:
        result = session.run("MATCH (u:User {username: $username}) RETURN u.role as role", username=username)
        record = result.single()
        if not record or record["role"] != "admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
        return username

# Les routes CRUD protégées par verify_admin
@app.post("/movies", dependencies=[Depends(verify_admin)])
def create_movie(movie_data: dict, username: str = Depends(verify_admin)):
    try:
        title = movie_data.get("title")
        released = movie_data.get("released")
        tagline = movie_data.get("tagline", "")
        if not title or not released:
            return {"status": "error", "message": "Titre et année de sortie requis"}
        with neo4j_conn.driver.session() as session:
            existing = session.run("MATCH (m:Movie {title: $title}) RETURN m", title=title)
            if existing.single():
                return {"status": "error", "message": "Film déjà existant"}
            session.run("""
                CREATE (m:Movie {title: $title, released: $released, tagline: $tagline})
                RETURN m
            """, title=title, released=released, tagline=tagline)
        return {
            "status": "success",
            "message": f"Film '{title}' créé avec succès"
        }
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.put("/movies/{title}", dependencies=[Depends(verify_admin)])
def update_movie(title: str, movie_data: dict, username: str = Depends(verify_admin)):
    try:
        with neo4j_conn.driver.session() as session:
            existing = session.run("MATCH (m:Movie {title: $title}) RETURN m", title=title)
            if not existing.single():
                return {"status": "error", "message": "Film non trouvé"}
            set_clauses = []
            params = {"title": title}
            if "released" in movie_data:
                set_clauses.append("m.released = $released")
                params["released"] = movie_data["released"]
            if "tagline" in movie_data:
                set_clauses.append("m.tagline = $tagline")
                params["tagline"] = movie_data["tagline"]
            if set_clauses:
                query = f"MATCH (m:Movie {{title: $title}}) SET {', '.join(set_clauses)} RETURN m"
                session.run(query, **params)
        return {
            "status": "success",
            "message": f"Film '{title}' mis à jour avec succès"
        }
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.delete("/movies/{title}", dependencies=[Depends(verify_admin)])
def delete_movie(title: str, username: str = Depends(verify_admin)):
    try:
        with neo4j_conn.driver.session() as session:
            existing = session.run("MATCH (m:Movie {title: $title}) RETURN m", title=title)
            if not existing.single():
                return {"status": "error", "message": "Film non trouvé"}
            session.run("""
                MATCH (m:Movie {title: $title})
                DETACH DELETE m
            """, title=title)
        return {
            "status": "success",
            "message": f"Film '{title}' supprimé avec succès"
        }
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/persons", dependencies=[Depends(verify_admin)])
def create_person(person_data: dict, username: str = Depends(verify_admin)):
    try:
        name = person_data.get("name")
        born = person_data.get("born")
        if not name:
            return {"status": "error", "message": "Nom requis"}
        with neo4j_conn.driver.session() as session:
            existing = session.run("MATCH (p:Person {name: $name}) RETURN p", name=name)
            if existing.single():
                return {"status": "error", "message": "Personne déjà existante"}
            if born:
                session.run("""
                    CREATE (p:Person {name: $name, born: $born})
                    RETURN p
                """, name=name, born=born)
            else:
                session.run("""
                    CREATE (p:Person {name: $name})
                    RETURN p
                """, name=name)
        return {
            "status": "success",
            "message": f"Personne '{name}' créée avec succès"
        }
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/movies/{movie_title}/actors", dependencies=[Depends(verify_admin)])
def add_actor_to_movie(movie_title: str, actor_data: dict, username: str = Depends(verify_admin)):
    try:
        actor_name = actor_data.get("name")
        roles = actor_data.get("roles", [])
        if not actor_name:
            return {"status": "error", "message": "Nom de l'acteur requis"}
        with neo4j_conn.driver.session() as session:
            movie_exists = session.run("MATCH (m:Movie {title: $title}) RETURN m", title=movie_title).single()
            person_exists = session.run("MATCH (p:Person {name: $name}) RETURN p", name=actor_name).single()
            if not movie_exists:
                return {"status": "error", "message": "Film non trouvé"}
            if not person_exists:
                return {"status": "error", "message": "Acteur non trouvé"}
            session.run("""
                MATCH (p:Person {name: $actor_name}), (m:Movie {title: $movie_title})
                MERGE (p)-[:ACTED_IN {roles: $roles}]->(m)
            """, actor_name=actor_name, movie_title=movie_title, roles=roles)
        return {
            "status": "success",
            "message": f"Acteur '{actor_name}' ajouté au film '{movie_title}'"
        }
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/search/movies")
def search_movies(q: str, limit: int = 10, fuzzy: bool = True):
    """Rechercher des films par titre (fuzzy si possible)"""
    try:
        with neo4j_conn.driver.session() as session:
            if fuzzy:
                # Recherche floue avec APOC (Sorensen-Dice)
                cypher = '''
                MATCH (m:Movie)
                WITH m, apoc.text.sorensenDiceSimilarity(toLower(m.title), toLower($search)) AS similarity
                WHERE similarity > 0.5
                RETURN m.title as title, m.released as released, m.tagline as tagline, similarity
                ORDER BY similarity DESC, m.released DESC
                LIMIT $limit
                '''
                result = session.run(cypher, search=q, limit=limit)
                movies = [dict(record) for record in result]
            else:
                # Recherche classique (sous-chaîne, insensible à la casse)
                result = session.run('''
                    MATCH (m:Movie)
                    WHERE toLower(m.title) CONTAINS toLower($search)
                    RETURN m.title as title, m.released as released, m.tagline as tagline
                    ORDER BY m.released DESC
                    LIMIT $limit
                ''', search=q, limit=limit)
                movies = [dict(record) for record in result]
        return {
            "status": "success",
            "movies": movies,
            "query": q,
            "count": len(movies)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/stats")
def get_database_stats():
    """Obtenir les statistiques de la base de données"""
    try:
        with neo4j_conn.driver.session() as session:
            # Compter les films
            movies_count = session.run("MATCH (m:Movie) RETURN count(m) as count").single()["count"]
            
            # Compter les personnes
            persons_count = session.run("MATCH (p:Person) RETURN count(p) as count").single()["count"]
            
            # Compter les relations
            acted_in_count = session.run("MATCH ()-[r:ACTED_IN]->() RETURN count(r) as count").single()["count"]
            directed_count = session.run("MATCH ()-[r:DIRECTED]->() RETURN count(r) as count").single()["count"]
            produced_count = session.run("MATCH ()-[r:PRODUCED]->() RETURN count(r) as count").single()["count"]
            
            # Film le plus récent
            latest_movie = session.run("""
                MATCH (m:Movie) 
                RETURN m.title as title, m.released as released 
                ORDER BY m.released DESC 
                LIMIT 1
            """).single()
            
        return {
            "status": "success",
            "stats": {
                "movies_count": movies_count,
                "persons_count": persons_count,
                "relationships": {
                    "acted_in": acted_in_count,
                    "directed": directed_count,
                    "produced": produced_count
                },
                "latest_movie": dict(latest_movie) if latest_movie else None
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

# Ajout d'un champ role à l'inscription (admin ou user)
class UserRegister(BaseModel):
    username: str
    password: str
    role: Optional[str] = "user"

class UserOut(BaseModel):
    username: str
    role: str

# --- Utilisateurs en base Neo4j ---

@app.post("/register", response_model=UserOut)
def register(user: UserRegister = Body(...)):
    with neo4j_conn.driver.session() as session:
        # Vérifier si l'utilisateur existe déjà
        existing = session.run("MATCH (u:User {username: $username}) RETURN u", username=user.username)
        if existing.single():
            raise HTTPException(status_code=400, detail="Username already exists")
        hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
        role = user.role if user.role in ["admin", "user"] else "user"
        session.run("CREATE (u:User {username: $username, password: $password, role: $role})", username=user.username, password=hashed, role=role)
    return {"username": user.username, "role": role}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with neo4j_conn.driver.session() as session:
        result = session.run("MATCH (u:User {username: $username}) RETURN u.password as password", username=form_data.username)
        record = result.single()
        if not record:
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        hashed = record["password"]
        if not bcrypt.checkpw(form_data.password.encode(), hashed.encode()):
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": form_data.username, "exp": expire}
        token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": token, "token_type": "bearer"}

class ReviewIn(BaseModel):
    movie_title: str
    rating: int
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    username: str
    movie_title: str
    rating: int
    comment: Optional[str] = None
    created_at: str

@app.post("/reviews", response_model=ReviewOut, dependencies=[Depends(verify_token)])
def add_review(review: ReviewIn, username: str = Depends(verify_token)):
    if not (1 <= review.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    created_at = datetime.utcnow().isoformat()
    with neo4j_conn.driver.session() as session:
        # Vérifier que le film existe
        movie = session.run("MATCH (m:Movie {title: $title}) RETURN m", title=review.movie_title).single()
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        # Créer ou mettre à jour l'avis (1 avis par user/movie)
        session.run("""
            MERGE (u:User {username: $username})
            WITH u
            MATCH (m:Movie {title: $movie_title})
            MERGE (u)-[r:RATED]->(m)
            SET r.rating = $rating, r.comment = $comment, r.created_at = $created_at
        """, username=username, movie_title=review.movie_title, rating=review.rating, comment=review.comment, created_at=created_at)
    return ReviewOut(username=username, movie_title=review.movie_title, rating=review.rating, comment=review.comment, created_at=created_at)

@app.get("/reviews/{movie_title}")
def get_reviews(movie_title: str):
    with neo4j_conn.driver.session() as session:
        result = session.run("""
            MATCH (u:User)-[r:RATED]->(m:Movie {title: $movie_title})
            RETURN u.username as username, r.rating as rating, r.comment as comment, r.created_at as created_at
            ORDER BY r.created_at DESC
        """, movie_title=movie_title)
        reviews = [dict(record) for record in result]
    return {"reviews": reviews, "count": len(reviews)}

@app.get("/actors/{name}/movies")
def get_movies_by_actor(name: str):
    """Lister tous les films d'un acteur donné (fuzzy)"""
    try:
        with neo4j_conn.driver.session() as session:
            cypher = '''
            MATCH (p:Person)
            WITH p, apoc.text.sorensenDiceSimilarity(toLower(p.name), toLower($name)) AS similarity
            WHERE similarity > 0.5
            WITH p, similarity
            ORDER BY similarity DESC
            LIMIT 1
            MATCH (p)-[r:ACTED_IN]->(m:Movie)
            RETURN m.title as title, m.released as released, r.roles as roles, p.name as actor, similarity
            ORDER BY m.released DESC
            '''
            result = session.run(cypher, name=name)
            movies = [dict(record) for record in result]
        if not movies:
            return {"status": "error", "message": "Aucun film trouvé pour cet acteur"}
        return {
            "status": "success",
            "actor": movies[0]["actor"],
            "movies": [{k: v for k, v in m.items() if k != "actor" and k != "similarity"} for m in movies],
            "count": len(movies),
            "similarity": movies[0]["similarity"]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/movies/{title}/actors")
def get_actors_by_movie(title: str):
    """Lister tous les acteurs d'un film donné (fuzzy)"""
    try:
        with neo4j_conn.driver.session() as session:
            cypher = '''
            MATCH (m:Movie)
            WITH m, apoc.text.sorensenDiceSimilarity(toLower(m.title), toLower($title)) AS similarity
            WHERE similarity > 0.5
            WITH m, similarity
            ORDER BY similarity DESC
            LIMIT 1
            MATCH (p:Person)-[r:ACTED_IN]->(m)
            RETURN p.name as name, r.roles as roles, m.title as movie, similarity
            ORDER BY name
            '''
            result = session.run(cypher, title=title)
            actors = [dict(record) for record in result]
        if not actors:
            return {"status": "error", "message": "Aucun acteur trouvé pour ce film"}
        return {
            "status": "success",
            "movie": actors[0]["movie"],
            "actors": [{k: v for k, v in a.items() if k != "movie" and k != "similarity"} for a in actors],
            "count": len(actors),
            "similarity": actors[0]["similarity"]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/collaborations")
def get_collaborations(person1: str, person2: str):
    """Nombre de films en commun entre deux personnes (fuzzy)"""
    try:
        with neo4j_conn.driver.session() as session:
            cypher = '''
            MATCH (p1:Person)
            WITH p1, apoc.text.sorensenDiceSimilarity(toLower(p1.name), toLower($person1)) AS sim1
            WHERE sim1 > 0.5
            WITH p1, sim1
            ORDER BY sim1 DESC
            LIMIT 1
            MATCH (p2:Person)
            WITH p1, sim1, p2, apoc.text.sorensenDiceSimilarity(toLower(p2.name), toLower($person2)) AS sim2
            WHERE sim2 > 0.5
            WITH p1, sim1, p2, sim2
            ORDER BY sim2 DESC
            LIMIT 1
            MATCH (p1)-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(p2)
            RETURN collect(m.title) as movies, count(m) as collaborations, p1.name as person1, p2.name as person2, sim1, sim2
            '''
            result = session.run(cypher, person1=person1, person2=person2)
            record = result.single()
            if not record or not record["person1"] or not record["person2"]:
                return {"status": "error", "message": "Aucune collaboration trouvée"}
            return {
                "status": "success",
                "person1": record["person1"],
                "person2": record["person2"],
                "collaborations": record["collaborations"],
                "movies": record["movies"],
                "similarity1": record["sim1"],
                "similarity2": record["sim2"]
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/recommend/movies/similar/{title}")
def recommend_similar_movies(title: str, limit: int = 5):
    """Recommander des films similaires à un film donné (par acteurs/réalisateurs/producteurs)"""
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (m:Movie)
                WITH m, apoc.text.sorensenDiceSimilarity(toLower(m.title), toLower($title)) AS similarity
                WHERE similarity > 0.5
                WITH m, similarity
                ORDER BY similarity DESC
                LIMIT 1
                MATCH (m)<-[:ACTED_IN|:DIRECTED|:PRODUCED]-(p:Person)-[:ACTED_IN|:DIRECTED|:PRODUCED]->(rec:Movie)
                WHERE rec.title <> m.title
                RETURN rec.title AS title, rec.released AS released, count(*) AS score
                ORDER BY score DESC, rec.released DESC
                LIMIT $limit
            """, title=title, limit=limit)
            movies = [dict(record) for record in result]
        return {"status": "success", "recommendations": movies, "base_title": title}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/recommend/movies/{username}")
def recommend_movies_for_user(username: str, limit: int = 5):
    """Recommander des films à un utilisateur selon les goûts d'utilisateurs similaires (collaboratif)"""
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (u:User {username: $username})-[:RATED]->(m:Movie)
                WITH u, collect(m) AS user_movies
                MATCH (other:User)-[:RATED]->(m2:Movie)
                WHERE other <> u AND m2 IN user_movies
                WITH other, count(*) AS common_movies, u
                ORDER BY common_movies DESC
                LIMIT 5
                MATCH (other)-[:RATED]->(rec:Movie)
                WHERE NOT (u)-[:RATED]->(rec)
                RETURN rec.title AS title, rec.released AS released, count(*) AS score
                ORDER BY score DESC, rec.released DESC
                LIMIT $limit
            """, username=username, limit=limit)
            movies = [dict(record) for record in result]
        return {"status": "success", "recommendations": movies, "user": username}
    except Exception as e:
        return {"status": "error", "message": str(e)}
