from fastapi import APIRouter, Depends, HTTPException, status
from db.neo4j_conn import neo4j_conn
from typing import Optional, List
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from datetime import datetime
import os

router = APIRouter()

SECRET_KEY = os.getenv("API_TOKEN", "supersecret")
ALGORITHM = "HS256"
security = HTTPBearer()

# Modèles Pydantic
class WatchlistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class WatchlistMovie(BaseModel):
    movie_title: str
    
class WatchlistOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_public: bool
    created_at: str
    movie_count: int
    username: str

class WatchlistDetailOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_public: bool
    created_at: str
    username: str
    movies: List[dict]

# Dépendances d'authentification
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

# ===== WATCHLIST ROUTES =====

@router.post("", response_model=WatchlistOut)
def create_watchlist(watchlist: WatchlistCreate, username: str = Depends(verify_token)):
    """Créer une nouvelle watchlist"""
    try:
        created_at = datetime.utcnow().isoformat()
        with neo4j_conn.driver.session() as session:
            # Générer un ID unique pour la watchlist
            result = session.run("""
                MATCH (u:User {username: $username})
                CREATE (w:Watchlist {
                    id: randomUUID(),
                    name: $name,
                    description: $description,
                    is_public: $is_public,
                    created_at: $created_at
                })
                CREATE (u)-[:OWNS]->(w)
                RETURN w.id as id, w.name as name, w.description as description, 
                       w.is_public as is_public, w.created_at as created_at
            """, username=username, name=watchlist.name, description=watchlist.description,
                is_public=watchlist.is_public, created_at=created_at)
            
            record = result.single()
            if not record:
                raise HTTPException(status_code=400, detail="Erreur lors de la création de la watchlist")
            
            return WatchlistOut(
                id=record["id"],
                name=record["name"],
                description=record["description"],
                is_public=record["is_public"],
                created_at=record["created_at"],
                movie_count=0,
                username=username
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("", response_model=List[WatchlistOut])
def get_user_watchlists(username: str = Depends(verify_token)):
    """Récupérer toutes les watchlists de l'utilisateur"""
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (u:User {username: $username})-[:OWNS]->(w:Watchlist)
                OPTIONAL MATCH (w)-[:CONTAINS]->(m:Movie)
                RETURN w.id as id, w.name as name, w.description as description,
                       w.is_public as is_public, w.created_at as created_at,
                       count(m) as movie_count
                ORDER BY w.created_at DESC
            """, username=username)
            
            watchlists = []
            for record in result:
                watchlists.append(WatchlistOut(
                    id=record["id"],
                    name=record["name"],
                    description=record["description"],
                    is_public=record["is_public"],
                    created_at=record["created_at"],
                    movie_count=record["movie_count"],
                    username=username
                ))
            return watchlists
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/{watchlist_id}", response_model=WatchlistDetailOut)
def get_watchlist_detail(watchlist_id: str, username: str = Depends(verify_token)):
    """Récupérer le détail d'une watchlist avec ses films"""
    try:
        with neo4j_conn.driver.session() as session:
            # Vérifier l'accès à la watchlist
            access_result = session.run("""
                MATCH (w:Watchlist {id: $watchlist_id})
                OPTIONAL MATCH (owner:User)-[:OWNS]->(w)
                RETURN w, owner.username as owner_username
            """, watchlist_id=watchlist_id)
            
            access_record = access_result.single()
            if not access_record:
                raise HTTPException(status_code=404, detail="Watchlist non trouvée")
            
            watchlist_data = access_record["w"]
            owner_username = access_record["owner_username"]
            
            # Vérifier les permissions d'accès
            if not watchlist_data["is_public"] and owner_username != username:
                raise HTTPException(status_code=403, detail="Accès refusé à cette watchlist privée")
            
            # Récupérer les films de la watchlist
            movies_result = session.run("""
                MATCH (w:Watchlist {id: $watchlist_id})-[:CONTAINS]->(m:Movie)
                RETURN m.title as title, m.released as released, m.tagline as tagline
                ORDER BY m.title
            """, watchlist_id=watchlist_id)
            
            movies = [dict(record) for record in movies_result]
            
            return WatchlistDetailOut(
                id=watchlist_data["id"],
                name=watchlist_data["name"],
                description=watchlist_data["description"],
                is_public=watchlist_data["is_public"],
                created_at=watchlist_data["created_at"],
                username=owner_username,
                movies=movies
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.post("/{watchlist_id}/movies")
def add_movie_to_watchlist(watchlist_id: str, movie: WatchlistMovie, username: str = Depends(verify_token)):
    """Ajouter un film à une watchlist"""
    try:
        with neo4j_conn.driver.session() as session:
            # Vérifier que l'utilisateur possède cette watchlist
            owner_check = session.run("""
                MATCH (u:User {username: $username})-[:OWNS]->(w:Watchlist {id: $watchlist_id})
                RETURN w
            """, username=username, watchlist_id=watchlist_id)
            
            if not owner_check.single():
                raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres watchlists")
            
            # Vérifier que le film existe
            movie_check = session.run("""
                MATCH (m:Movie {title: $movie_title})
                RETURN m
            """, movie_title=movie.movie_title)
            
            if not movie_check.single():
                raise HTTPException(status_code=404, detail="Film non trouvé")
            
            # Ajouter le film à la watchlist
            result = session.run("""
                MATCH (w:Watchlist {id: $watchlist_id}), (m:Movie {title: $movie_title})
                MERGE (w)-[:CONTAINS]->(m)
                RETURN w, m
            """, watchlist_id=watchlist_id, movie_title=movie.movie_title)
            
            if result.single():
                return {"status": "success", "message": f"Film '{movie.movie_title}' ajouté à la watchlist"}
            else:
                raise HTTPException(status_code=400, detail="Erreur lors de l'ajout du film")
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.delete("/{watchlist_id}/movies/{movie_title}")
def remove_movie_from_watchlist(watchlist_id: str, movie_title: str, username: str = Depends(verify_token)):
    """Retirer un film d'une watchlist"""
    try:
        with neo4j_conn.driver.session() as session:
            # Vérifier et supprimer en une seule requête
            result = session.run("""
                MATCH (u:User {username: $username})-[:OWNS]->(w:Watchlist {id: $watchlist_id})-[r:CONTAINS]->(m:Movie {title: $movie_title})
                DELETE r
                RETURN w, m
            """, username=username, watchlist_id=watchlist_id, movie_title=movie_title)
            
            if result.single():
                return {"status": "success", "message": f"Film '{movie_title}' retiré de la watchlist"}
            else:
                raise HTTPException(status_code=404, detail="Film non trouvé dans cette watchlist ou watchlist non trouvée")
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.put("/{watchlist_id}")
def update_watchlist(watchlist_id: str, watchlist: WatchlistCreate, username: str = Depends(verify_token)):
    """Mettre à jour une watchlist"""
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (u:User {username: $username})-[:OWNS]->(w:Watchlist {id: $watchlist_id})
                SET w.name = $name, w.description = $description, w.is_public = $is_public
                RETURN w
            """, username=username, watchlist_id=watchlist_id, 
                name=watchlist.name, description=watchlist.description, is_public=watchlist.is_public)
            
            if result.single():
                return {"status": "success", "message": "Watchlist mise à jour avec succès"}
            else:
                raise HTTPException(status_code=404, detail="Watchlist non trouvée ou vous n'êtes pas le propriétaire")
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.delete("/{watchlist_id}")
def delete_watchlist(watchlist_id: str, username: str = Depends(verify_token)):
    """Supprimer une watchlist"""
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (u:User {username: $username})-[:OWNS]->(w:Watchlist {id: $watchlist_id})
                DETACH DELETE w
                RETURN count(w) as deleted
            """, username=username, watchlist_id=watchlist_id)
            
            deleted_count = result.single()["deleted"]
            if deleted_count > 0:
                return {"status": "success", "message": "Watchlist supprimée avec succès"}
            else:
                raise HTTPException(status_code=404, detail="Watchlist non trouvée ou vous n'êtes pas le propriétaire")
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/public/all", response_model=List[WatchlistOut])
def get_public_watchlists(limit: int = 20, skip: int = 0):
    """Récupérer les watchlists publiques"""
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (u:User)-[:OWNS]->(w:Watchlist {is_public: true})
                OPTIONAL MATCH (w)-[:CONTAINS]->(m:Movie)
                RETURN w.id as id, w.name as name, w.description as description,
                       w.is_public as is_public, w.created_at as created_at,
                       count(m) as movie_count, u.username as username
                ORDER BY w.created_at DESC
                SKIP $skip LIMIT $limit
            """, skip=skip, limit=limit)
            
            watchlists = []
            for record in result:
                watchlists.append(WatchlistOut(
                    id=record["id"],
                    name=record["name"],
                    description=record["description"],
                    is_public=record["is_public"],
                    created_at=record["created_at"],
                    movie_count=record["movie_count"],
                    username=record["username"]
                ))
            return watchlists
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/movie/{movie_title}/check")
def check_movie_in_watchlists(movie_title: str, username: str = Depends(verify_token)):
    """Vérifier dans quelles watchlists se trouve un film"""
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (u:User {username: $username})-[:OWNS]->(w:Watchlist)-[:CONTAINS]->(m:Movie {title: $movie_title})
                RETURN w.id as id, w.name as name
            """, username=username, movie_title=movie_title)
            
            watchlists = [{"id": record["id"], "name": record["name"]} for record in result]
            return {"movie_title": movie_title, "in_watchlists": watchlists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")