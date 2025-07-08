# app/utils/helpers.py
from datetime import datetime
from typing import Any, Dict, List
import neo4j.time

def convert_neo4j_datetime(obj: Any) -> Any:
    """Convertir les objets Neo4j DateTime en datetime Python"""
    if isinstance(obj, neo4j.time.DateTime):
        return obj.to_native()
    elif isinstance(obj, dict):
        return {key: convert_neo4j_datetime(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_neo4j_datetime(item) for item in obj]
    else:
        return obj

def format_movie_response(movie_data: Dict, genres: List = None, actors: List = None, 
                         directors: List = None, platforms: List = None, 
                         avg_rating: float = None, rating_count: int = 0) -> Dict:
    """Formater une réponse de film pour l'API"""
    
    # Convertir les dates Neo4j
    converted_movie = convert_neo4j_datetime(movie_data)
    
    return {
        "id": converted_movie['id'],
        "title": converted_movie['title'],
        "year": converted_movie['year'],
        "duration": converted_movie.get('duration'),
        "synopsis": converted_movie.get('synopsis'),
        "poster_url": converted_movie.get('poster_url'),
        "trailer_url": converted_movie.get('trailer_url'),
        "created_at": converted_movie['created_at'],
        "updated_at": converted_movie['updated_at'],
        "genres": convert_neo4j_datetime(genres or []),
        "actors": convert_neo4j_datetime(actors or []),
        "directors": convert_neo4j_datetime(directors or []),
        "platforms": convert_neo4j_datetime(platforms or []),
        "average_rating": avg_rating,
        "rating_count": rating_count or 0
    }

def format_datetime(dt: Any) -> Any:
    """Convertir les dates pour l'API"""
    if isinstance(dt, neo4j.time.DateTime):
        return dt.to_native()
    return dt