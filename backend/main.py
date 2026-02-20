from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
import json
from passlib.context import CryptContext
import httpx
import base64
import google.generativeai as genai
import pandas as pd
import io

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not set. Chat functionality will be disabled.")
    GEMINI_API_KEY = None

from datetime import datetime, timedelta, UTC
from jose import JWTError, jwt

# Firebase setup - commented out for demo
# cred = credentials.Certificate("path/to/firebase/credentials.json")  # Replace with actual path
# firebase_admin.initialize_app(cred)
# db = firestore.client()

# JWT setup
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Gemini setup
model = genai.GenerativeModel('gemini-pro')

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto", default="pbkdf2_sha256")
security = HTTPBearer()

class UserDatabase:
    def __init__(self):
        self.users = {}
        # Pre-populate with master admin user from environment variables
        master_email = os.getenv("MASTER_ADMIN_EMAIL", "admin@example.com")
        master_password = os.getenv("MASTER_ADMIN_PASSWORD", "admin123")  # Default for development
        hashed_master_password = pwd_context.hash(master_password)
        self.users[master_email] = {
            'email': master_email,
            'full_name': 'Master Admin',
            'role': 'admin',
            'password': hashed_master_password,
            'created_at': datetime.now(UTC),
            'disabled': False
        }

    def add_user(self, email, user_data):
        self.users[email] = user_data

    def get_user(self, email):
        return self.users.get(email)

    def user_exists(self, email):
        return email in self.users

users_db = UserDatabase()

class FileDatabase:
    def __init__(self):
        self.files = {}

    def add_file(self, name, file_data):
        self.files[name] = file_data

    def get_file(self, name):
        return self.files.get(name)

    def file_exists(self, name):
        return name in self.files

    def get_all_files(self):
        return list(self.files.values())

files_db = FileDatabase()

class ExcelDataDatabase:
    def __init__(self):
        self.fato_orcamento = []
        self.fato_realizado = []
        self.d_calendario = []
        self.d_estrutura = []
        self.d_conta = []
        self.d_fornecedor = []

    def save_data(self, data):
        self.fato_orcamento = [item.dict() for item in data.fatoOrcamento]
        self.fato_realizado = [item.dict() for item in data.fatoRealizado]
        self.d_calendario = [item.dict() for item in data.dCalendario]
        self.d_estrutura = [item.dict() for item in data.dEstrutura]
        self.d_conta = [item.dict() for item in data.dConta]
        self.d_fornecedor = [item.dict() for item in data.dFornecedor]

    def get_fato_orcamento(self):
        return self.fato_orcamento

    def get_fato_realizado(self):
        return self.fato_realizado

    def get_d_calendario(self):
        return self.d_calendario

    def get_d_estrutura(self):
        return self.d_estrutura

    def get_d_conta(self):
        return self.d_conta

    def get_d_fornecedor(self):
        return self.d_fornecedor

excel_data_db = ExcelDataDatabase()

class SetorDatabase:
    def __init__(self):
        self.setores = {}

    def add_setor(self, setor_id, setor_data):
        self.setores[setor_id] = setor_data

    def get_setor(self, setor_id):
        return self.setores.get(setor_id)

    def setor_exists(self, setor_id):
        return setor_id in self.setores

    def get_all_setores(self):
        return list(self.setores.values())

    def delete_setor(self, setor_id):
        return self.setores.pop(setor_id, None)

class DepartamentoDatabase:
    def __init__(self):
        self.departamentos = {}

    def add_departamento(self, dep_id, dep_data):
        self.departamentos[dep_id] = dep_data

    def get_departamento(self, dep_id):
        return self.departamentos.get(dep_id)

    def departamento_exists(self, dep_id):
        return dep_id in self.departamentos

    def get_all_departamentos(self):
        return list(self.departamentos.values())

    def delete_departamento(self, dep_id):
        return self.departamentos.pop(dep_id, None)

class FilialDatabase:
    def __init__(self):
        self.filiais = {}

    def add_filial(self, filial_id, filial_data):
        self.filiais[filial_id] = filial_data

    def get_filial(self, filial_id):
        return self.filiais.get(filial_id)

    def filial_exists(self, filial_id):
        return filial_id in self.filiais

    def get_all_filiais(self):
        return list(self.filiais.values())

    def delete_filial(self, filial_id):
        return self.filiais.pop(filial_id, None)

setores_db = SetorDatabase()
departamentos_db = DepartamentoDatabase()
filiais_db = FilialDatabase()

# Add sample data for testing with hierarchical relationships
filiais_db.add_filial('1', {'id': '1', 'name': 'Filial São Paulo', 'code': 'SP'})
filiais_db.add_filial('2', {'id': '2', 'name': 'Filial Rio de Janeiro', 'code': 'RJ'})
filiais_db.add_filial('3', {'id': '3', 'name': 'Filial Belo Horizonte', 'code': 'BH'})

departamentos_db.add_departamento('1', {'id': '1', 'name': 'Departamento de RH', 'code': 'RH', 'filial_id': '1'})
departamentos_db.add_departamento('2', {'id': '2', 'name': 'Departamento de TI', 'code': 'TI', 'filial_id': '1'})
departamentos_db.add_departamento('3', {'id': '3', 'name': 'Departamento de Vendas', 'code': 'VEN', 'filial_id': '2'})
departamentos_db.add_departamento('4', {'id': '4', 'name': 'Departamento de Marketing', 'code': 'MKT', 'filial_id': '2'})

