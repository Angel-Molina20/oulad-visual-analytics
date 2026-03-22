import os
import json
from pathlib import Path
import pandas as pd


def safe_div(a, b):
    return float(a) / float(b) if b else 0.0


def main():
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    artifacts_dir = Path(os.getenv("ARTIFACTS_DIR", "/data/artifacts")) / "clustering"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    mart_path = processed_dir / "mart.parquet"
    if not mart_path.exists():
        raise SystemExit("No existe mart.parquet. Ejecuta job 05.")

    df = pd.read_parquet(mart_path)

    # Limpieza mínima
    df = df[df["week_id"] >= 0].copy()

    feats = ["clicks_total", "resources_touched", "resource_types_touched", "events_count"]

    # 1) Estadísticos globales por cluster sobre semanas
    stats = (
        df.groupby("cluster")[feats]
        .agg(["mean", "median"])
    )
    stats.columns = ["_".join(c) for c in stats.columns]
    stats = stats.reset_index()

    # 2) Outcome por cluster a nivel estudiante-curso (evita duplicar por semana)
    base = (
        df.sort_values("week_id")
        .groupby(["course_id", "user_id"], as_index=False)
        .last()[["course_id", "user_id", "cluster", "final_result"]]
    )

    totals = base.groupby("cluster")["user_id"].nunique().rename("total_students").reset_index()

    outcome_counts = (
        base.groupby(["cluster", "final_result"])["user_id"]
        .nunique()
        .reset_index(name="students")
    )

    outcome = outcome_counts.merge(totals, on="cluster", how="left")
    outcome["rate"] = outcome["students"] / outcome["total_students"]

    # 3) Score simple de estabilidad semanal por estudiante:
    # desviación estándar de clicks_total por estudiante-curso
    stability = (
        df.groupby(["course_id", "user_id"])["clicks_total"]
        .std()
        .reset_index(name="clicks_std")
    )
    stability = stability.merge(
        base[["course_id", "user_id", "cluster"]], on=["course_id", "user_id"], how="left"
    )
    stab_by_cluster = stability.groupby("cluster")["clicks_std"].mean().reset_index(name="clicks_std_mean")

    # Merge todo
    merged = stats.merge(totals, on="cluster", how="left").merge(stab_by_cluster, on="cluster", how="left")

    # Mapa outcome rates por cluster
    def get_rate(cluster, key):
        r = outcome[(outcome["cluster"] == cluster) & (outcome["final_result"] == key)]
        return float(r["rate"].iloc[0]) if len(r) else 0.0

    # 4) Etiquetado automático por ranking
    # alta participación: mayor clicks_total_mean
    ranked = merged.sort_values("clicks_total_mean", ascending=False).copy()
    clusters_sorted = ranked["cluster"].tolist()

    labels = {}
    if len(clusters_sorted) >= 3:
        high = clusters_sorted[0]
        mid = clusters_sorted[1]
        low = clusters_sorted[2]
    else:
        high = clusters_sorted[0]
        mid = clusters_sorted[1] if len(clusters_sorted) > 1 else clusters_sorted[0]
        low = clusters_sorted[-1]

    # Inestabilidad: mayor clicks_std_mean
    unstable = merged.sort_values("clicks_std_mean", ascending=False)["cluster"].iloc[0]

    for c in merged["cluster"].tolist():
        if c == high:
            title = "Alta participación"
            desc = "Mayor actividad semanal y mayor intensidad de interacción."
        elif c == low:
            title = "Baja participación"
            desc = "Menor actividad semanal y menor diversidad de recursos."
        else:
            title = "Participación media"
            desc = "Actividad intermedia y patrones mixtos."

        # Si coincide con el más inestable, ajusta el título solo si no es high
        if c == unstable and c != high:
            title = "Participación irregular"
            desc = "Mayor variación semanal de actividad, requiere seguimiento."

        labels[int(c)] = {"title": title, "description": desc}

    # 5) Construir JSON final consumible por el frontend
    result = []
    for _, row in merged.iterrows():
        c = int(row["cluster"])
        result.append(
            {
                "cluster": c,
                "label": labels[c]["title"],
                "description": labels[c]["description"],
                "total_students": int(row["total_students"]) if pd.notna(row["total_students"]) else 0,
                "clicks_mean": float(row["clicks_total_mean"]),
                "resources_mean": float(row["resources_touched_mean"]),
                "events_mean": float(row["events_count_mean"]),
                "clicks_std_mean": float(row["clicks_std_mean"]) if pd.notna(row["clicks_std_mean"]) else 0.0,
                "rate_pass": get_rate(c, "Pass"),
                "rate_fail": get_rate(c, "Fail"),
                "rate_withdrawn": get_rate(c, "Withdrawn"),
                "rate_distinction": get_rate(c, "Distinction"),
            }
        )

    out_path = artifacts_dir / "cluster_labels.json"
    out_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

    print("OK Job 06")
    print("saved:", out_path)


if __name__ == "__main__":
    main()