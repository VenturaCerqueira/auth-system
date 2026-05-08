from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional, List

import pymysql

from backend.db import get_mysql_connection


def _ensure_schema(conn) -> None:
    """
    Cria tabelas básicas necessárias para autenticação e cadastros.
    Executa com autocommit=True.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                email VARCHAR(255) PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                -- Alguns bancos antigos podem ter coluna com outro nome.
                password_hash VARCHAR(255) NOT NULL,
                disabled BOOLEAN NOT NULL DEFAULT FALSE,
                matricula VARCHAR(255) NULL,
                setor_id VARCHAR(64) NULL,
                departamento_id VARCHAR(64) NULL,
                filial_id VARCHAR(64) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


            """
        )

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS filiais (
                id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS departamentos (
                id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) NOT NULL,
                filial_id VARCHAR(64) NOT NULL,
                CONSTRAINT fk_departamentos_filiais
                    FOREIGN KEY (filial_id) REFERENCES filiais(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS setores (
                id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) NOT NULL,
                departamento_id VARCHAR(64) NOT NULL,
                CONSTRAINT fk_setores_departamentos
                    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        )


def _column_exists(conn, table: str, column: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = %s
              AND COLUMN_NAME = %s
            """,
            (table, column),
        )
        row = cur.fetchone()
        return (row or {}).get("cnt", 0) > 0


def init_mysql() -> None:
    conn = get_mysql_connection()
    try:
        _ensure_schema(conn)

        # Ajuste para bancos antigos: garante coluna password_hash.
        if not _column_exists(conn, "users", "password_hash"):
            with conn.cursor() as cur:
                cur.execute(
                    "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''"
                )

    finally:
        conn.close()



class MysqlUserRepo:
    def create_user(
        self,
        *,
        email: str,
        full_name: str,
        role: str,
        password_hash: str,
        disabled: bool,
        matricula: Optional[str],
        setor_id: Optional[str],
        departamento_id: Optional[str],
        filial_id: Optional[str],
    ) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO users
                        (email, full_name, role, password_hash, disabled, matricula, setor_id, departamento_id, filial_id)
                    VALUES
                        (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        full_name=VALUES(full_name),
                        role=VALUES(role),
                        password_hash=VALUES(password_hash),
                        disabled=VALUES(disabled),
                        matricula=VALUES(matricula),
                        setor_id=VALUES(setor_id),
                        departamento_id=VALUES(departamento_id),
                        filial_id=VALUES(filial_id);
                    """,
                    (
                        email,
                        full_name,
                        role,
                        password_hash,
                        int(bool(disabled)),
                        matricula,
                        setor_id,
                        departamento_id,
                        filial_id,
                    ),
                )
        finally:
            conn.close()

    def user_exists(self, email: str) -> bool:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM users WHERE email=%s LIMIT 1", (email,))
                row = cur.fetchone()
                return row is not None
        finally:
            conn.close()

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE email=%s LIMIT 1", (email,))
                row = cur.fetchone()
                return row
        finally:
            conn.close()

    def list_users(self) -> List[Dict[str, Any]]:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users")
                return list(cur.fetchall() or [])
        finally:
            conn.close()

    def delete_user(self, email: str) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM users WHERE email=%s", (email,))
        finally:
            conn.close()

    def set_user_password_hash(self, email: str, password_hash: str) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE users SET password_hash=%s WHERE email=%s",
                    (password_hash, email),
                )
        finally:
            conn.close()

    def update_user(
        self,
        *,
        email: str,
        full_name: str,
        role: str,
        disabled: bool,
        matricula: Optional[str],
        setor_id: Optional[str],
        departamento_id: Optional[str],
        filial_id: Optional[str],
    ) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE users
                    SET full_name=%s,
                        role=%s,
                        disabled=%s,
                        matricula=%s,
                        setor_id=%s,
                        departamento_id=%s,
                        filial_id=%s
                    WHERE email=%s
                    """,
                    (
                        full_name,
                        role,
                        int(bool(disabled)),
                        matricula,
                        setor_id,
                        departamento_id,
                        filial_id,
                        email,
                    ),
                )
        finally:
            conn.close()


class MysqlFilialRepo:
    def get_all_filiais(self) -> List[Dict[str, Any]]:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM filiais")
                return list(cur.fetchall() or [])
        finally:
            conn.close()

    def filial_exists(self, filial_id: str) -> bool:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM filiais WHERE id=%s LIMIT 1", (filial_id,))
                row = cur.fetchone()
                return row is not None
        finally:
            conn.close()

    def add_filial(self, filial_id: str, filial_data: Dict[str, Any]) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO filiais (id, name, code)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        name=VALUES(name),
                        code=VALUES(code)
                    """,
                    (filial_id, filial_data["name"], filial_data["code"]),
                )
        finally:
            conn.close()

    def update_filial(self, filial_id: str, filial_data: Dict[str, Any]) -> None:
        self.add_filial(filial_id, filial_data)

    def delete_filial(self, filial_id: str) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM filiais WHERE id=%s", (filial_id,))
        finally:
            conn.close()

    def get_filial(self, filial_id: str) -> Optional[Dict[str, Any]]:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM filiais WHERE id=%s LIMIT 1", (filial_id,))
                row = cur.fetchone()
                return row
        finally:
            conn.close()


