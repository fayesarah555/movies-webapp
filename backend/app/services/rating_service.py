# app/services/rating_service.py
from typing import List, Optional, Dict
from uuid import uuid4
from neo4j import Transaction

from app.models.schemas import RatingCreate, RatingResponse
from app.database.connection import get_db

class RatingService:
    def __init__(self):
        self.db = get_db()
    
    async def create_or_update_rating(self, user_id: str, rating_data: RatingCreate) -> Dict:
        """Créer ou mettre à jour un avis"""
        
        def rating_tx(tx: Transaction):
            # Vérifier que le film existe
            movie_check = tx.run(
                "MATCH (m:Movie {id: $movie_id}) RETURN m",
                {"movie_id": rating_data.movie_id}
            ).single()
            
            if not movie_check:
                raise ValueError("Film non trouvé")
            
            # Vérifier si l'utilisateur a déjà noté ce film
            existing_rating = tx.run("""
                MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
                RETURN r
                """, {
                "user_id": user_id,
                "movie_id": rating_data.movie_id
            }).single()
            
            if existing_rating:
                # Mettre à jour l'avis existant
                query = """
                MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
                SET r.rating = $rating,
                    r.comment = $comment,
                    r.updated_at = datetime()
                RETURN r, u, m, 'updated' as action
                """
            else:
                # Créer un nouvel avis
                rating_id = str(uuid4())
                query = """
                MATCH (u:User {id: $user_id})
                MATCH (m:Movie {id: $movie_id})
                CREATE (u)-[r:RATED {
                    id: $rating_id,
                    rating: $rating,
                    comment: $comment,
                    created_at: datetime()
                }]->(m)
                RETURN r, u, m, 'created' as action
                """
            
            result = tx.run(query, {
                "user_id": user_id,
                "movie_id": rating_data.movie_id,
                "rating_id": str(uuid4()) if not existing_rating else None,
                "rating": rating_data.rating,
                "comment": rating_data.comment
            })
            
            return result.single()
        
        with self.db.driver.session() as session:
            record = session.execute_write(rating_tx)
            
            if not record:
                raise ValueError("Erreur lors de la création/mise à jour de l'avis")
            
            action = "mis à jour" if record['action'] == 'updated' else "créé"
            
            return {
                "message": f"Avis {action} avec succès",
                "rating": {
                    "id": record['r'].get('id'),
                    "rating": record['r']['rating'],
                    "comment": record['r'].get('comment'),
                    "created_at": record['r'].get('created_at'),
                    "user": {
                        "id": record['u']['id'],
                        "username": record['u']['username']
                    },
                    "movie": {
                        "id": record['m']['id'],
                        "title": record['m']['title']
                    }
                }
            }
    
    async def get_movie_ratings(self, movie_id: str, skip: int = 0, limit: int = 10) -> List[Dict]:
        """Récupérer les avis d'un film avec statistiques"""
        
        def get_ratings_tx(tx: Transaction):
            # Vérifier que le film existe
            movie_check = tx.run(
                "MATCH (m:Movie {id: $movie_id}) RETURN m",
                {"movie_id": movie_id}
            ).single()
            
            if not movie_check:
                raise ValueError("Film non trouvé")
            
            # Récupérer les avis avec pagination
            query = """
            MATCH (u:User)-[r:RATED]->(m:Movie {id: $movie_id})
            ORDER BY r.created_at DESC
            SKIP $skip LIMIT $limit
            RETURN r, u, m
            """
            
            return tx.run(query, {
                "movie_id": movie_id,
                "skip": skip,
                "limit": limit
            })
        
        with self.db.driver.session() as session:
            result = session.execute_read(get_ratings_tx)
            ratings = []
            
            for record in result:
                rating = {
                    "id": record['r'].get('id'),
                    "rating": record['r']['rating'],
                    "comment": record['r'].get('comment'),
                    "created_at": record['r']['created_at'],
                    "user": {
                        "id": record['u']['id'],
                        "username": record['u']['username']
                    },
                    "movie": {
                        "id": record['m']['id'],
                        "title": record['m']['title']
                    }
                }
                ratings.append(rating)
            
            return ratings
    
    async def get_user_ratings(self, user_id: str, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Récupérer les avis d'un utilisateur"""
        
        def get_user_ratings_tx(tx: Transaction):
            query = """
            MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
            OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
            WITH u, r, m, COLLECT(DISTINCT g.name) AS genres
            ORDER BY r.created_at DESC
            SKIP $skip LIMIT $limit
            RETURN r, u, m, genres
            """
            
            return tx.run(query, {
                "user_id": user_id,
                "skip": skip,
                "limit": limit
            })
        
        with self.db.driver.session() as session:
            result = session.execute_read(get_user_ratings_tx)
            ratings = []
            
            for record in result:
                rating = {
                    "id": record['r'].get('id'),
                    "rating": record['r']['rating'],
                    "comment": record['r'].get('comment'),
                    "created_at": record['r']['created_at'],
                    "movie": {
                        "id": record['m']['id'],
                        "title": record['m']['title'],
                        "year": record['m']['year'],
                        "poster_url": record['m'].get('poster_url'),
                        "genres": record['genres']
                    }
                }
                ratings.append(rating)
            
            return ratings
    
    async def delete_rating(self, user_id: str, movie_id: str) -> bool:
        """Supprimer un avis"""
        
        def delete_rating_tx(tx: Transaction):
            # Vérifier que l'avis existe
            check_query = """
            MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
            RETURN r
            """
            result = tx.run(check_query, {
                "user_id": user_id,
                "movie_id": movie_id
            })
            
            if not result.single():
                return False
            
            # Supprimer l'avis
            delete_query = """
            MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
            DELETE r
            """
            tx.run(delete_query, {
                "user_id": user_id,
                "movie_id": movie_id
            })
            
            return True
        
        with self.db.driver.session() as session:
            return session.execute_write(delete_rating_tx)
    
    async def get_rating_statistics(self, movie_id: str) -> Dict:
        """Récupérer les statistiques des avis d'un film"""
        
        def stats_tx(tx: Transaction):
            query = """
            MATCH (m:Movie {id: $movie_id})
            OPTIONAL MATCH (u:User)-[r:RATED]->(m)
            WITH m, 
                 COUNT(r) as total_ratings,
                 AVG(r.rating) as average_rating,
                 MIN(r.rating) as min_rating,
                 MAX(r.rating) as max_rating,
                 COLLECT(r.rating) as all_ratings
            
            // Calculer la distribution des notes
            UNWIND [1,2,3,4,5,6,7,8,9,10] as rating_value
            OPTIONAL MATCH (u2:User)-[r2:RATED]->(m)
            WHERE toInteger(r2.rating) = rating_value
            WITH m, total_ratings, average_rating, min_rating, max_rating, 
                 rating_value, COUNT(r2) as count_for_rating
            ORDER BY rating_value
            
            RETURN m.title as movie_title,
                   total_ratings,
                   average_rating,
                   min_rating,
                   max_rating,
                   COLLECT({rating: rating_value, count: count_for_rating}) as distribution
            """
            
            return tx.run(query, {"movie_id": movie_id})
        
        with self.db.driver.session() as session:
            result = session.execute_read(stats_tx)
            record = result.single()
            
            if not record:
                return {
                    "total_ratings": 0,
                    "average_rating": None,
                    "min_rating": None,
                    "max_rating": None,
                    "distribution": []
                }
            
            return {
                "movie_title": record['movie_title'],
                "total_ratings": record['total_ratings'],
                "average_rating": record['average_rating'],
                "min_rating": record['min_rating'],
                "max_rating": record['max_rating'],
                "distribution": record['distribution']
            }
    
    async def get_user_rating_for_movie(self, user_id: str, movie_id: str) -> Optional[Dict]:
        """Récupérer l'avis d'un utilisateur pour un film spécifique"""
        
        def get_rating_tx(tx: Transaction):
            query = """
            MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
            RETURN r, u, m
            """
            
            return tx.run(query, {
                "user_id": user_id,
                "movie_id": movie_id
            }).single()
        
        with self.db.driver.session() as session:
            record = session.execute_read(get_rating_tx)
            
            if not record:
                return None
            
            return {
                "id": record['r']['id'],
                "rating": record['r']['rating'],
                "comment": record['r'].get('comment'),
                "created_at": record['r']['created_at'],
                "updated_at": record['r'].get('updated_at'),
                "user": {
                    "id": record['u']['id'],
                    "username": record['u']['username']
                },
                "movie": {
                    "id": record['m']['id'],
                    "title": record['m']['title']
                }
            }