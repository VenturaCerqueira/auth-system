import requests

# Login to get token
login_data = {
    "email": "admin@example.com",
    "password": "admin123"
}

login_response = requests.post("http://localhost:8000/login", json=login_data)
if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print("Login successful, got token")
else:
    print("Login failed:", login_response.json())
    exit(1)

# File path
file_path = "auth-system/frontend/app/fotos/Custos e Despesas - RxO Detalhado MBA_79_4362278567806326751 (1).xlsx"

# Headers
headers = {
    "Authorization": f"Bearer {token}"
}

# Upload file
with open(file_path, "rb") as f:
    files = {"file": f}
    response = requests.post("http://localhost:8000/upload-raw-excel", files=files, headers=headers)

print("Status Code:", response.status_code)
print("Response:", response.json())
