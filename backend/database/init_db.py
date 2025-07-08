#!/usr/bin/env python3
"""
Script d'initialisation de la base de données Neo4j
Crée les contraintes, index et données d'exemple pour démarrer
"""

import os
import sys
from uuid import uuid4
from dotenv import load_dotenv

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database.connection import get_db
from app.auth.dependencies import get_password_hash

def create_constraints():
    """Créer les contraintes d'unicité"""
    print("📋 Création des contraintes...")
    
    db = get_db()
    constraints = [
        "CREATE CONSTRAINT unique_movie_id IF NOT EXISTS FOR (m:Movie) REQUIRE m.id IS UNIQUE",
        "CREATE CONSTRAINT unique_person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE", 
        "CREATE CONSTRAINT unique_user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
        "CREATE CONSTRAINT unique_user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE",
        "CREATE CONSTRAINT unique_user_username IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE",
        "CREATE CONSTRAINT unique_genre_id IF NOT EXISTS FOR (g:Genre) REQUIRE g.id IS UNIQUE",
        "CREATE CONSTRAINT unique_platform_id IF NOT EXISTS FOR (p:Platform) REQUIRE p.id IS UNIQUE"
    ]
    
    with db.driver.session() as session:
        for constraint in constraints:
            try:
                session.run(constraint)
                print(f"  ✅ {constraint.split()[2]}")
            except Exception as e:
                print(f"  ⚠️  Contrainte existe déjà: {constraint.split()[2]}")

def create_indexes():
    """Créer les index pour améliorer les performances"""
    print("\n🚀 Création des index...")
    
    db = get_db()
    indexes = [
        "CREATE INDEX movie_title_index IF NOT EXISTS FOR (m:Movie) ON (m.title)",
        "CREATE INDEX movie_year_index IF NOT EXISTS FOR (m:Movie) ON (m.year)",
        "CREATE INDEX person_name_index IF NOT EXISTS FOR (p:Person) ON (p.name)",
        "CREATE INDEX genre_name_index IF NOT EXISTS FOR (g:Genre) ON (g.name)"
    ]
    
    with db.driver.session() as session:
        for index in indexes:
            try:
                session.run(index)
                print(f"  ✅ {index.split()[2]}")
            except Exception as e:
                print(f"  ⚠️  Index existe déjà: {index.split()[2]}")

def create_admin_user():
    """Créer l'utilisateur admin par défaut"""
    print("\n👤 Création de l'utilisateur admin...")
    
    db = get_db()
    admin_id = str(uuid4())
    admin_password = get_password_hash("admin123")
    
    with db.driver.session() as session:
        # Vérifier si admin existe déjà
        existing = session.run("MATCH (u:User {email: 'admin@moviedb.com'}) RETURN u").single()
        
        if existing:
            print("  ⚠️  Utilisateur admin existe déjà")
            return
        
        # Créer l'admin
        session.run("""
        CREATE (admin:User {
            id: $admin_id,
            username: "admin",
            email: "admin@moviedb.com",
            password_hash: $password_hash,
            role: "admin",
            created_at: datetime()
        })
        """, {
            "admin_id": admin_id,
            "password_hash": admin_password
        })
        
        print("  ✅ Admin créé: admin@moviedb.com / admin123")

