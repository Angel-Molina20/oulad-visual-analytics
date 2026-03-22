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

    agg = df.groupby(["course_id", "user_id", "week_id"], as_index=False).agg(
        clicks_total=("clicks", "sum"),
        resources_touched=("resource_id", "nunique"),
        resource_types_touched=("resource_type", "nunique"),
        events_count=("resource_id", "count"),
    )

    out = processed_dir / "weekly_features.parquet"
    agg.to_parquet(out, index=False)
    print("OK:", out, "rows=", len(agg))

if __name__ == "__main__":
    main()