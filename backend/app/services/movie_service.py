# app/services/movie_service.py
from typing import List, Optional, Dict
from uuid import uuid4
from neo4j import Transaction

from app.models.schemas import MovieCreate, MovieUpdate, MovieResponse
from app.database.connection import get_db

class MovieService:
    def __init__(self):
        self.db = get_db()
    
    async def get_movies_with_filters(self, skip: int = 0, limit: int = 20, 
                                    genre: Optional[str] = None, 
                                    year: Optional[int] = None, 
                                    search: Optional[str] = None) -> List[Dict]:
        """Récupérer les films avec filtres avancés"""
        
        def get_movies_tx(tx: Transaction):
            # Construire la requête avec les filtres
            where_clauses = []
            params = {"skip": skip, "limit": limit}
            
            if genre:
                where_clauses.append("(m)-[:HAS_GENRE]->(g:Genre) AND toLower(g.name) CONTAINS toLower($genre)")
                params["genre"] = genre
            
            if year:
                where_clauses.append("m.year = $year")
                params["year"] = year
            
            if search:
                where_clauses.append("(toLower(m.title) CONTAINS toLower($search) OR toLower(m.synopsis) CONTAINS toLower($search))")
                params["search"] = search
            
            where_clause = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
            
            query = f"""
            MATCH (m:Movie)
            {where_clause}
            WITH m
            OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
            OPTIONAL MATCH (p:Person)-[:ACTED_IN]->(m)
            OPTIONAL MATCH (d:Person)-[:DIRECTED]->(m)
            OPTIONAL MATCH (u:User)-[r:RATED]->(m)
            WITH m, 
                 COLLECT(DISTINCT {{id: g.id, name: g.name}}) AS genres,
                 COLLECT(DISTINCT {{id: p.id, name: p.name}}) AS actors,
                 COLLECT(DISTINCT {{id: d.id, name: d.name}}) AS directors,
                 AVG(r.rating) AS avg_rating,
                 COUNT(r) AS rating_count
            ORDER BY m.created_at DESC
            SKIP $skip LIMIT $limit
            RETURN m, genres, actors, directors, avg_rating, rating_count
            """
            
            return tx.run(query, params)
        
        with self.db.driver.session() as session:
            result = session.execute_read(get_movies_tx)
            movies = []
            
            for record in result:
                movie_data = record['m']
                movie = {
                    "id": movie_data['id'],
                    "title": movie_data['title'],
                    "year": movie_data['year'],
                    "duration": movie_data.get('duration'),
                    "synopsis": movie_data.get('synopsis'),
                    "poster_url": movie_data.get('poster_url'),
                    "trailer_url": movie_data.get('trailer_url'),
                    "created_at": movie_data['created_at'],
                    "updated_at": movie_data['updated_at'],
                    "genres": record['genres'] or [],
                    "actors": record['actors'] or [],
                    "directors": record['directors'] or [],
                    "average_rating": record['avg_rating'],
                    "rating_count": record['rating_count'] or 0
                }
                movies.append(movie)
            
            return movies
    
    async def get_movie_actors(self, movie_id: str) -> List[Dict]:
        """Récupérer les acteurs d'un film avec leurs rôles"""
        
        def get_actors_tx(tx: Transaction):
            query = """
            MATCH (p:Person)-[acted:ACTED_IN]->(m:Movie {id: $movie_id})
            RETURN p, acted
            ORDER BY p.name
            """
            return tx.run(query, {"movie_id": movie_id})
        
        with self.db.driver.session() as session:
            result = session.execute_read(get_actors_tx)
            actors = []
            
            for record in result:
                actor_data = record['p']
                acted_rel = record['acted']
                actor = {
                    "id": actor_data['id'],
                    "name": actor_data['name'],
                    "character_name": acted_rel.get('character_name'),
                    "photo_url": actor_data.get('photo_url')
                }
                actors.append(actor)
            
            return actors
    
    async def add_actor_to_movie(self, movie_id: str, actor_id: str, character_name: str, admin_id: str):
        """Ajouter un acteur à un film (admin seulement)"""
        
        def add_actor_tx(tx: Transaction):
            # Vérifier que le film et l'acteur existent
            check_query = """
            MATCH (m:Movie {id: $movie_id})
            MATCH (p:Person {id: $actor_id})
            RETURN m, p
            """
            check_result = tx.run(check_query, {
                "movie_id": movie_id,
                "actor_id": actor_id
            })
            
            if not check_result.single():
                raise ValueError("Film ou acteur non trouvé")
            
            # Vérifier que la relation n'existe pas déjà
            existing_query = """
            MATCH (p:Person {id: $actor_id})-[r:ACTED_IN]->(m:Movie {id: $movie_id})
            RETURN r
            """
            existing = tx.run(existing_query, {
                "movie_id": movie_id,
                "actor_id": actor_id
            }).single()
            
            if existing:
                raise ValueError("Cet acteur est déjà associé à ce film")
            
            # Créer la relation
            create_query = """
            MATCH (p:Person {id: $actor_id})
            MATCH (m:Movie {id: $movie_id})
            CREATE (p)-[r:ACTED_IN {character_name: $character_name}]->(m)
            RETURN r
            """
            tx.run(create_query, {
                "movie_id": movie_id,
                "actor_id": actor_id,
                "character_name": character_name
            })
        
        with self.db.driver.session() as session:
            session.execute_write(add_actor_tx)
    
    async def get_trending_movies(self, limit: int = 10) -> List[Dict]:
        """Récupérer les films tendance (basé sur les avis récents)"""
        
        def trending_tx(tx: Transaction):
            query = """
            MATCH (m:Movie)<-[r:RATED]-(u:User)
            WHERE r.created_at > datetime() - duration('P30D')  // 30 derniers jours
            WITH m, AVG(r.rating) AS avg_rating, COUNT(r) AS rating_count
            WHERE rating_count >= 2  // Au moins 2 avis
            ORDER BY avg_rating DESC, rating_count DESC
            LIMIT $limit
            RETURN m, avg_rating, rating_count
            """
            
            return tx.run(query, {"limit": limit})
        
        with self.db.driver.session() as session:
            result = session.execute_read(trending_tx)
            trending_movies = []
            
            for record in result:
                movie_data = record['m']
                movie = {
                    "id": movie_data['id'],
                    "title": movie_data['title'],
                    "year": movie_data['year'],
                    "poster_url": movie_data.get('poster_url'),
                    "average_rating": record['avg_rating'],
                    "rating_count": record['rating_count']
                }
                trending_movies.append(movie)
            
            return trending_movies
    
    async def get_user_recommendations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Générer des recommandations pour un utilisateur"""
        
        def recommendations_tx(tx: Transaction):
            # Algorithme simple de recommandation basé sur les goûts similaires
            query = """
            // Trouver les utilisateurs avec des goûts similaires
            MATCH (u1:User {id: $user_id})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(u2:User)
            WHERE r1.rating >= 7 AND r2.rating >= 7 AND u1 <> u2
            
            // Trouver les films que ces utilisateurs ont bien notés mais que l'utilisateur n'a pas vus
            MATCH (u2)-[r3:RATED]->(rec:Movie)
            WHERE r3.rating >= 7
              AND NOT EXISTS((u1)-[:RATED]->(rec))
            
            WITH rec, AVG(r3.rating) AS avg_rating, COUNT(DISTINCT u2) AS recommender_count
            WHERE recommender_count >= 1
            ORDER BY avg_rating DESC, recommender_count DESC
            LIMIT $limit
            
            RETURN rec, avg_rating, recommender_count
            """
            
            return tx.run(query, {"user_id": user_id, "limit": limit})
        
        with self.db.driver.session() as session:
            result = session.execute_read(recommendations_tx)
            recommendations = []
            
            for record in result:
                movie_data = record['rec']
                movie = {
                    "id": movie_data['id'],
                    "title": movie_data['title'],
                    "year": movie_data['year'],
                    "poster_url": movie_data.get('poster_url'),
                    "recommended_rating": record['avg_rating'],
                    "recommender_count": record['recommender_count']
                }
                recommendations.append(movie)
            
            return recommendations
    
    async def search_movies_advanced(self, query: str, search_type: str = "all") -> Dict[str, List[Dict]]:
        """Recherche avancée dans films, acteurs, genres"""
        
        def search_tx(tx: Transaction):
            results = {"movies": [], "actors": [], "genres": []}
            
            if search_type in ["all", "movie"]:
                movie_query = """
                MATCH (m:Movie)
                WHERE toLower(m.title) CONTAINS toLower($query)
                   OR toLower(m.synopsis) CONTAINS toLower($query)
                OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
                WITH m, COLLECT(DISTINCT g.name) AS genres
                ORDER BY m.year DESC
                LIMIT 10
                RETURN m, genres
                """
                movie_result = tx.run(movie_query, {"query": query})
                results["movies"] = [
                    {
                        "id": record['m']['id'],
                        "title": record['m']['title'],
                        "year": record['m']['year'],
                        "poster_url": record['m'].get('poster_url'),
                        "genres": record['genres']
                    }
                    for record in movie_result
                ]
            
            if search_type in ["all", "person"]:
                person_query = """
                MATCH (p:Person)
                WHERE toLower(p.name) CONTAINS toLower($query)
                OPTIONAL MATCH (p)-[:ACTED_IN]->(m:Movie)
                WITH p, COUNT(m) as movie_count
                ORDER BY movie_count DESC
                LIMIT 10
                RETURN p, movie_count
                """
                person_result = tx.run(person_query, {"query": query})
                results["actors"] = [
                    {
                        "id": record['p']['id'],
                        "name": record['p']['name'],
                        "photo_url": record['p'].get('photo_url'),
                        "movie_count": record['movie_count']
                    }
                    for record in person_result
                ]
            
            if search_type in ["all", "genre"]:
                genre_query = """
                MATCH (g:Genre)
                WHERE toLower(g.name) CONTAINS toLower($query)
                OPTIONAL MATCH (g)<-[:HAS_GENRE]-(m:Movie)
                WITH g, COUNT(m) as movie_count
                ORDER BY movie_count DESC
                LIMIT 10
                RETURN g, movie_count
                """
                genre_result = tx.run(genre_query, {"query": query})
                results["genres"] = [
                    {
                        "id": record['g']['id'],
                        "name": record['g']['name'],
                        "movie_count": record['movie_count']
                    }
                    for record in genre_result
                ]
            
            return results
        
        with self.db.driver.session() as session:
            return session.execute_read(search_tx)