# app/models/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict
from datetime import datetime, date
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    VISITOR = "visitor"

# === MOVIE MODELS ===
class MovieBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    year: int = Field(..., ge=1888, le=2030)  # Premier film: 1888
    duration: Optional[int] = Field(None, ge=1, le=1000)  # en minutes
    synopsis: Optional[str] = Field(None, max_length=2000)
    poster_url: Optional[str] = None
    trailer_url: Optional[str] = None

class MovieCreate(MovieBase):
    genre_ids: List[str] = []
    actor_ids: List[str] = []
    director_ids: List[str] = []
    platform_ids: List[str] = []

class MovieUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    year: Optional[int] = Field(None, ge=1888, le=2030)
    duration: Optional[int] = Field(None, ge=1, le=1000)
    synopsis: Optional[str] = Field(None, max_length=2000)
    poster_url: Optional[str] = None
    trailer_url: Optional[str] = None
    genre_ids: Optional[List[str]] = None
    actor_ids: Optional[List[str]] = None
    director_ids: Optional[List[str]] = None
    platform_ids: Optional[List[str]] = None

class MovieResponse(MovieBase):
    id: str
    created_at: datetime
    updated_at: datetime
    genres: List[Dict] = []
    actors: List[Dict] = []
    directors: List[Dict] = []
    platforms: List[Dict] = []
    average_rating: Optional[float] = None
    rating_count: int = 0

# === PERSON MODELS ===
class PersonBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    birthdate: Optional[date] = None
    nationality: Optional[str] = Field(None, max_length=50)
    biography: Optional[str] = Field(None, max_length=2000)
    photo_url: Optional[str] = None

class PersonCreate(PersonBase):
    pass

class PersonUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    birthdate: Optional[date] = None
    nationality: Optional[str] = Field(None, max_length=50)
    biography: Optional[str] = Field(None, max_length=2000)
    photo_url: Optional[str] = None

class PersonResponse(PersonBase):
    id: str
    movies_count: int = 0
    movies: List[Dict] = []

# === GENRE MODELS ===
class GenreBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)

class GenreCreate(GenreBase):
    pass

class GenreResponse(GenreBase):
    id: str
    movies_count: int = 0

# === USER MODELS ===
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    role: UserRole = UserRole.USER

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    id: str
    role: UserRole
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# === RATING MODELS ===
class RatingCreate(BaseModel):
    movie_id: str
    rating: float = Field(..., ge=0.0, le=10.0)
    comment: Optional[str] = Field(None, max_length=1000)

class RatingResponse(BaseModel):
    id: str
    user_id: str
    movie_id: str
    rating: float
    comment: Optional[str]
    created_at: datetime
    user: Dict
    movie: Dict

# === PLATFORM MODELS ===
class PlatformBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    logo_url: Optional[str] = None
    website_url: Optional[str] = None

class PlatformCreate(PlatformBase):
    pass

class PlatformResponse(PlatformBase):
    id: str
    movies_count: int = 0

# === SEARCH MODELS ===
class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=100)
    type: Optional[str] = Field("all", regex="^(all|movie|person|genre)$")

class SearchResponse(BaseModel):
    query: str
    results: Dict[str, List[Dict]]
    total_results: int

# === AUTH MODELS ===
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None