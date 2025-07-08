# app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from app.models.schemas import UserCreate, UserLogin, Token, UserResponse
from app.services.user_service import UserService
from app.auth.dependencies import (
    verify_password, create_access_token, get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES, get_current_active_user
)

router = APIRouter()
user_service = UserService()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Inscription d'un nouvel utilisateur"""
    
    # Vérifier si l'email existe déjà
    existing_user = await user_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Vérifier si le nom d'utilisateur existe déjà
    existing_username = await user_service.get_user_by_username(user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Créer l'utilisateur
    hashed_password = get_password_hash(user_data.password)
    user = await user_service.create_user(user_data, hashed_password)
    
    return user

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Connexion d'un utilisateur"""
    
    # Récupérer l'utilisateur par email
    user = await user_service.get_user_by_email(user_credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Vérifier le mot de passe
    if not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Créer le token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"]
        )
    )

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Connexion avec OAuth2 (pour compatibilité avec certains clients)"""
    
    user_credentials = UserLogin(email=form_data.username, password=form_data.password)
    return await login(user_credentials)

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_active_user)):
    """Récupérer les informations de l'utilisateur connecté"""
    return current_user