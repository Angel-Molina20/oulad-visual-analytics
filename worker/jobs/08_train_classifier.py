import os
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.dummy import DummyClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.metrics import accuracy_score, f1_score, classification_report


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

VALID_OUTCOMES = ["Pass", "Fail", "Withdrawn", "Distinction"]
RISK_OUTCOMES = {"Fail", "Withdrawn"}  # para la variante binaria
N_SPLITS = 5
RANDOM_STATE = 42


def _new_model():
    return GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        random_state=RANDOM_STATE,
        verbose=0,
    )


def grouped_cv(X, y, groups, balanced=True):
    """
    Validación cruzada estratificada y agrupada por estudiante.
    Devuelve métricas medias y por partición. Aplica ponderación balanceada
    de clases dentro de cada partición de entrenamiento si balanced=True.
    """
    skf = StratifiedGroupKFold(n_splits=N_SPLITS, shuffle=True, random_state=RANDOM_STATE)
    acc, f1w, f1m = [], [], []

    for fold, (tr, te) in enumerate(skf.split(X, y, groups=groups), start=1):
        X_tr, X_te = X.iloc[tr], X.iloc[te]
        y_tr, y_te = y[tr], y[te]

        model = _new_model()
        if balanced:
            sw = compute_sample_weight(class_weight="balanced", y=y_tr)
            model.fit(X_tr, y_tr, sample_weight=sw)
        else:
            model.fit(X_tr, y_tr)

        y_hat = model.predict(X_te)
        acc.append(accuracy_score(y_te, y_hat))
        f1w.append(f1_score(y_te, y_hat, average="weighted", zero_division=0))
        f1m.append(f1_score(y_te, y_hat, average="macro", zero_division=0))
        print(f"   fold {fold}: acc={acc[-1]:.4f}  f1_weighted={f1w[-1]:.4f}  f1_macro={f1m[-1]:.4f}")

    return {
        "accuracy_mean": float(np.mean(acc)),
        "accuracy_std": float(np.std(acc)),
        "f1_weighted_mean": float(np.mean(f1w)),
        "f1_weighted_std": float(np.std(f1w)),
        "f1_macro_mean": float(np.mean(f1m)),
        "f1_macro_std": float(np.std(f1m)),
        "accuracy_per_fold": [round(float(x), 4) for x in acc],
        "f1_weighted_per_fold": [round(float(x), 4) for x in f1w],
    }


def baseline_cv(X, y, groups):
    """Base de referencia: predecir siempre la clase mayoritaria."""
    skf = StratifiedGroupKFold(n_splits=N_SPLITS, shuffle=True, random_state=RANDOM_STATE)
    acc, f1w = [], []
    for tr, te in skf.split(X, y, groups=groups):
        dummy = DummyClassifier(strategy="most_frequent")
        dummy.fit(X.iloc[tr], y[tr])
        y_hat = dummy.predict(X.iloc[te])
        acc.append(accuracy_score(y[te], y_hat))
        f1w.append(f1_score(y[te], y_hat, average="weighted", zero_division=0))
    return {
        "accuracy_mean": float(np.mean(acc)),
        "f1_weighted_mean": float(np.mean(f1w)),
    }


