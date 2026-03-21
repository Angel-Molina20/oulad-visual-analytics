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

    csv_dir = find_csv_dir(raw_dir)
    student_info = pd.read_csv(csv_dir / "studentInfo.csv")

    student_info["course_id"] = student_info["code_module"].astype(str) + "_" + student_info["code_presentation"].astype(str)

    outcome = student_info[["id_student", "course_id", "final_result"]].rename(
        columns={"id_student": "user_id"}
    )

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