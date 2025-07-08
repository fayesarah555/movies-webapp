# app/services/user_service.py
from typing import Optional
from uuid import uuid4
from datetime import datetime
from neo4j import Transaction

from app.models.schemas import UserCreate, UserResponse, UserRole
from app.database.connection import get_db

class UserService:
    def __init__(self):
        self.db = get_db()
    
    async def create_user(self, user_data: UserCreate, hashed_password: str) -> UserResponse:
        """Créer un nouvel utilisateur"""
        
        def create_user_tx(tx: Transaction):
            user_id = str(uuid4())
            query = """
            CREATE (u:User {
                id: $user_id,
                username: $username,
                email: $email,
                password_hash: $password_hash,
                role: $role,
                created_at: datetime()
            })
            RETURN u
            """
            
            result = tx.run(query, {
                "user_id": user_id,
                "username": user_data.username,
                "email": user_data.email,
                "password_hash": hashed_password,
                "role": user_data.role.value
            })
            
            user_node = result.single()
            if not user_node:
                raise ValueError("Erreur lors de la création de l'utilisateur")
            
            return user_node['u']
        
        with self.db.driver.session() as session:
            user_node = session.execute_write(create_user_tx)
            
            return UserResponse(
                id=user_node['id'],
                username=user_node['username'],
                email=user_node['email'],
                role=UserRole(user_node['role']),
                created_at=user_node['created_at']
            )
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Récupérer un utilisateur par ID"""
        
        def get_user_tx(tx: Transaction):
            query = "MATCH (u:User {id: $user_id}) RETURN u"
            result = tx.run(query, {"user_id": user_id})
            return result.single()
        
        with self.db.driver.session() as session:
            record = session.execute_read(get_user_tx)
            
            if not record:
                return None
            
            user_data = record['u']
            return UserResponse(
                id=user_data['id'],
                username=user_data['username'],
                email=user_data['email'],
                role=UserRole(user_data['role']),
                created_at=user_data['created_at']
            )
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Récupérer un utilisateur par email (avec password_hash pour auth)"""
        
        def get_user_tx(tx: Transaction):
            query = "MATCH (u:User {email: $email}) RETURN u"
            result = tx.run(query, {"email": email})
            return result.single()
        
        with self.db.driver.session() as session:
            record = session.execute_read(get_user_tx)
            
            if not record:
                return None
            
            user_data = record['u']
            return {
                "id": user_data['id'],
                "username": user_data['username'],
                "email": user_data['email'],
                "password_hash": user_data['password_hash'],
                "role": UserRole(user_data['role']),
                "created_at": user_data['created_at']
            }
    
    async def get_user_by_username(self, username: str) -> Optional[UserResponse]:
        """Récupérer un utilisateur par nom d'utilisateur"""
        
        def get_user_tx(tx: Transaction):
            query = "MATCH (u:User {username: $username}) RETURN u"
            result = tx.run(query, {"username": username})
            return result.single()
        
        with self.db.driver.session() as session:
            record = session.execute_read(get_user_tx)
            
            if not record:
                return None
            
            user_data = record['u']
            return UserResponse(
                id=user_data['id'],
                username=user_data['username'],
                email=user_data['email'],
                role=UserRole(user_data['role']),
                created_at=user_data['created_at']
            )