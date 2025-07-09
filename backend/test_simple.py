#!/usr/bin/env python3
"""
Test simple pour vérifier que l'API fonctionne
"""

from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Test API")

@app.get("/")
def test():
    return {"message": "API fonctionne !"}

@app.get("/test-neo4j")
def test_neo4j():
    try:
        from neo4j import GraphDatabase
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        
        uri = os.getenv("NEO4J_URI")
        username = os.getenv("NEO4J_USERNAME")
        password = os.getenv("NEO4J_PASSWORD")
        
        driver = GraphDatabase.driver(uri, auth=(username, password))
        
        with driver.session() as session:
            result = session.run("MATCH (m:Movie) RETURN COUNT(m) as count LIMIT 1")
            count = result.single()["count"]
            
        driver.close()
        
        return {"status": "success", "movies_count": count}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
