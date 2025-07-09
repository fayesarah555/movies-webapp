from fastapi import APIRouter, Depends, HTTPException, status, Body
from db.neo4j_conn import neo4j_conn
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

router = APIRouter()

SECRET_KEY = os.getenv("API_TOKEN", "supersecret")
ALGORITHM = "HS256"
security = HTTPBearer()

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

@router.get("/")
def get_all_persons(limit: int = 20, skip: int = 0):
    try:
        with neo4j_conn.driver.session() as session:
            result = session.run("""
                MATCH (p:Person)
                RETURN p.name as name, p.born as born
                ORDER BY p.name
                SKIP $skip LIMIT $limit
            """, skip=skip, limit=limit)
            persons = [dict(record) for record in result]
        return {"status": "success", "persons": persons, "count": len(persons)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/{name}")
def get_person_by_name(name: str):
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

@router.post("", dependencies=[Depends(verify_admin)])
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
        return {"status": "success", "message": f"Personne '{name}' créée avec succès"}
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.put("/{name}", dependencies=[Depends(verify_admin)])
def update_person(name: str, person_data: dict, username: str = Depends(verify_admin)):
    try:
        new_name = person_data.get("name", name)
        born = person_data.get("born")
        with neo4j_conn.driver.session() as session:
            existing = session.run("MATCH (p:Person {name: $name}) RETURN p", name=name)
            if not existing.single():
                return {"status": "error", "message": "Personne non trouvée"}
            if new_name != name:
                name_conflict = session.run("MATCH (p:Person {name: $name}) RETURN p", name=new_name)
                if name_conflict.single():
                    return {"status": "error", "message": "Une personne avec ce nom existe déjà"}
            if born is not None:
                session.run("""
                    MATCH (p:Person {name: $old_name})
                    SET p.name = $new_name, p.born = $born
                    RETURN p
                """, old_name=name, new_name=new_name, born=born)
            else:
                session.run("""
                    MATCH (p:Person {name: $old_name})
                    SET p.name = $new_name
                    RETURN p
                """, old_name=name, new_name=new_name)
        return {"status": "success", "message": f"Personne '{name}' mise à jour avec succès"}
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.delete("/{name}", dependencies=[Depends(verify_admin)])
def delete_person(name: str, username: str = Depends(verify_admin)):
    try:
        with neo4j_conn.driver.session() as session:
            existing = session.run("MATCH (p:Person {name: $name}) RETURN p", name=name)
            if not existing.single():
                return {"status": "error", "message": "Personne non trouvée"}
            session.run("""
                MATCH (p:Person {name: $name})
                DETACH DELETE p
            """, name=name)
        return {"status": "success", "message": f"Personne '{name}' supprimée avec succès"}
    except HTTPException as e:
        if e.status_code == 403:
            return {"status": "error", "message": "Vous n'avez pas les accès nécessaires pour cette opération."}
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/actors/{name}/movies")
def get_movies_by_actor(name: str):
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

@router.get("/collaborations")
def get_collaborations(person1: str, person2: str):
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
