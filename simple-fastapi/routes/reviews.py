from fastapi import APIRouter, Depends, HTTPException, status, Body
from db.neo4j_conn import neo4j_conn
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from datetime import datetime
import os

router = APIRouter()

SECRET_KEY = os.getenv("API_TOKEN", "supersecret")
ALGORITHM = "HS256"
security = HTTPBearer()

class ReviewIn(BaseModel):
    movie_title: str
    rating: int
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    username: str
    movie_title: str
    rating: int
    comment: Optional[str] = None
    created_at: str

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_admin(username: str = Depends(verify_token)):
    with neo4j_conn.driver.session() as session:
        result = session.run("MATCH (u:User {username: $username}) RETURN u.role as role", username=username)
        record = result.single()
        if not record or record["role"] != "admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
        return username

@router.post("", response_model=ReviewOut, dependencies=[Depends(verify_token)])
def add_review(review: ReviewIn, username: str = Depends(verify_token)):
    with neo4j_conn.driver.session() as session:
        user_result = session.run("MATCH (u:User {username: $username}) RETURN u.role as role", username=username)
        user_record = user_result.single()
        if user_record and user_record["role"] == "admin":
            raise HTTPException(status_code=403, detail="Administrators cannot leave reviews")
    if not (1 <= review.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    created_at = datetime.utcnow().isoformat()
    with neo4j_conn.driver.session() as session:
        movie = session.run("MATCH (m:Movie {title: $title}) RETURN m", title=review.movie_title).single()
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        session.run("""
            MERGE (u:User {username: $username})
            WITH u
            MATCH (m:Movie {title: $movie_title})
            MERGE (u)-[r:RATED]->(m)
            SET r.rating = $rating, r.comment = $comment, r.created_at = $created_at
        """, username=username, movie_title=review.movie_title, rating=review.rating, comment=review.comment, created_at=created_at)
    return ReviewOut(username=username, movie_title=review.movie_title, rating=review.rating, comment=review.comment, created_at=created_at)

@router.get("/{movie_title}")
def get_reviews(movie_title: str):
    with neo4j_conn.driver.session() as session:
        result = session.run("""
            MATCH (u:User)-[r:RATED]->(m:Movie {title: $movie_title})
            RETURN u.username as username, r.rating as rating, r.comment as comment, r.created_at as created_at
            ORDER BY r.created_at DESC
        """, movie_title=movie_title)
        reviews = [dict(record) for record in result]
    return {"reviews": reviews, "count": len(reviews)}
