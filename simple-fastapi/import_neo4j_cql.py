from neo4j import GraphDatabase
import re

# Paramètres de connexion Neo4j Aura (à adapter si besoin)
uri = "neo4j+s://9bd559cc.databases.neo4j.io"
user = "neo4j"
password = "puc8nLkO7aB9uiv_yjQkAJ43cu9yzBsGwf4zvJ-3QL8"
database = "neo4j"  # optionnel, par défaut 'neo4j'

# Chemin relatif au script CQL (adapter si besoin)
cql_path = "../db/db-matrix.cql"

# Lecture du script CQL
with open(cql_path, encoding="utf-8") as f:
    cql_script = f.read()

# Découpage en requêtes individuelles (par point-virgule, mais en gardant les blocs multi-lignes)
# Sépare sur les points-virgules qui sont suivis d'un retour à la ligne et d'un CREATE ou d'un commentaire ou de la fin du fichier
pattern = r";\s*(?=CREATE|//|#|$)"
queries = [q.strip() for q in re.split(pattern, cql_script, flags=re.MULTILINE) if q.strip()]

driver = GraphDatabase.driver(uri, auth=(user, password))

with driver.session(database=database) as session:
    # Suppression de toutes les données existantes
    print("Suppression de toutes les données existantes...")
    session.run("MATCH (n) DETACH DELETE n")
    print("Base vidée. Import des nouvelles données...")
    for query in queries:
        try:
            session.run(query)
        except Exception as e:
            print(f"Erreur lors de l'exécution d'une requête : {e}\nRequête : {query[:100]}...")

print("Import terminé !")