def main():
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    artifacts_dir = Path(os.getenv("ARTIFACTS_DIR", "/data/artifacts")) / "classifier"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    mart_path = processed_dir / "mart_clean.parquet"
    if not mart_path.exists():
        raise SystemExit("No existe mart_clean.parquet. Ejecuta job 06 primero.")

    df = pd.read_parquet(mart_path)
    df = df[df["final_result"].isin(VALID_OUTCOMES)].copy()
    print(f"Job 08 | filas con outcome válido: {len(df)}")
    print("Job 08 | distribución:\n", df["final_result"].value_counts().to_string())

    for col in FEATURES:
        if col not in df.columns:
            df[col] = 0

    X = df[FEATURES].fillna(0).astype("float64").reset_index(drop=True)

    # Grupo = estudiante dentro de su curso (evita fuga entre semanas del mismo alumno)
    groups = (df["course_id"].astype(str) + "_" + df["user_id"].astype(str)).to_numpy()

    # ── 1) Modelo multiclase ────────────────────────────────────────────────
    le = LabelEncoder()
    y = le.fit_transform(df["final_result"])
    classes = list(le.classes_)
    print(f"Job 08 | clases: {list(zip(range(len(classes)), classes))}")

    print("\nJob 08 | base de referencia (clase mayoritaria)...")
    base = baseline_cv(X, y, groups)
    print(f"   baseline acc={base['accuracy_mean']:.4f}  f1_weighted={base['f1_weighted_mean']:.4f}")

    print("\nJob 08 | CV agrupada por estudiante (multiclase, balanceada)...")
    cv_multi = grouped_cv(X, y, groups, balanced=True)
    print(f"   MEDIA acc={cv_multi['accuracy_mean']:.4f}±{cv_multi['accuracy_std']:.4f}  "
          f"f1_weighted={cv_multi['f1_weighted_mean']:.4f}  f1_macro={cv_multi['f1_macro_mean']:.4f}")

    # ── 2) Variante binaria (riesgo vs no riesgo) ───────────────────────────
    y_bin = df["final_result"].isin(RISK_OUTCOMES).astype(int).to_numpy()
    print("\nJob 08 | CV agrupada por estudiante (binaria riesgo/no riesgo, balanceada)...")
    cv_bin = grouped_cv(X, y_bin, groups, balanced=True)
    print(f"   MEDIA acc={cv_bin['accuracy_mean']:.4f}  f1_weighted={cv_bin['f1_weighted_mean']:.4f}  "
          f"f1_macro={cv_bin['f1_macro_mean']:.4f}")

    # ── 3) Modelo final servido (multiclase, balanceado, sobre todos los datos) ──
    print("\nJob 08 | entrenando modelo final (multiclase, balanceado)...")
    final_model = _new_model()
    sw_all = compute_sample_weight(class_weight="balanced", y=y)
    final_model.fit(X, y, sample_weight=sw_all)

    # Informe sobre datos completos: SOLO informativo (optimista por sobreajuste)
    y_pred_full = final_model.predict(X)
    report_full = classification_report(y, y_pred_full, target_names=classes,
                                        output_dict=True, zero_division=0)

    feature_importances = dict(sorted(
        {f: round(float(i), 6) for f, i in zip(FEATURES, final_model.feature_importances_)}.items(),
        key=lambda x: x[1], reverse=True,
    ))

    joblib.dump(final_model, artifacts_dir / "classifier.joblib")
    joblib.dump(le, artifacts_dir / "label_encoder.joblib")

    meta = {
        "model_type": "GradientBoostingClassifier",
        "evaluation": "StratifiedGroupKFold (agrupado por estudiante), 5 particiones",
        "class_weight": "balanced (sample_weight)",
        "features": FEATURES,
        "classes": classes,
        "n_samples": int(len(df)),
        "cv_accuracy": round(cv_multi["accuracy_mean"], 4),
        "cv_f1_weighted": round(cv_multi["f1_weighted_mean"], 4),
        "cv_accuracy_per_fold": cv_multi["accuracy_per_fold"],
        "cv_f1_per_fold": cv_multi["f1_weighted_per_fold"],
        "class_distribution": {k: int(v) for k, v in df["final_result"].value_counts().items()},
        # --- métricas que DEBEN reportarse en la memoria ---
        "cv_grouped_multiclass": cv_multi,
        "baseline_majority_class": base,
        "cv_grouped_binary_risk": cv_bin,
        "feature_importances": feature_importances,
        # --- informativo, no usar como evaluación (optimista) ---
        "full_data_report": report_full,
        "full_data_report_optimistic": report_full,
    }
    (artifacts_dir / "classifier_meta.json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"\nJob 08 | artifacts guardados en: {artifacts_dir}")
    print("Job 08 | OK")


if __name__ == "__main__":
    main()
