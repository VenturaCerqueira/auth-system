"""
Vercel Serverless API - Simple ASGI Handler
"""

import json
import os

# Simple in-memory storage
users_db = {
    "admin@example.com": {
        "email": "admin@example.com",
        "full_name": "Master Admin",
        "role": "admin",
        "password": "$pbkdf2-sha256$29000$abc123$hashed_password",
        "disabled": False,
        "matricula": "001",
        "setor_id": "1",
        "departamento_id": "1",
        "filial_id": "1"
    }
}

permissions_db = {
    "admin@example.com": [
        {"id": "1", "name": "read_users", "description": "Read users"},
        {"id": "2", "name": "write_users", "description": "Write users"},
        {"id": "3", "name": "read_setores", "description": "Read setores"},
        {"id": "4", "name": "write_setores", "description": "Write setores"},
    ]
}

settings_db = {
    "admin@example.com": {
        "theme": "light",
        "language": "pt-BR"
    }
}

setores_db = {
    "1": {"id": "1", "name": "Setor Administrativo", "code": "ADM", "departamento_id": "1"},
    "2": {"id": "2", "name": "Setor Financeiro", "code": "FIN", "departamento_id": "1"},
    "3": {"id": "3", "name": "Setor Operacional", "code": "OPE", "departamento_id": "2"}
}

departamentos_db = {
    "1": {"id": "1", "name": "Departamento de RH", "code": "RH"},
    "2": {"id": "2", "name": "Departamento de TI", "code": "TI"}
}

filiais_db = {
    "1": {"id": "1", "name": "Filial São Paulo", "code": "SP"},
    "2": {"id": "2", "name": "Filial Rio de Janeiro", "code": "RJ"}
}

files_db = []

