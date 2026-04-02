import os
from pathlib import Path
import pandas as pd

def main():
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    events_path = processed_dir / "events.parquet"
    if not events_path.exists():
        raise SystemExit("No existe events.parquet. Ejecuta 02_build_events primero.")

    df = pd.read_parquet(events_path)

    # week_id en base a "días desde inicio"
    df["week_id"] = (df["timestamp_day"] // 7).astype("int64")
    df["is_assessment"] = (df["event_type"] == "assessment_submission").astype("int64")

    agg = df.groupby(["course_id", "user_id", "week_id"], as_index=False).agg(
        clicks_total=("clicks", "sum"),
        resources_touched=("resource_id", "nunique"),
        resource_types_touched=("resource_type", "nunique"),
        events_count=("resource_id", "count"),
        assessment_events=("is_assessment", "sum"),
    )

    agg = agg.sort_values(["course_id", "user_id", "week_id"]).reset_index(drop=True)
    agg["has_submission_week"] = (agg["assessment_events"] > 0).astype("int64")
    agg["clicks_delta_prev_week"] = agg.groupby(["course_id", "user_id"])["clicks_total"].diff().fillna(0)
    agg["resource_diversity_delta"] = agg.groupby(["course_id", "user_id"])["resource_types_touched"].diff().fillna(0)

    active_flag = (agg["events_count"] > 0).astype("int64")
    agg["weeks_active_ratio"] = (
        active_flag.groupby([agg["course_id"], agg["user_id"]]).cumsum()
        / (agg.groupby(["course_id", "user_id"]).cumcount() + 1)
    ).round(4)

    out = processed_dir / "weekly_features.parquet"
    agg.to_parquet(out, index=False)
    print("OK:", out, "rows=", len(agg))

if __name__ == "__main__":
    main()