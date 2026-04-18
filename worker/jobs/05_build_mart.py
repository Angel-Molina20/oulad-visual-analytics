import os
from pathlib import Path
import pandas as pd


def find_csv_dir(raw_dir: Path) -> Path:
    base = raw_dir / "oulad"
    candidates = [p for p in base.rglob("*") if p.is_dir() and (p / "studentInfo.csv").exists()]
    if not candidates:
        raise SystemExit("No encontré studentInfo.csv dentro de data/raw/oulad. Revisa la extracción del zip.")
    return candidates[0]


def main():
    raw_dir = Path(os.getenv("RAW_DIR", "/data/raw"))
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    processed_dir.mkdir(parents=True, exist_ok=True)

    clustered_path = processed_dir / "weekly_features_clustered.parquet"
    if not clustered_path.exists():
        raise SystemExit("No existe weekly_features_clustered.parquet. Ejecuta 04_cluster_profiles.")

    df = pd.read_parquet(clustered_path)

    # Asegura columnas derivadas del pipeline enriquecido
    defaults = {
        "assessment_events": 0,
        "has_submission_week": 0,
        "weeks_active_ratio": 0.0,
        "clicks_delta_prev_week": 0.0,
        "resource_diversity_delta": 0.0,
    }
    for col, default in defaults.items():
        if col not in df.columns:
            df[col] = default

    csv_dir = find_csv_dir(raw_dir)
    student_info = pd.read_csv(csv_dir / "studentInfo.csv")

    student_info["course_id"] = student_info["code_module"].astype(str) + "_" + student_info["code_presentation"].astype(str)

    outcome = student_info[["id_student", "course_id", "final_result"]].rename(
        columns={"id_student": "user_id"}
    )

    # Asignar display_name una sola vez desde la fuente de verdad:
    # por cada curso, ordenar user_id y numerar desde 1.
    student_ids = (
        outcome[["course_id", "user_id"]]
        .drop_duplicates()
        .sort_values(["course_id", "user_id"])
        .copy()
    )
    student_ids["display_name"] = (
        "Demo Test " + (student_ids.groupby("course_id").cumcount() + 1).astype(str)
    )
    outcome = outcome.merge(student_ids, on=["course_id", "user_id"], how="left")

    mart = df.merge(outcome, on=["user_id", "course_id"], how="left")

    out_path = processed_dir / "mart.parquet"
    mart.to_parquet(out_path, index=False)

    print("OK Job 05")
    print("saved:", out_path)
    print("rows:", len(mart))
    print("final_result counts:")
    print(mart["final_result"].value_counts(dropna=False).head(10))


if __name__ == "__main__":
    main()