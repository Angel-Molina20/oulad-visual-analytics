from fastapi import APIRouter, Query
from pathlib import Path
import os, json
import pandas as pd

from app.services.mart_store import load_mart

router = APIRouter(prefix="/meta")


@router.get("/cluster-labels")
def cluster_labels(course_id: str | None = Query(default=None)):
    artifacts_dir = Path(os.getenv("ARTIFACTS_DIR", "/data/artifacts")) / "clustering"
    path = artifacts_dir / "cluster_labels.json"
    if not path.exists():
        return {"clusters": [], "note": "No existe cluster_labels.json. Ejecuta job 07."}

    base_labels = json.loads(path.read_text(encoding="utf-8"))

    # Si no hay course_id, devuelve global tal cual
    if not course_id:
        return {"clusters": base_labels}

    # Si hay course_id, recalcula métricas por curso
    df = load_mart()
    d = df[df["course_id"] == course_id].copy()
    d = d[d["week_id"] >= 0]

    if d.empty:
        return {"clusters": base_labels, "note": "course_id sin datos, devolviendo global"}

    # 1 fila por estudiante-curso para outcome
    base = (
        d.sort_values("week_id")
        .groupby(["course_id", "user_id"], as_index=False)
        .last()[["course_id", "user_id", "cluster", "final_result"]]
    )

    totals = base.groupby("cluster")["user_id"].nunique().rename("total_students").to_dict()

    def rate(cluster: int, final_result: str) -> float:
        t = totals.get(cluster, 0)
        if t == 0:
            return 0.0
        n = base[(base["cluster"] == cluster) & (base["final_result"] == final_result)]["user_id"].nunique()
        return float(n) / float(t)

    # Métricas de actividad por cluster dentro del curso
    feats = ["clicks_total", "resources_touched", "resource_types_touched", "events_count"]
    act = d.groupby("cluster")[feats].mean().reset_index()

    act_map = {
        int(r["cluster"]): {
            "clicks_mean": float(r["clicks_total"]),
            "resources_mean": float(r["resources_touched"]),
            "resource_types_mean": float(r["resource_types_touched"]),
            "events_mean": float(r["events_count"]),
        }
        for _, r in act.iterrows()
    }

    # Enriquecer el JSON global con métricas del curso
    out = []
    for item in base_labels:
        c = int(item["cluster"])
        out.append(
            {
                **item,
                "course_id": course_id,
                "total_students_course": int(totals.get(c, 0)),
                "clicks_mean_course": act_map.get(c, {}).get("clicks_mean", 0.0),
                "resources_mean_course": act_map.get(c, {}).get("resources_mean", 0.0),
                "events_mean_course": act_map.get(c, {}).get("events_mean", 0.0),
                "resource_types_mean_course": act_map.get(c, {}).get("resource_types_mean", 0.0),
                "rate_pass_course": rate(c, "Pass"),
                "rate_fail_course": rate(c, "Fail"),
                "rate_withdrawn_course": rate(c, "Withdrawn"),
                "rate_distinction_course": rate(c, "Distinction"),
            }
        )

    return {"clusters": out}