setores_db.add_setor('1', {'id': '1', 'name': 'Setor Administrativo', 'code': 'ADM', 'departamento_id': '1'})
setores_db.add_setor('2', {'id': '2', 'name': 'Setor Financeiro', 'code': 'FIN', 'departamento_id': '1'})
setores_db.add_setor('3', {'id': '3', 'name': 'Setor Operacional', 'code': 'OPE', 'departamento_id': '2'})
setores_db.add_setor('4', {'id': '4', 'name': 'Setor Desenvolvimento', 'code': 'DEV', 'departamento_id': '2'})
setores_db.add_setor('5', {'id': '5', 'name': 'Setor Vendas Internas', 'code': 'VINT', 'departamento_id': '3'})
setores_db.add_setor('6', {'id': '6', 'name': 'Setor Vendas Externas', 'code': 'VEXT', 'departamento_id': '3'})

app = FastAPI(title="Auth System API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # No cookies used, so disable credentials
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = 'user'
    matricula: Optional[str] = None
    setor_id: Optional[str] = None
    departamento_id: Optional[str] = None
    filial_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class Setor(BaseModel):
    id: str
    name: str
    code: str
    departamento_id: str

class Departamento(BaseModel):
    id: str
    name: str
    code: str
    filial_id: str

class Filial(BaseModel):
    id: str
    name: str
    code: str

class UserSettings(BaseModel):
    theme: str
    colors: dict
    notifications: dict
    language: str
    timezone: str
    privacy: dict
    dashboard: dict
    logo: Optional[str] = None

class User(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    disabled: bool = False
    matricula: Optional[str] = None
    setor_id: Optional[str] = None
    departamento_id: Optional[str] = None
    filial_id: Optional[str] = None
    settings: Optional[UserSettings] = None

class UserUpdate(BaseModel):
    full_name: str
    role: str
    disabled: bool
    matricula: Optional[str] = None
    setor_id: Optional[str] = None
    departamento_id: Optional[str] = None
    filial_id: Optional[str] = None

class ChangePassword(BaseModel):
    new_password: str

class FileUpload(BaseModel):
    name: str
    data: str  # base64 encoded
    file_type: str  # 'csv' or 'xlsx'

class ChatMessage(BaseModel):
    message: str

# Star Schema Models
class FatoOrcamento(BaseModel):
    id: str
    ano: int
    mes: int
    data: str
    codigoMicroMercado: str
    codigoConta: str
    vlrOrcado: float

class FatoRealizado(BaseModel):
    id: str
    ano: int
    mes: int
    data: str
    codigoMicroMercado: str
    codigoConta: str
    razaoSocial: str
    valorCustoTotal: float
    historicoCusto: str

class DCalendario(BaseModel):
    data: str
    ano: int
    mes: int
    nomeMes: str
    trimestre: int

class DEstrutura(BaseModel):
    codigoMicroMercado: str
    nomeMicroMercado: str
    nucleo: str
    microNucleo: str
    filial: str
    mercado: str

class DConta(BaseModel):
    codigoConta: str
    pacote: str
    subpacote: str
    contaGerencial: str
    contaContabil: str

class DFornecedor(BaseModel):
    razaoSocial: str
    tipoFornecedor: str

class ExcelDataUpload(BaseModel):
    fatoOrcamento: List[FatoOrcamento]
    fatoRealizado: List[FatoRealizado]
    dCalendario: List[DCalendario]
    dEstrutura: List[DEstrutura]
    dConta: List[DConta]
    dFornecedor: List[DFornecedor]

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def safe_int(value):
    try:
        if pd.isna(value):
            return 0
        return int(float(value))
    except (ValueError, TypeError):
        return 0

def safe_float(value):
    try:
        if pd.isna(value):
            return 0.0
        if isinstance(value, str):
            # Handle Brazilian number format: remove dots and replace comma with dot
            value = value.replace('.', '').replace(',', '.')
        return float(value)
    except (ValueError, TypeError):
        return 0.0

def safe_str(value):
    if pd.isna(value):
        return ''
    return str(value)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    # Fetch user from in-memory database
    if not users_db.user_exists(email):
        raise credentials_exception

    user_data = users_db.get_user(email)
    return User(
        email=user_data['email'],
        full_name=user_data['full_name'],
        role=user_data['role'],
        disabled=user_data['disabled'],
        matricula=user_data.get('matricula'),
        setor_id=user_data.get('setor_id'),
        departamento_id=user_data.get('departamento_id'),
        filial_id=user_data.get('filial_id')
    )

# Routes
@app.post("/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user exists in in-memory database
    if users_db.user_exists(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user in in-memory database
    hashed_password = get_password_hash(user.password)
    user_data = {
        'email': user.email,
        'full_name': user.full_name,
        'role': 'user',
        'password': hashed_password,
        'created_at': datetime.now(UTC),
        'disabled': False,
        'matricula': user.matricula,
        'setor_id': user.setor_id,
        'departamento_id': user.departamento_id,
        'filial_id': user.filial_id
    }
    users_db.add_user(user.email, user_data)

    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    # Verify user in in-memory database
    user_exists = users_db.user_exists(user.email)
    if not user_exists:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    user_data = users_db.get_user(user.email)
    password_valid = verify_password(user.password, user_data['password'])
    if not password_valid:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/forgot-password")
async def forgot_password(user: ForgotPassword):
    # Check if user exists in in-memory database
    if not users_db.user_exists(user.email):
        raise HTTPException(status_code=400, detail="Email not found")

    # In a real application, you would send an email with a reset link
    # For demo purposes, we'll just return a success message
    return {"message": "Password reset email sent"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=User)
async def update_user(user_update: UserCreate, current_user: User = Depends(get_current_user)):
    # Update user in in-memory database
    if not users_db.user_exists(current_user.email):
        raise HTTPException(status_code=404, detail="User not found")

    user_data = users_db.get_user(current_user.email)
    user_data['email'] = user_update.email
    user_data['full_name'] = user_update.full_name
    # Role is not updated via this endpoint
    users_db.add_user(user_update.email, user_data)

    # If email changed, remove old entry
    if user_update.email != current_user.email:
        users_db.users.pop(current_user.email, None)

    return User(
        email=user_data['email'],
        full_name=user_data['full_name'],
        role=user_data['role'],
        disabled=user_data['disabled']
    )

@app.get("/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    # Only admin can view all users
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    users = []
    for email, user_data in users_db.users.items():
        users.append({
            "email": user_data['email'],
            "full_name": user_data['full_name'],
            "role": user_data['role'],
            "disabled": user_data['disabled'],
            "matricula": user_data.get('matricula'),
            "setor_id": user_data.get('setor_id'),
            "departamento_id": user_data.get('departamento_id'),
            "filial_id": user_data.get('filial_id')
        })
    return {"users": users}

@app.put("/users/{email}")
async def update_user_admin(email: str, user_update: UserUpdate, current_user: User = Depends(get_current_user)):
    # Only admin can update users
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if not users_db.user_exists(email):
        raise HTTPException(status_code=404, detail="User not found")

    user_data = users_db.get_user(email)
    user_data['full_name'] = user_update.full_name
    user_data['role'] = user_update.role
    user_data['disabled'] = user_update.disabled
    user_data['setor_id'] = user_update.setor_id
    user_data['departamento_id'] = user_update.departamento_id
    user_data['filial_id'] = user_update.filial_id
    users_db.add_user(email, user_data)

    return {"message": "User updated successfully"}

@app.put("/users/{email}/password")
async def change_user_password(email: str, password_data: ChangePassword, current_user: User = Depends(get_current_user)):
    # Only admin can change passwords
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if not users_db.user_exists(email):
        raise HTTPException(status_code=404, detail="User not found")

    user_data = users_db.get_user(email)
    user_data['password'] = get_password_hash(password_data.new_password)
    users_db.add_user(email, user_data)

    return {"message": "Password changed successfully"}

@app.delete("/users/{email}")
async def delete_user(email: str, current_user: User = Depends(get_current_user)):
    # Only admin can delete users
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if not users_db.user_exists(email):
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deleting the master admin
    master_email = os.getenv("MASTER_ADMIN_EMAIL", "admin@example.com")
    if email == master_email:
        raise HTTPException(status_code=400, detail="Cannot delete master admin")

    del users_db.users[email]
    return {"message": "User deleted successfully"}

@app.get("/permissions")
async def get_permissions(current_user: User = Depends(get_current_user)):
    # Return permissions based on role
    permissions = {
        "user": ["read"],
        "admin": ["read", "write", "delete"]
    }
    return {"permissions": permissions.get(current_user.role, [])}

# Setor CRUD endpoints
@app.get("/setores")
async def get_setores():
    return {"setores": setores_db.get_all_setores()}

@app.post("/setores")
async def create_setor(setor: Setor, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if setores_db.setor_exists(setor.id):
        raise HTTPException(status_code=400, detail="Setor already exists")
    # Validate that departamento_id exists
    if not departamentos_db.departamento_exists(setor.departamento_id):
        raise HTTPException(status_code=400, detail="Departamento not found")
    setores_db.add_setor(setor.id, setor.dict())
    return {"message": "Setor created successfully"}

@app.put("/setores/{setor_id}")
async def update_setor(setor_id: str, setor: Setor, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if not setores_db.setor_exists(setor_id):
        raise HTTPException(status_code=404, detail="Setor not found")
    setores_db.add_setor(setor_id, setor.dict())
    return {"message": "Setor updated successfully"}

@app.delete("/setores/{setor_id}")
async def delete_setor(setor_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if not setores_db.setor_exists(setor_id):
        raise HTTPException(status_code=404, detail="Setor not found")
    setores_db.delete_setor(setor_id)
    return {"message": "Setor deleted successfully"}

# Departamento CRUD endpoints
@app.get("/departamentos")
async def get_departamentos():
    return {"departamentos": departamentos_db.get_all_departamentos()}

@app.post("/departamentos")
async def create_departamento(departamento: Departamento, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if departamentos_db.departamento_exists(departamento.id):
        raise HTTPException(status_code=400, detail="Departamento already exists")
    # Validate that filial_id exists
    if not filiais_db.filial_exists(departamento.filial_id):
        raise HTTPException(status_code=400, detail="Filial not found")
    departamentos_db.add_departamento(departamento.id, departamento.dict())
    return {"message": "Departamento created successfully"}

@app.put("/departamentos/{dep_id}")
async def update_departamento(dep_id: str, departamento: Departamento, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if not departamentos_db.departamento_exists(dep_id):
        raise HTTPException(status_code=404, detail="Departamento not found")
    departamentos_db.add_departamento(dep_id, departamento.dict())
    return {"message": "Departamento updated successfully"}

@app.delete("/departamentos/{dep_id}")
async def delete_departamento(dep_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if not departamentos_db.departamento_exists(dep_id):
        raise HTTPException(status_code=404, detail="Departamento not found")
    departamentos_db.delete_departamento(dep_id)
    return {"message": "Departamento deleted successfully"}

# Filial CRUD endpoints
@app.get("/filiais")
async def get_filiais():
    return {"filiais": filiais_db.get_all_filiais()}

@app.post("/filiais")
async def create_filial(filial: Filial, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if filiais_db.filial_exists(filial.id):
        raise HTTPException(status_code=400, detail="Filial already exists")
    filiais_db.add_filial(filial.id, filial.dict())
    return {"message": "Filial created successfully"}

@app.put("/filiais/{filial_id}")
async def update_filial(filial_id: str, filial: Filial, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if not filiais_db.filial_exists(filial_id):
        raise HTTPException(status_code=404, detail="Filial not found")
    filiais_db.add_filial(filial_id, filial.dict())
    return {"message": "Filial updated successfully"}

@app.delete("/filiais/{filial_id}")
async def delete_filial(filial_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if not filiais_db.filial_exists(filial_id):
        raise HTTPException(status_code=404, detail="Filial not found")
    filiais_db.delete_filial(filial_id)
    return {"message": "Filial deleted successfully"}

@app.get("/location")
async def get_location():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try ipapi.co first
            try:
                response = await client.get("https://ipapi.co/json/")
                response.raise_for_status()
                data = response.json()
                return {
                    "city": data.get("city"),
                    "region": data.get("region"),
                    "latitude": data.get("latitude"),
                    "longitude": data.get("longitude")
                }
            except Exception as inner_e:
                # Fallback to ip-api.com if ipapi.co fails
                try:
                    response = await client.get("http://ip-api.com/json/")
                    response.raise_for_status()
                    data = response.json()
                    return {
                        "city": data.get("city"),
                        "region": data.get("regionName"),
                        "latitude": data.get("lat"),
                        "longitude": data.get("lon")
                    }
                except Exception as fallback_e:
                    # If both services fail, return default location (São Paulo, Brazil)
                    print(f"Warning: Both location APIs failed. Using default location. Errors: {inner_e}, {fallback_e}")
                    return {
                        "city": "São Paulo",
                        "region": "SP",
                        "latitude": -23.5505,
                        "longitude": -46.6333
                    }
    except Exception as e:
        print(f"Error in get_location: {str(e)}")
        # Return default location instead of raising error
        return {
            "city": "São Paulo",
            "region": "SP",
            "latitude": -23.5505,
            "longitude": -46.6333
        }

@app.get("/weather")
async def get_weather(latitude: float, longitude: float):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current_weather=true")
            response.raise_for_status()
            data = response.json()
            return {
                "temperature": data.get("current_weather", {}).get("temperature")
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")

@app.post("/files")
async def upload_file(file: FileUpload, current_user: User = Depends(get_current_user)):
    if files_db.file_exists(file.name):
        raise HTTPException(status_code=400, detail="File already exists")

    file_data = {
        'name': file.name,
        'data': file.data,
        'file_type': file.file_type,
        'uploaded_by': current_user.email,
        'uploaded_at': datetime.now(UTC)
    }
    files_db.add_file(file.name, file_data)
    return {"message": "File uploaded successfully"}

@app.get("/files")
async def get_files(current_user: User = Depends(get_current_user)):
    files = files_db.get_all_files()
    return {"files": files}

@app.get("/files/{name}")
async def get_file(name: str, current_user: User = Depends(get_current_user)):
    file_data = files_db.get_file(name)
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    return file_data

@app.post("/upload-excel-data")
async def upload_excel_data(data: ExcelDataUpload, current_user: User = Depends(get_current_user)):
    try:
        excel_data_db.save_data(data)
        return {"message": "Excel data uploaded and saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save Excel data: {str(e)}")

@app.post("/upload-raw-excel")
async def upload_raw_excel(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        # Read the uploaded Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents), sheet_name=0, header=None)
        df = df.astype(str)

        # Set headers from row 1 (index 1), skip first two rows
        df.columns = df.iloc[1]
        df = df[2:].reset_index(drop=True)

        # Drop the first column (NaN)
        df = df.iloc[:, 1:]

        # Convert to list of dicts for easier processing
        records = df.to_dict('records')

        # Filter out invalid rows where 'Ano' is not numeric
        records = [r for r in records if safe_int(r.get('Ano', 0)) > 0]

        fato_orcamento_data = []
        fato_realizado_data = []

        for index, record in enumerate(records):
            try:
                # Extract values with safe parsing
                ano = safe_int(record.get('Ano', 0))
                mes = safe_int(record.get('Mês', 0))

                mercado = str(record.get('Mercado', '')) if pd.notna(record.get('Mercado', '')) else ''
                nucleo = str(record.get('Núcleo', '')) if pd.notna(record.get('Núcleo', '')) else ''
                microNucleo = str(record.get('Micro Núcleo', '')) if pd.notna(record.get('Micro Núcleo', '')) else ''
                departamento = str(record.get('Departamento', '')) if pd.notna(record.get('Departamento', '')) else ''
                filial = str(record.get('Filial', '')) if pd.notna(record.get('Filial', '')) else ''
                codigoMicroMercado = str(record.get('Código Micro Mercado ou UC', '')) if pd.notna(record.get('Código Micro Mercado ou UC', '')) else ''
                microMercadoUC = str(record.get('Micro Mercado ou UC', '')) if pd.notna(record.get('Micro Mercado ou UC', '')) else ''
                custosFPO = safe_float(record.get('Custos FPO (novo)', 0))
                custosFPMSVO = safe_float(record.get('Custos FPMSVO', 0))
                custosFPMSVOExecutivo = safe_float(record.get('Custos FPMSVO Executivo', 0))
                codigoContaGerencial = str(record.get('Código Conta Gerencial', '')) if pd.notna(record.get('Código Conta Gerencial', '')) else ''
                contaGerencial = str(record.get('Conta Gerencial', '')) if pd.notna(record.get('Conta Gerencial', '')) else ''
                codigoContaContabil = str(record.get('Código da Conta Contábil', '')) if pd.notna(record.get('Código da Conta Contábil', '')) else ''
                contaContabil = str(record.get('Conta Contabil', '')) if pd.notna(record.get('Conta Contabil', '')) else ''
                va = safe_float(record.get('VA', 0))
                vlrOrcado = safe_float(record.get('Vlr Orçado', 0))
                valorDRE = safe_float(record.get('Valor DRE', 0))
                pacote = str(record.get('Pacote', '')) if pd.notna(record.get('Pacote', '')) else ''
                subpacote = str(record.get('Subpacote', '')) if pd.notna(record.get('Subpacote', '')) else ''

                if ano > 0 and mes > 0:
                    data_str = f"{ano}-{mes:02d}-01"

                    # Process orçamento data (Vlr Orçado)
                    if vlrOrcado != 0:
                        fato_orcamento_data.append(FatoOrcamento(
                            id=f"orc_{index}",
                            ano=ano,
                            mes=mes,
                            data=data_str,
                            codigoMicroMercado=codigoMicroMercado,
                            codigoConta=codigoContaContabil,
                            vlrOrcado=vlrOrcado
                        ))

                    # Process realizado data (Valor DRE)
                    if valorDRE != 0:
                        fato_realizado_data.append(FatoRealizado(
                            id=f"real_{index}",
                            ano=ano,
                            mes=mes,
                            data=data_str,
                            codigoMicroMercado=codigoMicroMercado,
                            codigoConta=codigoContaContabil,
                            razaoSocial=contaGerencial or 'Fornecedor',
                            valorCustoTotal=valorDRE,
                            historicoCusto=f"{departamento} - {pacote} - {subpacote}"
                        ))
            except Exception as e:
                # Skip invalid records
                continue

        # Create dimension tables
        calendario_map = {}
        estrutura_map = {}
        conta_map = {}
        fornecedor_map = {}

        all_facts = fato_orcamento_data + fato_realizado_data

        for fact in all_facts:
            # DCalendario
            if fact.data not in calendario_map:
                date_obj = datetime.strptime(fact.data, "%Y-%m-%d")
                nome_mes = date_obj.strftime("%B")
                trimestre = ((fact.mes - 1) // 3) + 1
                calendario_map[fact.data] = DCalendario(
                    data=fact.data,
                    ano=fact.ano,
                    mes=fact.mes,
                    nomeMes=nome_mes,
                    trimestre=trimestre
                )

            # DEstrutura
            if fact.codigoMicroMercado and fact.codigoMicroMercado not in estrutura_map:
                estrutura_map[fact.codigoMicroMercado] = DEstrutura(
                    codigoMicroMercado=fact.codigoMicroMercado,
                    nomeMicroMercado=fact.codigoMicroMercado,
                    nucleo='',
                    microNucleo='',
                    filial='',
                    mercado=''
                )

            # DConta
            if fact.codigoConta and fact.codigoConta not in conta_map:
                conta_map[fact.codigoConta] = DConta(
                    codigoConta=fact.codigoConta,
                    pacote='',
                    subpacote='',
                    contaGerencial='',
                    contaContabil=fact.codigoConta
                )

        # DFornecedor from FatoRealizado
        for fact in fato_realizado_data:
            if fact.razaoSocial and fact.razaoSocial not in fornecedor_map:
                fornecedor_map[fact.razaoSocial] = DFornecedor(
                    razaoSocial=fact.razaoSocial,
                    tipoFornecedor='Fornecedor'
                )

        # Create ExcelDataUpload object and save
        excel_data = ExcelDataUpload(
            fatoOrcamento=fato_orcamento_data,
            fatoRealizado=fato_realizado_data,
            dCalendario=list(calendario_map.values()),
            dEstrutura=list(estrutura_map.values()),
            dConta=list(conta_map.values()),
            dFornecedor=list(fornecedor_map.values())
        )

        excel_data_db.save_data(excel_data)

        return {"message": f"Raw Excel processed and saved successfully. Processed {len(fato_orcamento_data)} orçamento and {len(fato_realizado_data)} realizado records."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process raw Excel: {str(e)}")

@app.get("/get-fato-orcamento")
async def get_fato_orcamento(current_user: User = Depends(get_current_user)):
    return {"data": excel_data_db.get_fato_orcamento()}

@app.get("/get-fato-realizado")
async def get_fato_realizado(current_user: User = Depends(get_current_user)):
    return {"data": excel_data_db.get_fato_realizado()}

@app.get("/get-d-calendario")
async def get_d_calendario(current_user: User = Depends(get_current_user)):
    return {"data": excel_data_db.get_d_calendario()}

@app.get("/get-d-estrutura")
async def get_d_estrutura(current_user: User = Depends(get_current_user)):
    return {"data": excel_data_db.get_d_estrutura()}

@app.get("/get-d-conta")
async def get_d_conta(current_user: User = Depends(get_current_user)):
    return {"data": excel_data_db.get_d_conta()}

@app.get("/get-d-fornecedor")
async def get_d_fornecedor(current_user: User = Depends(get_current_user)):
    return {"data": excel_data_db.get_d_fornecedor()}

@app.get("/metrics")
async def get_metrics(
    # Time filters
    period: str = "monthly",  # "daily", "monthly", "annual", "custom"
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    # Dimension filters
    suppliers: Optional[str] = None,  # comma-separated
    accounts: Optional[str] = None,   # comma-separated
    markets: Optional[str] = None,    # comma-separated
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para métricas BI com filtros dinâmicos.
    Retorna dados agregados para gráficos e KPIs.
    """
    try:
        import pandas as pd
        from typing import List, Dict, Any

        # Get raw data
        fato_orcamento = excel_data_db.get_fato_orcamento()
        fato_realizado = excel_data_db.get_fato_realizado()
        d_calendario = excel_data_db.get_d_calendario()
        d_estrutura = excel_data_db.get_d_estrutura()
        d_conta = excel_data_db.get_d_conta()
        d_fornecedor = excel_data_db.get_d_fornecedor()

        if not fato_orcamento or not fato_realizado:
            return {"error": "Dados não carregados. Faça upload do Excel primeiro."}

        # Convert to DataFrames
        df_orcamento = pd.DataFrame(fato_orcamento)
        df_realizado = pd.DataFrame(fato_realizado)
        df_calendario = pd.DataFrame(d_calendario)
        df_estrutura = pd.DataFrame(d_estrutura)
        df_conta = pd.DataFrame(d_conta)
        df_fornecedor = pd.DataFrame(d_fornecedor)

        # Apply filters
        # Time filters
        if period == "custom" and start_date and end_date:
            # Filter by custom date range
            df_orcamento = df_orcamento[
                (df_orcamento['data'] >= start_date) & (df_orcamento['data'] <= end_date)
            ]
            df_realizado = df_realizado[
                (df_realizado['data'] >= start_date) & (df_realizado['data'] <= end_date)
            ]
        elif period == "annual":
            # Group by year
            pass  # Will handle in aggregation
        elif period == "monthly":
            # Group by year-month
            pass  # Will handle in aggregation
        elif period == "daily":
            # Group by date
            pass  # Will handle in aggregation

        # Dimension filters
        if suppliers:
            supplier_list = [s.strip() for s in suppliers.split(',')]
            df_realizado = df_realizado[df_realizado['razaoSocial'].isin(supplier_list)]

        if accounts:
            account_list = [a.strip() for a in accounts.split(',')]
            df_orcamento = df_orcamento[df_orcamento['codigoConta'].isin(account_list)]
            df_realizado = df_realizado[df_realizado['codigoConta'].isin(account_list)]

        if markets:
            market_list = [m.strip() for m in markets.split(',')]
            df_orcamento = df_orcamento[df_orcamento['codigoMicroMercado'].isin(market_list)]
            df_realizado = df_realizado[df_realizado['codigoMicroMercado'].isin(market_list)]

        # Aggregate data based on period
        if period == "annual":
            # Annual aggregation
            temporal_orcado = df_orcamento.groupby('ano')['vlrOrcado'].sum().reset_index()
            temporal_realizado = df_realizado.groupby('ano')['valorCustoTotal'].sum().reset_index()

            temporal_data = pd.merge(
                temporal_orcado, temporal_realizado,
                on='ano', how='outer'
            ).fillna(0)
            temporal_data['period'] = temporal_data['ano'].astype(str)

        elif period == "monthly":
            # Monthly aggregation
            df_orcamento['period'] = df_orcamento['ano'].astype(str) + '-' + df_orcamento['mes'].astype(str).str.zfill(2)
            df_realizado['period'] = df_realizado['ano'].astype(str) + '-' + df_realizado['mes'].astype(str).str.zfill(2)

            temporal_orcado = df_orcamento.groupby('period')['vlrOrcado'].sum().reset_index()
            temporal_realizado = df_realizado.groupby('period')['valorCustoTotal'].sum().reset_index()

            temporal_data = pd.merge(
                temporal_orcado, temporal_realizado,
                on='period', how='outer'
            ).fillna(0)

        elif period == "daily":
            # Daily aggregation
            temporal_orcado = df_orcamento.groupby('data')['vlrOrcado'].sum().reset_index()
            temporal_realizado = df_realizado.groupby('data')['valorCustoTotal'].sum().reset_index()

            temporal_data = pd.merge(
                temporal_orcado, temporal_realizado,
                on='data', how='outer'
            ).fillna(0)
            temporal_data['period'] = temporal_data['data']

        else:  # custom or default
            temporal_data = pd.DataFrame()

        # Sort temporal data
        if not temporal_data.empty:
            if 'period' in temporal_data.columns:
                temporal_data = temporal_data.sort_values('period')
            temporal_data = temporal_data.rename(columns={
                'vlrOrcado': 'orcado',
                'valorCustoTotal': 'realizado'
            })

        # Top suppliers
        top_suppliers = df_realizado.groupby('razaoSocial')['valorCustoTotal'].sum().reset_index()
        top_suppliers = top_suppliers.sort_values('valorCustoTotal', ascending=False).head(10)
        top_suppliers = top_suppliers.rename(columns={'valorCustoTotal': 'valor'})

        # DRE data (by account)
        dre_orcado = df_orcamento.groupby('codigoConta')['vlrOrcado'].sum().reset_index()
        dre_realizado = df_realizado.groupby('codigoConta')['valorCustoTotal'].sum().reset_index()

        dre_data = pd.merge(
            dre_orcado, dre_realizado,
            on='codigoConta', how='outer'
        ).fillna(0)

        dre_data['variacao'] = dre_data.apply(
            lambda row: ((row['valorCustoTotal'] - row['vlrOrcado']) / row['vlrOrcado'] * 100) if row['vlrOrcado'] > 0 else 0,
            axis=1
        )

        dre_data = dre_data.rename(columns={
            'codigoConta': 'conta',
            'vlrOrcado': 'orcado',
            'valorCustoTotal': 'realizado'
        })

        # KPIs
        total_orcado = df_orcamento['vlrOrcado'].sum()
        total_realizado = df_realizado['valorCustoTotal'].sum()
        adherence = (total_realizado / total_orcado * 100) if total_orcado > 0 else 0

        # Available filter options (for cascading)
        available_suppliers = sorted(df_realizado['razaoSocial'].dropna().unique().tolist())
        available_accounts = sorted(df_orcamento['codigoConta'].dropna().unique().tolist())
        available_markets = sorted(df_orcamento['codigoMicroMercado'].dropna().unique().tolist())

        # Available periods based on data
        if period == "annual":
            available_periods = sorted(df_orcamento['ano'].dropna().unique().astype(str).tolist())
        elif period == "monthly":
            periods = (df_orcamento['ano'].astype(str) + '-' + df_orcamento['mes'].astype(str).str.zfill(2)).dropna().unique().tolist()
            available_periods = sorted(periods)
        else:
            available_periods = sorted(df_orcamento['data'].dropna().unique().tolist())

        return {
            "temporal_data": temporal_data.to_dict('records') if not temporal_data.empty else [],
            "top_suppliers": top_suppliers.to_dict('records'),
            "dre_data": dre_data.to_dict('records'),
            "kpis": {
                "total_orcado": total_orcado,
                "total_realizado": total_realizado,
                "adherence": adherence,
                "total_suppliers": len(available_suppliers),
                "total_accounts": len(available_accounts),
                "total_markets": len(available_markets)
            },
            "available_filters": {
                "suppliers": available_suppliers,
                "accounts": available_accounts,
                "markets": available_markets,
                "periods": available_periods
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar métricas: {str(e)}")

@app.post("/chat")
async def chat_with_ai(chat_message: ChatMessage, current_user: User = Depends(get_current_user)):
    try:
        # Create context with data summary for Gemini
        context = f"""
        Você é um assistente de análise de dados para um sistema de gestão financeira.
        O usuário tem acesso aos seguintes dados:

        - Total Orçado: Dados de orçamento com valores por mês, mercado e conta
        - Total Realizado: Dados de custos realizados com fornecedores, valores e históricos
        - Fornecedores: Lista de fornecedores com valores totais
        - DRE: Demonstrativo de Resultados do Exercício com variações

        O usuário fez a seguinte pergunta: {chat_message.message}

        Forneça uma resposta útil e analítica baseada nos dados disponíveis.
        Se a pergunta for sobre tendências, forneça insights.
        Se for sobre comparações, mostre diferenças.
        Se for sobre previsões, use os dados históricos para estimar.
        """

        response = model.generate_content(context)
        return {"response": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@app.get("/debug-databases")
async def debug_databases(current_user: User = Depends(get_current_user)):
    """Endpoint para verificar o estado dos bancos de dados em memória"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return {
        "users": {
            "count": len(users_db.users),
            "emails": list(users_db.users.keys())
        },
        "files": {
            "count": len(files_db.files),
            "names": list(files_db.files.keys())
        },
        "excel_data": {
            "fato_orcamento": len(excel_data_db.fato_orcamento),
            "fato_realizado": len(excel_data_db.fato_realizado),
            "d_calendario": len(excel_data_db.d_calendario),
            "d_estrutura": len(excel_data_db.d_estrutura),
            "d_conta": len(excel_data_db.d_conta),
            "d_fornecedor": len(excel_data_db.d_fornecedor)
        },
        "setores": {
            "count": len(setores_db.setores),
            "ids": list(setores_db.setores.keys())
        },
        "departamentos": {
            "count": len(departamentos_db.departamentos),
            "ids": list(departamentos_db.departamentos.keys())
        },
        "filiais": {
            "count": len(filiais_db.filiais),
            "ids": list(filiais_db.filiais.keys())
        }
    }

# @app.on_event("startup")
# async def startup_event():
#     # Load Excel data on startup
#     try:
#         excel_file = '../frontend/app/fotos/Custos e Despesas - RxO Detalhado MBA_79_4362278567806326751 (1).xlsx'
#         if os.path.exists(excel_file):
#             print("Loading Excel data on startup...")
#             # Read the Excel file
#             df = pd.read_excel(excel_file, sheet_name='Real x Orçado', header=None)

#             # Set headers from row 1 (index 1), skip first two rows
#             df.columns = df.iloc[1]
#             df = df[2:].reset_index(drop=True)

#             # Drop the first column (NaN)
#             df = df.iloc[:, 1:]

#             # Convert to list of dicts for easier processing
#             records = df.to_dict('records')

#             fato_orcamento_data = []
#             fato_realizado_data = []

#             for index, record in enumerate(records):
#                 # Extract values with safe parsing
#                 try:
#                     ano = int(float(record.get('Ano', 0))) if pd.notna(record.get('Ano', 0)) else 0
#                 except (ValueError, TypeError):
#                     ano = 0

#                 try:
#                     mes = int(float(record.get('Mês', 0))) if pd.notna(record.get('Mês', 0)) else 0
#                 except (ValueError, TypeError):
#                     mes = 0

#                 mercado = str(record.get('Mercado', '')) if pd.notna(record.get('Mercado', '')) else ''
#                 nucleo = str(record.get('Núcleo', '')) if pd.notna(record.get('Núcleo', '')) else ''
#                 microNucleo = str(record.get('Micro Núcleo', '')) if pd.notna(record.get('Micro Núcleo', '')) else ''
#                 departamento = str(record.get('Departamento', '')) if pd.notna(record.get('Departamento', '')) else ''
#                 filial = str(record.get('Filial', '')) if pd.notna(record.get('Filial', '')) else ''
#                 codigoMicroMercado = str(record.get('Código Micro Mercado ou UC', '')) if pd.notna(record.get('Código Micro Mercado ou UC', '')) else ''
#                 microMercadoUC = str(record.get('Micro Mercado ou UC', '')) if pd.notna(record.get('Micro Mercado ou UC', '')) else ''
#                 custosFPO = safe_float(record.get('Custos FPO (novo)', 0))
#                 custosFPMSVO = safe_float(record.get('Custos FPMSVO', 0))
#                 custosFPMSVOExecutivo = safe_float(record.get('Custos FPMSVO Executivo', 0))
#                 codigoContaGerencial = str(record.get('Código Conta Gerencial', '')) if pd.notna(record.get('Código Conta Gerencial', '')) else ''
#                 contaGerencial = str(record.get('Conta Gerencial', '')) if pd.notna(record.get('Conta Gerencial', '')) else ''
#                 codigoContaContabil = str(record.get('Código da Conta Contábil', '')) if pd.notna(record.get('Código da Conta Contábil', '')) else ''
#                 contaContabil = str(record.get('Conta Contabil', '')) if pd.notna(record.get('Conta Contabil', '')) else ''
#                 va = float(record.get('VA', 0)) if pd.notna(record.get('VA', 0)) else 0
#                 vlrOrcado = safe_float(record.get('Vlr Orçado', 0))
#                 valorDRE = safe_float(record.get('Valor DRE', 0))
#                 pacote = str(record.get('Pacote', '')) if pd.notna(record.get('Pacote', '')) else ''
#                 subpacote = str(record.get('Subpacote', '')) if pd.notna(record.get('Subpacote', '')) else ''

#                 if ano > 0 and mes > 0:
#                     data_str = f"{ano}-{mes:02d}-01"

#                     # Process orçamento data (Vlr Orçado)
#                     if vlrOrcado != 0:
#                         fato_orcamento_data.append(FatoOrcamento(
#                             id=f"orc_{index}",
#                             ano=ano,
#                             mes=mes,
#                             data=data_str,
#                             codigoMicroMercado=codigoMicroMercado,
#                             codigoConta=codigoContaContabil,
#                             vlrOrcado=vlrOrcado
#                         ))

#                     # Process realizado data (Valor DRE)
#                     if valorDRE != 0:
#                         fato_realizado_data.append(FatoRealizado(
#                             id=f"real_{index}",
#                             ano=ano,
#                             mes=mes,
#                             data=data_str,
#                             codigoMicroMercado=codigoMicroMercado,
#                             codigoConta=codigoContaContabil,
#                             razaoSocial=contaGerencial or 'Fornecedor',
#                             valorCustoTotal=valorDRE,
#                             historicoCusto=f"{departamento} - {pacote} - {subpacote}"
#                         ))

#             # Create dimension tables
#             calendario_map = {}
#             estrutura_map = {}
#             conta_map = {}
#             fornecedor_map = {}

#             all_facts = fato_orcamento_data + fato_realizado_data

#             for fact in all_facts:
#                 # DCalendario
#                 if fact.data not in calendario_map:
#                     date_obj = datetime.strptime(fact.data, "%Y-%m-%d")
#                     nome_mes = date_obj.strftime("%B")
#                     trimestre = ((fact.mes - 1) // 3) + 1
#                     calendario_map[fact.data] = DCalendario(
#                         data=fact.data,
#                         ano=fact.ano,
#                         mes=fact.mes,
#                         nomeMes=nome_mes,
#                         trimestre=trimestre
#                     )

#                 # DEstrutura
#                 if fact.codigoMicroMercado and fact.codigoMicroMercado not in estrutura_map:
#                     estrutura_map[fact.codigoMicroMercado] = DEstrutura(
#                         codigoMicroMercado=fact.codigoMicroMercado,
#                         nomeMicroMercado=fact.codigoMicroMercado,
#                         nucleo='',
#                         microNucleo='',
#                         filial='',
#                         mercado=''
#                     )

#                 # DConta
#                 if fact.codigoConta and fact.codigoConta not in conta_map:
#                     conta_map[fact.codigoConta] = DConta(
#                         codigoConta=fact.codigoConta,
#                         pacote='',
#                         subpacote='',
#                         contaGerencial='',
#                         contaContabil=fact.codigoConta
#                     )

#             # DFornecedor from FatoRealizado
#             for fact in fato_realizado_data:
#                 if fact.razaoSocial and fact.razaoSocial not in fornecedor_map:
#                     fornecedor_map[fact.razaoSocial] = DFornecedor(
#                         razaoSocial=fact.razaoSocial,
#                         tipoFornecedor='Fornecedor'
#                     )

#             # Create ExcelDataUpload object and save
#             excel_data = ExcelDataUpload(
#                 fatoOrcamento=fato_orcamento_data,
#                 fatoRealizado=fato_realizado_data,
#                 dCalendario=list(calendario_map.values()),
#                 dEstrutura=list(estrutura_map.values()),
#                 dConta=list(conta_map.values()),
#                 dFornecedor=list(fornecedor_map.values())
#             )

#             excel_data_db.save_data(excel_data)
#             print(f"Excel data loaded successfully. Processed {len(fato_orcamento_data)} orçamento and {len(fato_realizado_data)} realizado records.")
#         else:
#             print("Excel file not found on startup, skipping auto-load.")
#     except Exception as e:
#         print(f"Error loading Excel on startup: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
