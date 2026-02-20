"""
Vercel Serverless API for Auth System
"""

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os

# Create FastAPI app
app = FastAPI(title="Auth System API", version="1.0.0")

# CORS - Allow all for Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check - works even without env vars
@app.get("/")
async def root():
    return {"status": "ok", "message": "Auth System API is running"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "secret_key_configured": bool(os.getenv("SECRET_KEY")),
        "master_admin_email": os.getenv("MASTER_ADMIN_EMAIL", "not set")
    }

# Only continue if essential imports work
try:
    from passlib.context import CryptContext
    from datetime import datetime, timedelta, UTC
    from jose import JWTError, jwt
    import httpx
    import pandas as pd
    import io
    
    # JWT setup - with defaults
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-me")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto", default="pbkdf2_sha256")
    security = HTTPBearer()
    
    # Try to configure Gemini - won't crash if not configured
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    model = None
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-pro')
        except Exception as e:
            print(f"Warning: Could not configure Gemini: {e}")
    
    # Initialize databases
    class UserDatabase:
        _instance = None
        users = {}
        
        def __new__(cls):
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialize()
            return cls._instance
        
        def _initialize(self):
            master_email = os.getenv("MASTER_ADMIN_EMAIL", "admin@example.com")
            master_password = os.getenv("MASTER_ADMIN_PASSWORD", "admin123")
            hashed_master_password = pwd_context.hash(master_password)
            self.users[master_email] = {
                'email': master_email,
                'full_name': 'Master Admin',
                'role': 'admin',
                'password': hashed_master_password,
                'created_at': datetime.now(UTC),
                'disabled': False
            }
    
    class FileDatabase:
        _instance = None
        files = {}
        
        def __new__(cls):
            if cls._instance is None:
                cls._instance = super().__new__(cls)
            return cls._instance
    
    class SetorDatabase:
        _instance = None
        setores = {}
        
        def __new__(cls):
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialize()
            return cls._instance
        
        def _initialize(self):
            self.setores = {}
            self.add_setor('1', {'id': '1', 'name': 'Setor Administrativo', 'code': 'ADM', 'departamento_id': '1'})
            self.add_setor('2', {'id': '2', 'name': 'Setor Financeiro', 'code': 'FIN', 'departamento_id': '1'})
            self.add_setor('3', {'id': '3', 'name': 'Setor Operacional', 'code': 'OPE', 'departamento_id': '2'})
    
    users_db = UserDatabase()
    files_db = FileDatabase()
    setores_db = SetorDatabase()
    
    # Models
    class UserCreate(BaseModel):
        email: EmailStr
        password: str
        full_name: str
        role: Optional[str] = 'user'
    
    class UserLogin(BaseModel):
        email: EmailStr
        password: str
    
    class Token(BaseModel):
        access_token: str
        token_type: str
    
    class User(BaseModel):
        email: EmailStr
        full_name: str
        role: str
        disabled: bool = False
    
    def get_password_hash(password):
        return pwd_context.hash(password)
    
    def verify_password(plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(UTC) + expires_delta
        else:
            expire = datetime.now(UTC) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    # Routes
    @app.post("/register", response_model=Token)
    async def register(user: UserCreate):
        if user.email in users_db.users:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_data = {
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
            'password': get_password_hash(user.password),
            'created_at': datetime.now(UTC),
            'disabled': False
        }
        users_db.users[user.email] = user_data
        
        access_token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": access_token, "token_type": "bearer"}
    
    @app.post("/login", response_model=Token)
    async def login(user: UserLogin):
        if user.email not in users_db.users:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        user_data = users_db.users[user.email]
        if not verify_password(user.password, user_data['password']):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        access_token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": access_token, "token_type": "bearer"}
    
    @app.get("/setores")
    async def get_setores():
        return {"setores": list(setores_db.setores.values())}

    # Debug endpoint
    @app.get("/debug")
    async def debug():
        return {
            "users": list(users_db.users.keys()),
            "env_vars": {
                "GEMINI_API_KEY": "set" if os.getenv("GEMINI_API_KEY") else "not set",
                "SECRET_KEY": "set" if os.getenv("SECRET_KEY") else "not set",
                "MASTER_ADMIN_EMAIL": os.getenv("MASTER_ADMIN_EMAIL", "not set")
            }
        }

except Exception as e:
    print(f"Error loading API: {e}")

# Vercel handler
def handler(request, context):
    """Vercel serverless handler"""
    return app
