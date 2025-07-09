# app/database/connection.py
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
        """Établir la connexion à Neo4j"""
        try:
            self.driver = GraphDatabase.driver(
                self.uri, 
                auth=(self.username, self.password),
                encrypted=True
            )
            
            # Test de la connexion
            with self.driver.session() as session:
                result = session.run("RETURN 'Connection established' as message")
                message = result.single()["message"]
                print(f"✅ {message}")
                
            return True
        except Exception as e:
            print(f"❌ Erreur de connexion Neo4j: {e}")
            return False
    
    def close(self):
        """Fermer la connexion"""
        if self.driver:
            self.driver.close()
            print("🔌 Connexion Neo4j fermée")

# Instance globale de la connexion
neo4j_connection = Neo4jConnection()

def get_db():
    """Obtenir l'instance de connexion Neo4j"""
    return neo4j_connection

def init_db():
    """Initialiser la base de données"""
    print(f"🔗 Connexion à Neo4j Aura: {neo4j_connection.uri}")
    return neo4j_connection.connect()

def close_db():
    """Fermer la connexion à la base de données"""
    neo4j_connection.close()