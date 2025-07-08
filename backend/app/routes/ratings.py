# app/routes/ratings.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from uuid import uuid4

from app.models.schemas import (
    RatingCreate, UserResponse
)
from app.auth.dependencies import get_current_user, require_user_or_admin
from app.database.connection import get_db
from app.utils.helpers import convert_neo4j_datetime

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_rating(
    rating_data: RatingCreate,
    current_user: UserResponse = Depends(require_user_or_admin)
):
    """Créer ou mettre à jour un avis sur un film"""
    try:
        db = get_db()
        
        with db.driver.session() as session:
            # Vérifier que le film existe
            movie_check = session.run(
                "MATCH (m:Movie {id: $movie_id}) RETURN m",
                {"movie_id": rating_data.movie_id}
            ).single()
            
            if not movie_check:
                raise HTTPException(status_code=404, detail="Film non trouvé")
            
            # Vérifier si l'utilisateur a déjà noté ce film
            existing_rating = session.run("""
                MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
                RETURN r
                """, {
                "user_id": current_user.id,
                "movie_id": rating_data.movie_id
            }).single()
            
            if existing_rating:
                # Mettre à jour l'avis existant
                query = """
                MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
                SET r.rating = $rating,
                    r.comment = $comment,
                    r.updated_at = datetime()
                RETURN r, u, m
                """
                action = "mis à jour"
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
                RETURN r, u, m
                """
                action = "créé"
            
            result = session.run(query, {
                "user_id": current_user.id,
                "movie_id": rating_data.movie_id,
                "rating_id": str(uuid4()) if not existing_rating else None,
                "rating": rating_data.rating,
                "comment": rating_data.comment
            })
            
            record = result.single()
            if not record:
                raise ValueError(f"Erreur lors de la création/mise à jour de l'avis")
            
            return {
                "message": f"Avis {action} avec succès",
                "rating": {
                    "id": record['r'].get('id'),
                    "rating": record['r']['rating'],
                    "comment": record['r'].get('comment'),
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
            
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de l'avis: {str(e)}")

@router.get("/movie/{movie_id}", response_model=List[dict])
async def get_movie_ratings(
    movie_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50)
):
    """Récupérer les avis d'un film"""
    try:
        db = get_db()
        
        with db.driver.session() as session:
            query = """
            MATCH (u:User)-[r:RATED]->(m:Movie {id: $movie_id})
            ORDER BY r.created_at DESC
            SKIP $skip LIMIT $limit
            RETURN r, u, m
            """
            
            result = session.run(query, {
                "movie_id": movie_id,
                "skip": skip,
                "limit": limit
            })
            
            ratings = []
            for record in result:
                rating = {
                    "id": record['r'].get('id'),
                    "rating": record['r']['rating'],
                    "comment": record['r'].get('comment'),
                    "created_at": convert_neo4j_datetime(record['r']['created_at']),
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
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des avis: {str(e)}")

@router.get("/user/me", response_model=List[dict])
async def get_my_ratings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(require_user_or_admin)
):
    """Récupérer mes avis"""
    try:
        db = get_db()
        
        with db.driver.session() as session:
            query = """
            MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
            ORDER BY r.created_at DESC
            SKIP $skip LIMIT $limit
            RETURN r, u, m
            """
            
            result = session.run(query, {
                "user_id": current_user.id,
                "skip": skip,
                "limit": limit
            })
            
            ratings = []
            for record in result:
                rating = {
                    "id": record['r'].get('id'),
                    "rating": record['r']['rating'],
                    "comment": record['r'].get('comment'),
                    "created_at": convert_neo4j_datetime(record['r']['created_at']),
                    "movie": {
                        "id": record['m']['id'],
                        "title": record['m']['title'],
                        "year": record['m']['year'],
                        "poster_url": record['m'].get('poster_url')
                    }
                }
                ratings.append(rating)
            
            return ratings
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des avis: {str(e)}")

@router.delete("/{movie_id}")
async def delete_rating(
    movie_id: str,
    current_user: UserResponse = Depends(require_user_or_admin)
):
    """Supprimer son avis sur un film"""
    try:
        db = get_db()
        
        with db.driver.session() as session:
            # Vérifier que l'avis existe
            check_query = """
            MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
            RETURN r
            """
            result = session.run(check_query, {
                "user_id": current_user.id,
                "movie_id": movie_id
            })
            
            if not result.single():
                raise HTTPException(status_code=404, detail="Avis non trouvé")
            
            # Supprimer l'avis
            delete_query = """
            MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
            DELETE r
            """
            session.run(delete_query, {
                "user_id": current_user.id,
                "movie_id": movie_id
            })
            
            return {"message": "Avis supprimé avec succès"}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression de l'avis: {str(e)}")