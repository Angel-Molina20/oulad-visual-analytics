from fastapi import APIRouter, Query
from ..services.mart_store import load_mart

router = APIRouter(prefix="/analytics")

@router.get("/courses/{course_id}/profiles")
def profiles_by_course(course_id: str):
    df = load_mart()
    d = df[df["course_id"] == course_id].copy()

    if d.empty:
        return {"course_id": course_id, "profiles": [], "note": "course_id no encontrado"}

    # distribución de clusters por curso
    cluster_counts = (
        d.groupby("cluster")["user_id"]
        .nunique()
        .reset_index(name="students")
        .sort_values("students", ascending=False)
    )

    # relación cluster vs resultado final
    outcome = (
        d.groupby(["cluster", "final_result"])["user_id"]
        .nunique()
        .reset_index(name="students")
        .sort_values(["cluster", "students"], ascending=[True, False])
    )

    return {
        "course_id": course_id,
        "profiles": cluster_counts.to_dict(orient="records"),
        "outcomes": outcome.to_dict(orient="records"),
    }


@router.get("/students/{user_id}/trajectory")
def student_trajectory(user_id: int, course_id: str = Query(...)):
    df = load_mart()
    d = df[(df["course_id"] == course_id) & (df["user_id"] == user_id)].copy()

    if d.empty:
        return {"course_id": course_id, "user_id": user_id, "trajectory": [], "note": "sin datos"}

    d = d.sort_values("week_id")

    cols = [
        "week_id",
        "clicks_total",
        "resources_touched",
        "resource_types_touched",
        "events_count",
        "cluster",
        "final_result",
    ]
    traj = d[cols].to_dict(orient="records")
    return {"course_id": course_id, "user_id": user_id, "trajectory": traj}


@router.get("/courses/{course_id}/alerts")
def alerts(course_id: str, week_id: int = Query(...), top: int = Query(20, ge=1, le=200)):
    """
    Alertas simples: estudiantes con actividad baja en una semana.
    Regla inicial: clicks_total y resources_touched bajos.
    """
    df = load_mart()
    d = df[(df["course_id"] == course_id) & (df["week_id"] == week_id)].copy()

    if d.empty:
        return {"course_id": course_id, "week_id": week_id, "alerts": [], "note": "sin datos"}

    # score simple de riesgo, menor actividad = más riesgo
    d["risk_score"] = (
            (d["clicks_total"].rank(method="average", ascending=True))
            + (d["resources_touched"].rank(method="average", ascending=True))
            + (d["events_count"].rank(method="average", ascending=True))
    )

    d = d.sort_values("risk_score", ascending=False).head(top)

    alerts_out = d[
        ["user_id", "week_id", "clicks_total", "resources_touched", "events_count", "cluster", "final_result", "risk_score"]
    ].to_dict(orient="records")

    return {"course_id": course_id, "week_id": week_id, "alerts": alerts_out}

@router.get("/courses/{course_id}/cluster-outcomes")
def cluster_outcomes(course_id: str):
    """
    Devuelve la relación cluster vs resultado final en conteos y tasa.

    Importante:
    - Se calcula a nivel estudiante-curso (una fila por estudiante),
      para evitar duplicaciones por semana.
    """
    df = load_mart()
    d = df[df["course_id"] == course_id].copy()

    if d.empty:
        return {"course_id": course_id, "clusters": [], "note": "course_id no encontrado"}

    # Una fila por estudiante (tomamos la última semana disponible)
    base = (
        d.sort_values("week_id")
        .groupby(["course_id", "user_id"], as_index=False)
        .last()[["course_id", "user_id", "cluster", "final_result"]]
    )

    counts = (
        base.groupby(["cluster", "final_result"])["user_id"]
        .nunique()
        .reset_index(name="students")
    )

    totals = (
        base.groupby("cluster")["user_id"]
        .nunique()
        .reset_index(name="total_students")
    )

    merged = counts.merge(totals, on="cluster", how="left")
    merged["rate"] = (merged["students"] / merged["total_students"]).round(4)

    return {"course_id": course_id, "clusters": merged.to_dict(orient="records")}