async def app(scope, receive, send):
    """Simple ASGI app for Vercel"""
    
    path = scope.get("path", "/")
    method = scope.get("method", "GET")
    path_parts = path.strip("/").split("/")
    
    # Set CORS headers
    cors_headers = [
        (b"access-control-allow-origin", b"*"),
        (b"access-control-allow-methods", b"GET, POST, PUT, DELETE, OPTIONS"),
        (b"access-control-allow-headers", b"Content-Type, Authorization"),
    ]
    
    # Handle OPTIONS preflight
    if method == "OPTIONS":
        await send({
            "type": "http.response.start",
            "status": 200,
            "headers": cors_headers + [(b"content-length", b"0")],
        })
        await send({"type": "http.response.body"})
        return
    
    # Helper to get request body
    async def get_body():
        body = await receive()
        body_content = body.get("body", b"")
        if isinstance(body_content, bytes):
            return body_content.decode()
        return ""
    
    # Routes
    if path == "/" or path == "":
        response = {"status": "ok", "message": "Auth System API is running"}
    
    elif path == "/health":
        response = {
            "status": "healthy",
            "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
            "secret_key_configured": bool(os.getenv("SECRET_KEY")),
            "master_admin_email": os.getenv("MASTER_ADMIN_EMAIL", "not set")
        }
    
    # Setores routes
    elif path == "/setores" and method == "GET":
        response = {"setores": list(setores_db.values())}
    elif path == "/setores" and method == "POST":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            new_id = str(len(setores_db) + 1)
            setores_db[new_id] = {
                "id": new_id,
                "name": data.get("name", "New Setor"),
                "code": data.get("code", "NEW"),
                "departamento_id": data.get("departamento_id", "1")
            }
            response = {"setor": setores_db[new_id]}
        except:
            response = {"detail": "Invalid request"}
    
    elif path.startswith("/setores/") and len(path_parts) == 2 and method == "PUT":
        setor_id = path_parts[1]
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            if setor_id in setores_db:
                setores_db[setor_id].update(data)
                response = {"setor": setores_db[setor_id]}
            else:
                response = {"detail": "Setor not found"}
        except:
            response = {"detail": "Invalid request"}
    elif path.startswith("/setores/") and len(path_parts) == 2 and method == "DELETE":
        setor_id = path_parts[1]
        if setor_id in setores_db:
            del setores_db[setor_id]
            response = {"message": "Setor deleted"}
        else:
            response = {"detail": "Setor not found"}
    
    # Departamentos routes
    elif path == "/departamentos" and method == "GET":
        response = {"departamentos": list(departamentos_db.values())}
    elif path == "/departamentos" and method == "POST":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            new_id = str(len(departamentos_db) + 1)
            departamentos_db[new_id] = {
                "id": new_id,
                "name": data.get("name", "New Departamento"),
                "code": data.get("code", "NEW")
            }
            response = {"departamento": departamentos_db[new_id]}
        except:
            response = {"detail": "Invalid request"}
    
    elif path.startswith("/departamentos/") and len(path_parts) == 2 and method == "PUT":
        dept_id = path_parts[1]
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            if dept_id in departamentos_db:
                departamentos_db[dept_id].update(data)
                response = {"departamento": departamentos_db[dept_id]}
            else:
                response = {"detail": "Departamento not found"}
        except:
            response = {"detail": "Invalid request"}
    elif path.startswith("/departamentos/") and len(path_parts) == 2 and method == "DELETE":
        dept_id = path_parts[1]
        if dept_id in departamentos_db:
            del departamentos_db[dept_id]
            response = {"message": "Departamento deleted"}
        else:
            response = {"detail": "Departamento not found"}
    
    # Filiais routes
    elif path == "/filiais" and method == "GET":
        response = {"filiais": list(filiais_db.values())}
    elif path == "/filiais" and method == "POST":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            new_id = str(len(filiais_db) + 1)
            filiais_db[new_id] = {
                "id": new_id,
                "name": data.get("name", "New Filial"),
                "code": data.get("code", "NEW")
            }
            response = {"filial": filiais_db[new_id]}
        except:
            response = {"detail": "Invalid request"}
    
    elif path.startswith("/filiais/") and len(path_parts) == 2 and method == "PUT":
        filial_id = path_parts[1]
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            if filial_id in filiais_db:
                filiais_db[filial_id].update(data)
                response = {"filial": filiais_db[filial_id]}
            else:
                response = {"detail": "Filial not found"}
        except:
            response = {"detail": "Invalid request"}
    elif path.startswith("/filiais/") and len(path_parts) == 2 and method == "DELETE":
        filial_id = path_parts[1]
        if filial_id in filiais_db:
            del filiais_db[filial_id]
            response = {"message": "Filial deleted"}
        else:
            response = {"detail": "Filial not found"}
    
    # Users routes
    elif path == "/users" and method == "GET":
        response = {"users": list(users_db.values())}
    elif path == "/users" and method == "POST":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            email = data.get("email", "")
            if email and email not in users_db:
                new_id = str(len(users_db) + 1)
                users_db[email] = {
                    "email": email,
                    "full_name": data.get("full_name", ""),
                    "role": data.get("role", "user"),
                    "password": "hashed",
                    "disabled": False,
                    "matricula": data.get("matricula", ""),
                    "setor_id": data.get("setor_id", ""),
                    "departamento_id": data.get("departamento_id", ""),
                    "filial_id": data.get("filial_id", "")
                }
                permissions_db[email] = []
                response = {"user": users_db[email]}
            else:
                response = {"detail": "Email already registered"}
        except:
            response = {"detail": "Invalid request"}
    
    # /users/me endpoint
    elif path == "/users/me" and method == "GET":
        response = {"user": users_db.get("admin@example.com", {})}
    elif path == "/users/me" and method == "PUT":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            user = users_db.get("admin@example.com", {})
            if user:
                user.update(data)
                users_db["admin@example.com"] = user
                response = {"user": user}
            else:
                response = {"detail": "User not found"}
        except:
            response = {"detail": "Invalid request"}
    
    # /users/settings endpoint
    elif path == "/users/settings" and method == "PUT":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            email = "admin@example.com"
            settings_db[email] = data
            response = {"settings": settings_db[email]}
        except:
            response = {"detail": "Invalid request"}
    
    # /permissions endpoint
    elif path == "/permissions" and method == "GET":
        response = {"permissions": permissions_db.get("admin@example.com", [])}
    
    # /files endpoint
    elif path == "/files" and method == "GET":
        response = {"files": files_db}
    
    # /chat endpoint
    elif path == "/chat" and method == "POST":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            response = {"response": "Chat response: " + data.get("message", "")}
        except:
            response = {"detail": "Invalid request"}
    
    # /forgot-password endpoint
    elif path == "/forgot-password" and method == "POST":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            response = {"message": "Password reset email sent"}
        except:
            response = {"detail": "Invalid request"}
    
    elif path == "/debug":
        response = {
            "users": list(users_db.keys()),
            "setores_count": len(setores_db),
            "permissions_count": len(permissions_db)
        }
    
    # Login
    elif path == "/login":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            email = data.get("email", "")
            password = data.get("password", "")
            
            if email in users_db:
                response = {"access_token": "demo_token_" + email, "token_type": "bearer", "user": users_db[email]}
            else:
                response = {"detail": "Incorrect email or password"}
        except:
            response = {"detail": "Invalid request"}
    
    # Register
    elif path == "/register":
        body = await get_body()
        try:
            data = json.loads(body) if body else {}
            email = data.get("email", "")
            if email and email not in users_db:
                users_db[email] = {
                    "email": email,
                    "full_name": data.get("full_name", ""),
                    "role": data.get("role", "user"),
                    "password": "hashed",
                    "disabled": False,
                    "matricula": data.get("matricula", ""),
                    "setor_id": data.get("setor_id", ""),
                    "departamento_id": data.get("departamento_id", ""),
                    "filial_id": data.get("filial_id", "")
                }
                permissions_db[email] = []
                response = {"access_token": "demo_token_" + email, "token_type": "bearer"}
            else:
                response = {"detail": "Email already registered"}
        except:
            response = {"detail": "Invalid request"}
    
    else:
        response = {"detail": "Not found"}

    # Send response
    body = json.dumps(response).encode()
    
    await send({
        "type": "http.response.start",
        "status": 200,
        "headers": cors_headers + [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())],
    })
    await send({"type": "http.response.body", "body": body})

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
