from fastapi import APIRouter, Depends, HTTPException, status, Body
from db.neo4j_conn import neo4j_conn
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime
import os

router = APIRouter()

# Auth: JWT obligatoire, plus de token statique
SECRET_KEY = os.getenv("API_TOKEN", "supersecret")
ALGORITHM = "HS256"
security = HTTPBearer()

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

def verify_admin(username: str = Depends(verify_token)):
    with neo4j_conn.driver.session() as session:
        result = session.run("MATCH (u:User {username: $username}) RETURN u.role as role", username=username)
        record = result.single()
        if not record or record["role"] != "admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
        return username

# ===== MOVIES ROUTES =====

@router.get("/")
def get_all_movies(limit: int = 20, skip: int = 0):
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (m:Movie)
                RETURN m.title as title, m.released as released, m.tagline as tagline
                ORDER BY m.released DESC
                SKIP $skip LIMIT $limit
            """, skip=skip, limit=limit)
            movies = [dict(record) for record in result]
        return {"status": "success", "movies": movies, "count": len(movies)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/{title}")
def get_movie_by_title(title: str):
    try:
        with neo4j_conn.driver.session() as session:
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

@router.post("", dependencies=[Depends(verify_admin)])
def create_movie(movie_data: dict, username: str = Depends(verify_admin)):
    try:
        title = movie_data.get("title")
        released = movie_data.get("released")
        tagline = movie_data.get("tagline", "")
        directors = movie_data.get("directors", [])
        producers = movie_data.get("producers", [])
        actors = movie_data.get("actors", [])
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
            for director in directors:
                if director.strip():
                    session.run("""
                        MERGE (p:Person {name: $name})
                        WITH p
                        MATCH (m:Movie {title: $title})
                        MERGE (p)-[:DIRECTED]->(m)
                    """, name=director.strip(), title=title)
            for producer in producers:
                if producer.strip():
                    session.run("""
                        MERGE (p:Person {name: $name})
                        WITH p
                        MATCH (m:Movie {title: $title})
                        MERGE (p)-[:PRODUCED]->(m)
                    """, name=producer.strip(), title=title)
            for actor in actors:
                if actor.get("name", "").strip():
                    session.run("""
                        MERGE (p:Person {name: $name})
                        WITH p
                        MATCH (m:Movie {title: $title})
                        MERGE (p)-[:ACTED_IN {roles: $roles}]->(m)
                    """, name=actor["name"].strip(), title=title, roles=actor.get("roles", []))
        return {"status": "success", "message": f"Film '{title}' créé avec succès avec toutes ses relations"}
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.put("/{title}", dependencies=[Depends(verify_admin)])
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
            if "directors" in movie_data:
                session.run("""
                    MATCH (m:Movie {title: $title})<-[r:DIRECTED]-()
                    DELETE r
                """, title=title)
                for director in movie_data["directors"]:
                    if director.strip():
                        session.run("""
                            MERGE (p:Person {name: $name})
                            WITH p
                            MATCH (m:Movie {title: $title})
                            MERGE (p)-[:DIRECTED]->(m)
                        """, name=director.strip(), title=title)
            if "producers" in movie_data:
                session.run("""
                    MATCH (m:Movie {title: $title})<-[r:PRODUCED]-()
                    DELETE r
                """, title=title)
                for producer in movie_data["producers"]:
                    if producer.strip():
                        session.run("""
                            MERGE (p:Person {name: $name})
                            WITH p
                            MATCH (m:Movie {title: $title})
                            MERGE (p)-[:PRODUCED]->(m)
                        """, name=producer.strip(), title=title)
            if "actors" in movie_data:
                session.run("""
                    MATCH (m:Movie {title: $title})<-[r:ACTED_IN]-()
                    DELETE r
                """, title=title)
                for actor in movie_data["actors"]:
                    if actor.get("name", "").strip():
                        session.run("""
                            MERGE (p:Person {name: $name})
                            WITH p
                            MATCH (m:Movie {title: $title})
                            MERGE (p)-[:ACTED_IN {roles: $roles}]->(m)
                        """, name=actor["name"].strip(), title=title, roles=actor.get("roles", []))
        return {"status": "success", "message": f"Film '{title}' mis à jour avec succès avec toutes ses relations"}
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.delete("/{title}", dependencies=[Depends(verify_admin)])
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
        return {"status": "success", "message": f"Film '{title}' supprimé avec succès"}
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/{movie_title}/actors", dependencies=[Depends(verify_admin)])
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
        return {"status": "success", "message": f"Acteur '{actor_name}' ajouté au film '{movie_title}'"}
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/{title}/actors")
def get_actors_by_movie(title: str):
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

@router.get("/search")
def search_movies(q: str, limit: int = 10, fuzzy: bool = True):
    try:
        with neo4j_conn.driver.session() as session:
            if fuzzy:
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
                result = session.run('''
                    MATCH (m:Movie)
                    WHERE toLower(m.title) CONTAINS toLower($search)
                    RETURN m.title as title, m.released as released, m.tagline as tagline
                    ORDER BY m.released DESC
                    LIMIT $limit
                ''', search=q, limit=limit)
                movies = [dict(record) for record in result]
        return {"status": "success", "movies": movies, "query": q, "count": len(movies)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/search/movies")
def search_movies_alias(q: str, limit: int = 10, fuzzy: bool = True):
    return search_movies(q=q, limit=limit, fuzzy=fuzzy)

@router.get("/recommend/similar/{title}")
def recommend_similar_movies(title: str, limit: int = 5):
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

@router.get("/recommend/movies/similar/{title}")
def recommend_similar_movies_alias(title: str, limit: int = 5):
    return recommend_similar_movies(title=title, limit=limit)
