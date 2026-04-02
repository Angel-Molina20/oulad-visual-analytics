import os
from pathlib import Path
from functools import lru_cache
import pandas as pd


def _mart_path() -> Path:
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    return processed_dir / "mart_clean.parquet"


@lru_cache(maxsize=1)
def load_mart() -> pd.DataFrame:
    path = _mart_path()
    if not path.exists():
        raise FileNotFoundError(f"No existe {path}. Ejecuta job 06 para generar mart_clean.parquet.")
    df = pd.read_parquet(path)

    # Limpieza mínima para el API
    if "week_id" in df.columns:
        df = df[df["week_id"] >= 0].copy()

    return df


def reload_mart() -> dict:
    load_mart.cache_clear()
    df = load_mart()
    return {"rows": int(len(df)), "path": str(_mart_path())}
