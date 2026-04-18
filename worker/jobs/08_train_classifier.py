import os
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import classification_report


FEATURES = [
    "clicks_total",
    "resources_touched",
    "resource_types_touched",
    "events_count",
    "assessment_events",
    "has_submission_week",
    "weeks_active_ratio",
    "clicks_delta_prev_week",
    "resource_diversity_delta",
    "cluster",
    "week_id",
]


def main():
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    artifacts_dir = Path(os.getenv("ARTIFACTS_DIR", "/data/artifacts")) / "classifier"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    mart_path = processed_dir / "mart_clean.parquet"
    if not mart_path.exists():
        raise SystemExit("No existe mart_clean.parquet. Ejecuta job 06 primero.")

    df = pd.read_parquet(mart_path)
    print(f"Job 08 | filas cargadas: {len(df)}")

    valid_outcomes = ["Pass", "Fail", "Withdrawn", "Distinction"]
    df = df[df["final_result"].isin(valid_outcomes)].copy()
    print(f"Job 08 | filas con outcome válido: {len(df)}")
    print("Job 08 | distribución:\n", df["final_result"].value_counts().to_string())

    for col in FEATURES:
        if col not in df.columns:
            df[col] = 0

    X = df[FEATURES].fillna(0).astype("float64")

    le = LabelEncoder()
    y = le.fit_transform(df["final_result"])
    classes = list(le.classes_)
    print(f"Job 08 | clases codificadas: {list(zip(range(len(classes)), classes))}")

    model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        random_state=42,
        verbose=0,
    )

    print("Job 08 | cross-validation (5-fold estratificado)...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_results = cross_validate(
        model, X, y,
        cv=cv,
        scoring=["accuracy", "f1_weighted"],
        return_train_score=False,
        n_jobs=1,
    )

    cv_accuracy = float(np.mean(cv_results["test_accuracy"]))
    cv_f1 = float(np.mean(cv_results["test_f1_weighted"]))
    print(f"Job 08 | CV accuracy: {cv_accuracy:.4f} | CV F1-weighted: {cv_f1:.4f}")

    print("Job 08 | entrenando modelo final sobre datos completos...")
    model.fit(X, y)

    y_pred = model.predict(X)
    report = classification_report(y, y_pred, target_names=classes, output_dict=True)
    print("Job 08 | classification_report (datos completos):\n",
          classification_report(y, y_pred, target_names=classes))

    feature_importances = {
        feat: round(float(imp), 6)
        for feat, imp in zip(FEATURES, model.feature_importances_)
    }
    fi_sorted = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)
    print("Job 08 | feature importances:")
    for feat, imp in fi_sorted:
        print(f"   {feat}: {imp:.4f}")

    joblib.dump(model, artifacts_dir / "classifier.joblib")
    joblib.dump(le, artifacts_dir / "label_encoder.joblib")

    meta = {
        "model_type": "GradientBoostingClassifier",
        "features": FEATURES,
        "classes": classes,
        "n_samples": int(len(df)),
        "cv_accuracy": round(cv_accuracy, 4),
        "cv_f1_weighted": round(cv_f1, 4),
        "cv_accuracy_per_fold": [round(float(x), 4) for x in cv_results["test_accuracy"]],
        "cv_f1_per_fold": [round(float(x), 4) for x in cv_results["test_f1_weighted"]],
        "class_distribution": {k: int(v) for k, v in df["final_result"].value_counts().items()},
        "feature_importances": dict(fi_sorted),
        "full_data_report": report,
    }
    (artifacts_dir / "classifier_meta.json").write_text(
        json.dumps(meta, indent=2), encoding="utf-8"
    )

    print(f"Job 08 | artifacts guardados en: {artifacts_dir}")
    print("Job 08 | OK")


if __name__ == "__main__":
    main()
