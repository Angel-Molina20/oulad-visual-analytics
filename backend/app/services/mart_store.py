import os
from pathlib import Path
from functools import lru_cache
import pandas as pd
import duckdb


def _mart_path() -> Path:
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    return processed_dir / "mart_clean.parquet"


@lru_cache(maxsize=1)
def load_mart() -> pd.DataFrame:
    path = _mart_path()
    if not path.exists():
        raise FileNotFoundError(f"No existe {path}. Ejecuta job 06 para generar mart_clean.parquet.")
    df = pd.read_parquet(path)
    if "week_id" in df.columns:
        df = df[df["week_id"] >= 0].copy()
    return df


def query_mart(sql: str, params: list | None = None) -> pd.DataFrame:
    """
    Ejecuta una consulta SQL sobre el DataFrame en memoria usando DuckDB.
    Referencia la tabla como 'mart' en el SQL.
    Crea una conexión nueva por llamada (thread-safe).
    """
    df = load_mart()
    conn = duckdb.connect()
    try:
        conn.register("mart", df)
        if params:
            return conn.execute(sql, params).df()
        return conn.execute(sql).df()
    finally:
        conn.close()


def reload_mart() -> dict:
    load_mart.cache_clear()
    df = load_mart()
    return {"rows": int(len(df)), "path": str(_mart_path())}
