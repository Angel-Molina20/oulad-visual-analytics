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

    # 3.1) Tendencia reciente por cluster (comparando últimas 3 semanas vs 3 previas)
    weekly = (
        df.groupby(["cluster", "week_id"], as_index=False)
        .agg(clicks_mean=("clicks_total", "mean"))
        .sort_values(["cluster", "week_id"])
    )

    trend_map = {}
    for c, g in weekly.groupby("cluster"):
        g = g.sort_values("week_id")
        if len(g) >= 4:
            tail = g.tail(3)["clicks_mean"].mean()
            prev = g.iloc[:-3].tail(3)["clicks_mean"].mean()
        else:
            tail = g["clicks_mean"].mean()
            prev = g["clicks_mean"].mean()
        trend_map[int(c)] = safe_div(tail - prev, prev) if prev else 0.0

    # Merge todo
    merged = stats.merge(totals, on="cluster", how="left").merge(stab_by_cluster, on="cluster", how="left")

    # Mapa outcome rates por cluster
    def get_rate(cluster, key):
        r = outcome[(outcome["cluster"] == cluster) & (outcome["final_result"] == key)]
        return float(r["rate"].iloc[0]) if len(r) else 0.0

    # 4) Etiquetado automático por ranking
    ranked = merged.sort_values("clicks_total_mean", ascending=False).copy()
    clusters_sorted = ranked["cluster"].tolist()

    labels = {}
    high = clusters_sorted[0]
    low = clusters_sorted[-1]

    # Inestabilidad: mayor clicks_std_mean
    unstable = merged.sort_values("clicks_std_mean", ascending=False)["cluster"].iloc[0]

    # Caída reciente: tendencia más negativa (si es relevante)
    drop_candidates = [c for c, t in trend_map.items() if t <= -0.15]
    drop_cluster = min(drop_candidates, key=lambda c: trend_map[c]) if drop_candidates else None

    for c in merged["cluster"].tolist():
        if c == high:
            title = "Alta participación sostenida"
            desc = "Mayor actividad semanal con estabilidad en el tiempo."
        elif c == low:
            title = "Baja participación persistente"
            desc = "Menor actividad semanal y poca diversidad de recursos."
        elif drop_cluster is not None and c == drop_cluster:
            title = "Caída reciente de actividad"
            desc = "Descenso en la actividad en las últimas semanas del curso."
        elif c == unstable:
            title = "Participación intermitente"
            desc = "Alta variación semanal; la actividad sube y baja con frecuencia."
        else:
            title = "Participación intermedia"
            desc = "Actividad moderada con patrones mixtos."

        labels[int(c)] = {"title": title, "description": desc}

    # 5) Construir JSON final consumible por el frontend
    result = []
    for _, row in merged.iterrows():
        c = int(row["cluster"])
        rate_pass = get_rate(c, "Pass")
        rate_fail = get_rate(c, "Fail")
        rate_withdrawn = get_rate(c, "Withdrawn")
        rate_distinction = get_rate(c, "Distinction")
        outcome_rates = {
            "Pass": rate_pass,
            "Fail": rate_fail,
            "Withdrawn": rate_withdrawn,
            "Distinction": rate_distinction,
        }
        top_outcome = max(outcome_rates, key=outcome_rates.get)

        clicks_mean = float(row["clicks_total_mean"])
        resources_mean = float(row["resources_touched_mean"])
        resource_types_mean = float(row["resource_types_touched_mean"])
        clicks_std_mean = float(row["clicks_std_mean"]) if pd.notna(row["clicks_std_mean"]) else 0.0
        trend_ratio = float(trend_map.get(c, 0.0))

        reasons = [
            f"Clicks promedio/semana: {clicks_mean:.1f}",
            f"Diversidad de recursos/semana: {resource_types_mean:.1f}",
            f"Variación semanal (σ clicks): {clicks_std_mean:.1f}",
            f"Resultado dominante: {top_outcome} ({outcome_rates[top_outcome]*100:.1f}%)",
        ]

        result.append(
            {
                "cluster": c,
                "label": labels[c]["title"],
                "description": labels[c]["description"],
                "reasons": reasons,
                "total_students": int(row["total_students"]) if pd.notna(row["total_students"]) else 0,
                "clicks_mean": clicks_mean,
                "resources_mean": resources_mean,
                "resource_types_mean": resource_types_mean,
                "events_mean": float(row["events_count_mean"]),
                "clicks_std_mean": clicks_std_mean,
                "trend_ratio": trend_ratio,
                "rate_pass": rate_pass,
                "rate_fail": rate_fail,
                "rate_withdrawn": rate_withdrawn,
                "rate_distinction": rate_distinction,
            }
        )

    out_path = artifacts_dir / "cluster_labels.json"
    out_path.write_text(json.dumps(result, indent=2), encoding="utf-8")

    print("OK Job 07")
    print("saved:", out_path)


if __name__ == "__main__":
    main()