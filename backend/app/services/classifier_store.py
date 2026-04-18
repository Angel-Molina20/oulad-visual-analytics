import json
from functools import lru_cache
from pathlib import Path
import os

import joblib
import numpy as np
import pandas as pd


CLASSIFIER_FEATURES = [
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


def _artifacts_dir() -> Path:
    return Path(os.getenv("ARTIFACTS_DIR", "/data/artifacts")) / "classifier"


@lru_cache(maxsize=1)
def _load_classifier():
    d = _artifacts_dir()
    model = joblib.load(d / "classifier.joblib")
    le = joblib.load(d / "label_encoder.joblib")
    with open(d / "classifier_meta.json", encoding="utf-8") as f:
        meta = json.load(f)
    return model, le, meta


def is_classifier_available() -> bool:
    d = _artifacts_dir()
    return (d / "classifier.joblib").exists() and (d / "label_encoder.joblib").exists()


def predict_outcomes(rows: list[dict]) -> list[dict]:
    """
    Given a list of feature dicts, returns a list of prediction dicts with:
      - pred_label: most likely outcome (str)
      - pred_proba: dict of outcome -> probability
      - pred_confidence: probability of the top class (float)
    """
    if not rows:
        return []

    model, le, _ = _load_classifier()

    df = pd.DataFrame(rows)
    for col in CLASSIFIER_FEATURES:
        if col not in df.columns:
            df[col] = 0

    X = df[CLASSIFIER_FEATURES].fillna(0).astype("float64")
    probas = model.predict_proba(X)
    classes = le.classes_

    results = []
    for proba in probas:
        pred_idx = int(np.argmax(proba))
        pred_label = str(classes[pred_idx])
        pred_proba = {str(cls): round(float(p), 4) for cls, p in zip(classes, proba)}
        results.append({
            "pred_label": pred_label,
            "pred_proba": pred_proba,
            "pred_confidence": round(float(proba[pred_idx]), 4),
        })

    return results


def get_classifier_meta() -> dict:
    _, _, meta = _load_classifier()
    return meta
