# app/routes/movies.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from app.models.schemas import (
    MovieCreate, MovieUpdate, MovieResponse, UserResponse
)
from app.auth.dependencies import get_current_user, require_admin
from app.database.connection import get_db
from app.utils.helpers import convert_neo4j_datetime, format_movie_response

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_movies(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Récupérer la liste des films avec pagination
    """
    try:
        db = get_db()
        
        with db.driver.session() as session:
            query = """
            MATCH (m:Movie)
            OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
            OPTIONAL MATCH (u:User)-[r:RATED]->(m)
            WITH m, 
                 COLLECT(DISTINCT {id: g.id, name: g.name}) AS genres,
                 AVG(r.rating) AS avg_rating,
                 COUNT(r) AS rating_count
            ORDER BY m.created_at DESC
            SKIP $skip LIMIT $limit
            RETURN m, genres, avg_rating, rating_count
            """
            
            result = session.run(query, {"skip": skip, "limit": limit})
            movies = []
            
            for record in result:
                movie_data = record['m']
                movie = format_movie_response(
                    movie_data=movie_data,
                    genres=record['genres'],
                    avg_rating=record['avg_rating'],
                    rating_count=record['rating_count']
                )
                movies.append(movie)
            
            return movies
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des films: {str(e)}")

@router.get("/{movie_id}", response_model=dict)
async def get_movie(movie_id: str):
    """
    Récupérer un film par son ID
    """
    try:
        db = get_db()
        
        with db.driver.session() as session:
            query = """
            MATCH (m:Movie {id: $movie_id})
            OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
            OPTIONAL MATCH (p:Person)-[acted:ACTED_IN]->(m)
            OPTIONAL MATCH (d:Person)-[:DIRECTED]->(m)
            OPTIONAL MATCH (u:User)-[r:RATED]->(m)
            WITH m, 
                 COLLECT(DISTINCT {id: g.id, name: g.name}) AS genres,
                 COLLECT(DISTINCT {
                     id: p.id, 
                     name: p.name, 
                     character_name: acted.character_name
                 }) AS actors,
                 COLLECT(DISTINCT {id: d.id, name: d.name}) AS directors,
                 AVG(r.rating) AS avg_rating,
                 COUNT(r) AS rating_count
            RETURN m, genres, actors, directors, avg_rating, rating_count
            """
            
            result = session.run(query, {"movie_id": movie_id})
            record = result.single()
            
            if not record:
                raise HTTPException(status_code=404, detail="Film non trouvé")
            
            movie_data = record['m']
            return format_movie_response(
                movie_data=movie_data,
                genres=record['genres'],
                actors=record['actors'],
                directors=record['directors'],
                avg_rating=record['avg_rating'],
                rating_count=record['rating_count']
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du film: {str(e)}")

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_movie(
    movie: MovieCreate,
    current_user: UserResponse = Depends(require_admin)
):
    """
    Créer un nouveau film (Admin seulement)
    """
    try:
        db = get_db()
        movie_id = str(uuid4())
        
        with db.driver.session() as session:
            # Créer le film
            create_query = """
            CREATE (m:Movie {
                id: $movie_id,
                title: $title,
                year: $year,
                duration: $duration,
                synopsis: $synopsis,
                poster_url: $poster_url,
                trailer_url: $trailer_url,
                created_at: datetime(),
                updated_at: datetime()
            })
            RETURN m
            """
            
            result = session.run(create_query, {
                "movie_id": movie_id,
                "title": movie.title,
                "year": movie.year,
                "duration": movie.duration,
                "synopsis": movie.synopsis,
                "poster_url": movie.poster_url,
                "trailer_url": movie.trailer_url
            })
            
            movie_node = result.single()
            if not movie_node:
                raise ValueError("Erreur lors de la création du film")
            
            # Retourner le film créé
            movie_data = movie_node['m']
            return format_movie_response(
                movie_data=movie_data
            )
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du film: {str(e)}")

@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(
    movie_id: str,
    current_user: UserResponse = Depends(require_admin)
):
    """
    Supprimer un film (Admin seulement)
    """
    try:
        db = get_db()
        
        with db.driver.session() as session:
            # Vérifier que le film existe
            check_query = "MATCH (m:Movie {id: $movie_id}) RETURN m"
            result = session.run(check_query, {"movie_id": movie_id})
            if not result.single():
                raise HTTPException(status_code=404, detail="Film non trouvé")
            
            # Supprimer le film et toutes ses relations
            delete_query = """
            MATCH (m:Movie {id: $movie_id})
            DETACH DELETE m
            """
            session.run(delete_query, {"movie_id": movie_id})
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression du film: {str(e)}")

@router.get("/search/", response_model=List[dict])
async def search_movies(
    q: str = Query(..., min_length=1, description="Terme de recherche"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Rechercher des films
    """
    try:
        db = get_db()
        
        with db.driver.session() as session:
            query = """
            MATCH (m:Movie)
            WHERE toLower(m.title) CONTAINS toLower($search)
               OR toLower(m.synopsis) CONTAINS toLower($search)
            OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
            WITH m, COLLECT(DISTINCT {id: g.id, name: g.name}) AS genres
            ORDER BY m.year DESC
            LIMIT $limit
            RETURN m, genres
            """
            
            result = session.run(query, {"search": q, "limit": limit})
            movies = []
            
            for record in result:
                movie_data = record['m']
                movie = {
                    "id": movie_data['id'],
                    "title": movie_data['title'],
                    "year": movie_data['year'],
                    "poster_url": movie_data.get('poster_url'),
                    "genres": convert_neo4j_datetime(record['genres'] or [])
                }
                movies.append(movie)
            
            return movies
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la recherche: {str(e)}")