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
    student_assessment = pd.read_csv(csv_dir / "studentAssessment.csv")
    assessments = pd.read_csv(csv_dir / "assessments.csv")

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

    assessment_meta = assessments[["id_assessment", "code_module", "code_presentation", "assessment_type", "date"]].copy()
    assessment_meta["course_id"] = assessment_meta["code_module"].astype(str) + "_" + assessment_meta["code_presentation"].astype(str)
    assessment_meta = assessment_meta.drop(columns=["code_module", "code_presentation"])

    submission = student_assessment.merge(assessment_meta, on="id_assessment", how="left")
    submission["timestamp_day"] = submission["date_submitted"].fillna(submission["date"]).astype("int64")
    submission = submission[submission["timestamp_day"] >= 0].copy()

    assessment_events = pd.DataFrame({
        "user_id": submission["id_student"].astype("int64"),
        "course_id": submission["course_id"].astype(str),
        "timestamp_day": submission["timestamp_day"].astype("int64"),
        "event_type": "assessment_submission",
        "resource_type": submission["assessment_type"].fillna("assessment").astype(str),
        "resource_id": submission["id_assessment"].astype("int64"),
        "clicks": 1,
    })

    events = pd.concat([events, assessment_events], ignore_index=True)

    out = processed_dir / "events.parquet"
    events.to_parquet(out, index=False)
    print("OK:", out, "rows=", len(events))

if __name__ == "__main__":
    main()