class MysqlDepartamentoRepo:
    def get_all_departamentos(self) -> List[Dict[str, Any]]:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM departamentos")
                return list(cur.fetchall() or [])
        finally:
            conn.close()

    def departamento_exists(self, dep_id: str) -> bool:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM departamentos WHERE id=%s LIMIT 1", (dep_id,))
                row = cur.fetchone()
                return row is not None
        finally:
            conn.close()

    def add_departamento(self, dep_id: str, dep_data: Dict[str, Any]) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO departamentos (id, name, code, filial_id)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        name=VALUES(name),
                        code=VALUES(code),
                        filial_id=VALUES(filial_id)
                    """,
                    (dep_id, dep_data["name"], dep_data["code"], dep_data["filial_id"]),
                )
        finally:
            conn.close()

    def update_departamento(self, dep_id: str, dep_data: Dict[str, Any]) -> None:
        self.add_departamento(dep_id, dep_data)

    def delete_departamento(self, dep_id: str) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM departamentos WHERE id=%s", (dep_id,))
        finally:
            conn.close()

    def get_departamento(self, dep_id: str) -> Optional[Dict[str, Any]]:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM departamentos WHERE id=%s LIMIT 1", (dep_id,))
                return cur.fetchone()
        finally:
            conn.close()


class MysqlSetorRepo:
    def get_all_setores(self) -> List[Dict[str, Any]]:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM setores")
                return list(cur.fetchall() or [])
        finally:
            conn.close()

    def setor_exists(self, setor_id: str) -> bool:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM setores WHERE id=%s LIMIT 1", (setor_id,))
                row = cur.fetchone()
                return row is not None
        finally:
            conn.close()

    def add_setor(self, setor_id: str, setor_data: Dict[str, Any]) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO setores (id, name, code, departamento_id)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        name=VALUES(name),
                        code=VALUES(code),
                        departamento_id=VALUES(departamento_id)
                    """,
                    (setor_id, setor_data["name"], setor_data["code"], setor_data["departamento_id"]),
                )
        finally:
            conn.close()

    def update_setor(self, setor_id: str, setor_data: Dict[str, Any]) -> None:
        self.add_setor(setor_id, setor_data)

    def delete_setor(self, setor_id: str) -> None:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM setores WHERE id=%s", (setor_id,))
        finally:
            conn.close()

    def get_setor(self, setor_id: str) -> Optional[Dict[str, Any]]:
        conn = get_mysql_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM setores WHERE id=%s LIMIT 1", (setor_id,))
                return cur.fetchone()
        finally:
            conn.close()
