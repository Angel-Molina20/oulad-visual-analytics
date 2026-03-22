import os
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler


def silhouette_multi_sample(Xs, labels, df_index, sample_n=50000, seeds=(42, 123, 999)):
    scores = []
    n = len(df_index)
    sample_n = min(sample_n, n)

    for seed in seeds:
        sample_idx = pd.Index(df_index).to_series().sample(n=sample_n, random_state=seed).index.to_numpy()
        Xs_sample = Xs[sample_idx]
        labels_sample = labels[sample_idx]
        if len(set(labels_sample)) <= 1:
            scores.append(-1.0)
        else:
            scores.append(float(silhouette_score(Xs_sample, labels_sample)))
    avg = float(sum(scores) / len(scores))
    return scores, avg, sample_n


def main():
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    artifacts_dir = Path(os.getenv("ARTIFACTS_DIR", "/data/artifacts")) / "clustering"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    weekly_path = processed_dir / "weekly_features.parquet"
    if not weekly_path.exists():
        raise SystemExit("No existe weekly_features.parquet. Ejecuta 03_weekly_features primero.")

    print("Job 04 | leyendo:", weekly_path)
    df = pd.read_parquet(weekly_path)
    print("Job 04 | filas:", len(df))

    features = ["clicks_total", "resources_touched", "resource_types_touched", "events_count"]
    X = df[features].fillna(0).astype("float64")

    print("Job 04 | escalando features:", features)
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)

    k_candidates = [3, 4, 5]
    best_k = None
    best_avg = -1.0
    best_model = None
    best_scores = None
    best_sample_n = None

    seeds = (42, 123, 999)
    target_sample_n = 50000

    print("Job 04 | probando k:", k_candidates)
    for k in k_candidates:
        model = KMeans(n_clusters=k, random_state=42, n_init="auto")
        labels = model.fit_predict(Xs)

        scores, avg, used_n = silhouette_multi_sample(
            Xs, labels, df.index, sample_n=target_sample_n, seeds=seeds
        )

        print(f"Job 04 | k={k} silhouette(samples)={scores} avg={avg:.4f} n={used_n}")

        if avg > best_avg:
            best_avg = avg
            best_k = k
            best_model = model
            best_scores = scores
            best_sample_n = used_n

    print("Job 04 | mejor k:", best_k, "silhouette_avg:", f"{best_avg:.4f}", "scores:", best_scores)

    df_out = df.copy()
    df_out["cluster"] = best_model.predict(Xs)

    summary = (
        df_out.groupby("cluster")[features]
        .agg(["mean", "median", "count"])
    )
    summary.columns = ["_".join(col) for col in summary.columns]
    summary = summary.reset_index()

    out_clustered = processed_dir / "weekly_features_clustered.parquet"
    df_out.to_parquet(out_clustered, index=False)
    print("Job 04 | guardado:", out_clustered)

    joblib.dump(best_model, artifacts_dir / "kmeans.joblib")
    joblib.dump(scaler, artifacts_dir / "scaler.joblib")
    summary.to_json(artifacts_dir / "cluster_summary.json", orient="records", indent=2)

    meta = {
        "features": features,
        "k_candidates": k_candidates,
        "best_k": best_k,
        "silhouette_samples": best_scores,
        "best_silhouette_avg": float(best_avg),
        "silhouette_sample_n": int(best_sample_n),
        "silhouette_seeds": list(seeds),
    }
    (artifacts_dir / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    print("Job 04 | artifacts:", artifacts_dir)
    print("Job 04 | OK")


if __name__ == "__main__":
    main()