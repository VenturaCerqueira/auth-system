import os
import pymysql
from typing import Optional


def _get_env(name: str, default: Optional[str] = None) -> str:
    value = os.getenv(name, default)
    if value is None or value == "":
        # Fallbacks para facilitar execução local (Windows) sem configurar env vars manualmente.
        # Valores devem bater com o seu pedido:
        # Host: 186.202.152.82 | User: ugmetrics | Senha: Metric@2026 | DB: ugmetrics
        fallbacks = {
            "MYSQL_HOST": "186.202.152.82",
            "MYSQL_USER": "ugmetrics",
            "MYSQL_PASSWORD": "Metric@2026",
            "MYSQL_DATABASE": "ugmetrics",
            "MYSQL_PORT": "3306",
        }
        if name in fallbacks:
            return fallbacks[name]

        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            f"Set it in docker-compose.yml or your run configuration."
        )
    return value




def get_mysql_connection():
    """
    Retorna uma conexão PyMySQL.
    Config via env vars:
      - MYSQL_HOST
      - MYSQL_USER
      - MYSQL_PASSWORD
      - MYSQL_DATABASE
      - MYSQL_PORT (opcional, default 3306)
    """
    host = _get_env("MYSQL_HOST")
    user = _get_env("MYSQL_USER")
    password = _get_env("MYSQL_PASSWORD")
    database = _get_env("MYSQL_DATABASE")
    port = int(os.getenv("MYSQL_PORT", "3306"))

    return pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        port=port,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )
