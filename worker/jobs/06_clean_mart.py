import os
from pathlib import Path
import pandas as pd

def main():
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    inp = processed_dir / "mart.parquet"
    out = processed_dir / "mart_clean.parquet"

    if not inp.exists():
        raise SystemExit("No existe mart.parquet. Ejecuta job 05.")

    df = pd.read_parquet(inp)

    # 1) semanas no válidas
    df = df[df["week_id"] >= 0].copy()

    # 2) nulos -> 0 en métricas
    for col in [
        "clicks_total",
        "resources_touched",
        "resource_types_touched",
        "events_count",
        "assessment_events",
        "has_submission_week",
        "weeks_active_ratio",
        "clicks_delta_prev_week",
        "resource_diversity_delta",
    ]:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    # 3) asegurar 1 fila por (course_id, user_id, week_id)
    keys = ["course_id", "user_id", "week_id"]
    metric_cols_sum = [
        "clicks_total",
        "resources_touched",
        "resource_types_touched",
        "events_count",
        "assessment_events",
        "has_submission_week",
    ]
    metric_cols_mean = ["weeks_active_ratio", "clicks_delta_prev_week", "resource_diversity_delta"]
    keep_cols = ["cluster", "final_result", "display_name"]

    # Agregamos métricas, y para cluster/final_result tomamos el primero (deberían ser iguales)
    agg = {c: "sum" for c in metric_cols_sum if c in df.columns}
    agg.update({c: "mean" for c in metric_cols_mean if c in df.columns})
    for c in keep_cols:
        if c in df.columns:
            agg[c] = "first"

    df2 = df.groupby(keys, as_index=False).agg(agg)

    df2.to_parquet(out, index=False)

    print("OK Job 06")
    print("saved:", out)
    print("rows before:", len(df), "after:", len(df2))

if __name__ == "__main__":
    main()