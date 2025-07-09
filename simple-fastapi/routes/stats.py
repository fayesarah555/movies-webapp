from fastapi import APIRouter
from db.neo4j_conn import neo4j_conn

router = APIRouter()

@router.get("/")
def get_database_stats():
    try:
        with neo4j_conn.driver.session() as session:
            movies_count = session.run("MATCH (m:Movie) RETURN count(m) as count").single()["count"]
            persons_count = session.run("MATCH (p:Person) RETURN count(p) as count").single()["count"]
            acted_in_count = session.run("MATCH ()-[r:ACTED_IN]->() RETURN count(r) as count").single()["count"]
            directed_count = session.run("MATCH ()-[r:DIRECTED]->() RETURN count(r) as count").single()["count"]
            produced_count = session.run("MATCH ()-[r:PRODUCED]->() RETURN count(r) as count").single()["count"]
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
