# app/database/connection.py
from neo4j import GraphDatabase
import os

class Neo4jConnection:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            auth=(
                os.getenv("NEO4J_USERNAME", "neo4j"),  # Changé NEO4J_USER -> NEO4J_USERNAME
                os.getenv("NEO4J_PASSWORD", "password")
            )
        )
    
    def close(self):
        if self.driver:
            self.driver.close()
    
    def execute_query(self, query, parameters=None):
        with self.driver.session() as session:
            return session.run(query, parameters or {})

# Instance globale de connexion
_db_connection = None

def get_db():
    global _db_connection
    if _db_connection is None:
        _db_connection = Neo4jConnection()
    return _db_connection

def close_db():
    global _db_connection
    if _db_connection:
        _db_connection.close()
        _db_connection = None