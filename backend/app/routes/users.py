# app/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.schemas import UserResponse
from app.auth.dependencies import get_current_user, require_admin
from app.database.connection import get_db

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_users(
    current_user: UserResponse = Depends(require_admin)
):
    """Récupérer la liste des utilisateurs (Admin seulement)"""
    try:
        db = get_db()
        
        with db.driver.session() as session:
            query = """
            MATCH (u:User)
            OPTIONAL MATCH (u)-[r:RATED]->()
            WITH u, COUNT(r) as rating_count
            ORDER BY u.created_at DESC
            RETURN u, rating_count
            """
            
            result = session.run(query)
            users = []
            
            for record in result:
                user_data = record['u']
                user = {
                    "id": user_data['id'],
                    "username": user_data['username'],
                    "email": user_data['email'],
                    "role": user_data['role'],
                    "created_at": user_data['created_at'],
                    "rating_count": record['rating_count']
                }
                users.append(user)
            
            return users
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des utilisateurs: {str(e)}")

@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Récupérer un utilisateur par ID"""
    try:
        # L'utilisateur ne peut voir que son propre profil (sauf admin)
        if current_user.role != "admin" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Accès interdit")
        
        db = get_db()
        
        with db.driver.session() as session:
            query = """
            MATCH (u:User {id: $user_id})
            OPTIONAL MATCH (u)-[r:RATED]->()
            WITH u, COUNT(r) as rating_count, AVG(r.rating) as avg_rating
            RETURN u, rating_count, avg_rating
            """
            
            result = session.run(query, {"user_id": user_id})
            record = result.single()
            
            if not record:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            
            user_data = record['u']
            return {
                "id": user_data['id'],
                "username": user_data['username'],
                "email": user_data['email'],
                "role": user_data['role'],
                "created_at": user_data['created_at'],
                "rating_count": record['rating_count'],
                "average_rating": record['avg_rating']
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de l'utilisateur: {str(e)}")

@router.get("/{user_id}/stats", response_model=dict)
async def get_user_stats(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Récupérer les statistiques d'un utilisateur"""
    try:
        # L'utilisateur ne peut voir que ses propres stats (sauf admin)
        if current_user.role != "admin" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Accès interdit")
        
        db = get_db()
        
        with db.driver.session() as session:
            query = """
            MATCH (u:User {id: $user_id})
            OPTIONAL MATCH (u)-[r:RATED]->(m:Movie)
            OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
            WITH u, 
                 COUNT(DISTINCT r) as total_ratings,
                 AVG(r.rating) as avg_rating,
                 COLLECT(DISTINCT g.name) as favorite_genres
            RETURN u, total_ratings, avg_rating, favorite_genres
            """
            
            result = session.run(query, {"user_id": user_id})
            record = result.single()
            
            if not record:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            
            return {
                "total_ratings": record['total_ratings'],
                "average_rating": record['avg_rating'],
                "favorite_genres": record['favorite_genres'][:5]  # Top 5 genres
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des statistiques: {str(e)}")