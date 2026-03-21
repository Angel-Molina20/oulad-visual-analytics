import os
from pathlib import Path
import pandas as pd

def find_csv_dir() -> Path:
    raw_dir = Path(os.getenv("RAW_DIR", "/data/raw"))
    base = raw_dir / "oulad"
    csv_dirs = [p for p in base.rglob("*") if p.is_dir() and any(p.glob("studentVle.csv"))]
    if not csv_dirs:
        raise SystemExit("No encontré studentVle.csv. Ejecuta primero 01_ingest_oulad.")
    return csv_dirs[0]

def main():
    csv_dir = find_csv_dir()
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    processed_dir.mkdir(parents=True, exist_ok=True)

    student_vle = pd.read_csv(csv_dir / "studentVle.csv")
    vle = pd.read_csv(csv_dir / "vle.csv")

    # Join para traer tipo de recurso (activity_type) y sitio
    df = student_vle.merge(vle, on=["code_module", "code_presentation", "id_site"], how="left")

    # Eventos normalizados
    events = pd.DataFrame({
        "user_id": df["id_student"].astype("int64"),
        "course_id": (df["code_module"].astype(str) + "_" + df["code_presentation"].astype(str)),
        "timestamp_day": df["date"].astype("int64"),  # días desde inicio del curso, en OULAD
        "event_type": "vle_interaction",
        "resource_type": df["activity_type"].astype(str),
        "resource_id": df["id_site"].astype("int64"),
        "clicks": df["sum_click"].astype("int64"),
    })

    out = processed_dir / "events.parquet"
    events.to_parquet(out, index=False)
    print("OK:", out, "rows=", len(events))

if __name__ == "__main__":
    main()