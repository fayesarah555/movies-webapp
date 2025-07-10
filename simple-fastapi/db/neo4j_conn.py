import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

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

neo4j_conn = Neo4jConnection()