def create_sample_data():
    """Créer des données d'exemple"""
    print("\n🎬 Création des données d'exemple...")
    
    db = get_db()
    
    with db.driver.session() as session:
        # Vérifier si des films existent déjà
        existing_movies = session.run("MATCH (m:Movie) RETURN count(m) as count").single()["count"]
        
        if existing_movies > 0:
            print(f"  ⚠️  {existing_movies} films existent déjà, ignorer la création d'exemples")
            return
        
        # Créer des genres
        print("  📂 Création des genres...")
        genres = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller"]
        for genre_name in genres:
            genre_id = str(uuid4())
            session.run("""
            CREATE (g:Genre {
                id: $genre_id,
                name: $name
            })
            """, {"genre_id": genre_id, "name": genre_name})
        
        # Créer des plateformes
        print("  📺 Création des plateformes...")
        platforms = [
            {"name": "Netflix", "website": "https://netflix.com"},
            {"name": "Amazon Prime", "website": "https://primevideo.com"},
            {"name": "Disney+", "website": "https://disneyplus.com"},
        ]
        for platform in platforms:
            platform_id = str(uuid4())
            session.run("""
            CREATE (p:Platform {
                id: $platform_id,
                name: $name,
                website_url: $website
            })
            """, {
                "platform_id": platform_id,
                "name": platform["name"],
                "website": platform["website"]
            })
        
        # Créer des acteurs
        print("  🎭 Création des acteurs...")
        actors = [
            {"name": "Leonardo DiCaprio", "nationality": "American"},
            {"name": "Scarlett Johansson", "nationality": "American"},
            {"name": "Ryan Gosling", "nationality": "Canadian"},
            {"name": "Emma Stone", "nationality": "American"},
        ]
        for actor in actors:
            actor_id = str(uuid4())
            session.run("""
            CREATE (p:Person {
                id: $actor_id,
                name: $name,
                nationality: $nationality
            })
            """, {
                "actor_id": actor_id,
                "name": actor["name"],
                "nationality": actor["nationality"]
            })
        
        # Créer des films d'exemple
        print("  🎥 Création des films...")
        movies = [
            {
                "title": "Inception",
                "year": 2010,
                "duration": 148,
                "synopsis": "Un voleur qui s'infiltre dans les rêves se voit confier une mission impossible."
            },
            {
                "title": "La La Land",
                "year": 2016,
                "duration": 128,
                "synopsis": "Une actrice en herbe et un musicien de jazz tombent amoureux à Los Angeles."
            },
            {
                "title": "Avengers: Endgame",
                "year": 2019,
                "duration": 181,
                "synopsis": "Les Avengers assemblent une dernière fois pour défaire les actions de Thanos."
            }
        ]
        
        for movie in movies:
            movie_id = str(uuid4())
            session.run("""
            CREATE (m:Movie {
                id: $movie_id,
                title: $title,
                year: $year,
                duration: $duration,
                synopsis: $synopsis,
                created_at: datetime(),
                updated_at: datetime()
            })
            """, {
                "movie_id": movie_id,
                "title": movie["title"],
                "year": movie["year"],
                "duration": movie["duration"],
                "synopsis": movie["synopsis"]
            })
        
        # Créer quelques relations film-genre
        print("  🔗 Création des relations...")
        session.run("""
        MATCH (m:Movie {title: "Inception"}), (g:Genre {name: "Sci-Fi"})
        CREATE (m)-[:HAS_GENRE]->(g)
        """)
        
        session.run("""
        MATCH (m:Movie {title: "La La Land"}), (g:Genre {name: "Romance"})
        CREATE (m)-[:HAS_GENRE]->(g)
        """)
        
        session.run("""
        MATCH (m:Movie {title: "Avengers: Endgame"}), (g:Genre {name: "Action"})
        CREATE (m)-[:HAS_GENRE]->(g)
        """)
        
        print("  ✅ Données d'exemple créées")

def show_stats():
    """Afficher les statistiques de la base de données"""
    print("\n📊 Statistiques de la base de données:")
    
    db = get_db()
    
    with db.driver.session() as session:
        # Compter les différents types de nœuds
        stats = {}
        
        for label in ["Movie", "Person", "User", "Genre", "Platform"]:
            count = session.run(f"MATCH (n:{label}) RETURN count(n) as count").single()["count"]
            stats[label] = count
        
        # Compter les relations
        ratings_count = session.run("MATCH ()-[r:RATED]->() RETURN count(r) as count").single()["count"]
        
        print(f"  🎬 Films: {stats['Movie']}")
        print(f"  🎭 Personnes: {stats['Person']}")
        print(f"  👥 Utilisateurs: {stats['User']}")
        print(f"  📂 Genres: {stats['Genre']}")
        print(f"  📺 Plateformes: {stats['Platform']}")
        print(f"  ⭐ Avis: {ratings_count}")

def main():
    """Fonction principale d'initialisation"""
    print("🎬 === Initialisation de la base de données Movie DB ===\n")
    
    # Charger les variables d'environnement
    load_dotenv()
    
    try:
        # Vérifier la connexion à Neo4j
        print("🔗 Test de connexion à Neo4j...")
        db = get_db()
        with db.driver.session() as session:
            result = session.run("RETURN 1 as test").single()
            if result:
                print("  ✅ Connexion réussie\n")
            else:
                raise Exception("Test de connexion échoué")
        
        # Exécuter les étapes d'initialisation
        create_constraints()
        create_indexes()
        create_admin_user()
        create_sample_data()
        show_stats()
        
        print(f"\n🎉 === Initialisation terminée avec succès! ===")
        print(f"🌐 Lancez l'API avec: uvicorn main:app --reload")
        print(f"📖 Documentation: http://localhost:8000/docs")
        print(f"🔐 Connexion admin: admin@moviedb.com / admin123")
        
    except Exception as e:
        print(f"\n❌ Erreur lors de l'initialisation: {e}")
        print("🔧 Vérifiez que Neo4j est démarré et que vos variables .env sont correctes")
        sys.exit(1)

if __name__ == "__main__":
    main()