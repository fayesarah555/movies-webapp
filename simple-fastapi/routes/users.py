from fastapi import APIRouter, Depends, HTTPException, status, Body
from db.neo4j_conn import neo4j_conn
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from pydantic import BaseModel
import bcrypt
import os
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = os.getenv("API_TOKEN", "supersecret")
ALGORITHM = "HS256"
security = HTTPBearer()
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class UserRegister(BaseModel):
    username: str
    password: str
    role: Optional[str] = "user"

class UserOut(BaseModel):
    username: str
    role: str

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

@router.post("/register", response_model=UserOut)
def register(user: UserRegister = Body(...)):
    with neo4j_conn.driver.session() as session:
        existing = session.run("MATCH (u:User {username: $username}) RETURN u", username=user.username)
        if existing.single():
            raise HTTPException(status_code=400, detail="Username already exists")
        hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
        role = user.role if user.role in ["admin", "user"] else "user"
        session.run("CREATE (u:User {username: $username, password: $password, role: $role})", username=user.username, password=hashed, role=role)
    return {"username": user.username, "role": role}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with neo4j_conn.driver.session() as session:
        result = session.run("MATCH (u:User {username: $username}) RETURN u.password as password, u.role as role", username=form_data.username)
        record = result.single()
        if not record:
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        hashed = record["password"]
        user_role = record["role"] or "user"
        if not bcrypt.checkpw(form_data.password.encode(), hashed.encode()):
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode = {"sub": form_data.username, "exp": expire}
        token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": token, "token_type": "bearer", "username": form_data.username, "role": user_role}
