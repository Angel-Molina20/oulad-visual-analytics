from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from ..db import get_session
from ..services.mart_store import load_mart
from ..services.risk_config_store import get_active_risk_config

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
def alerts(course_id: str, week_id: int = Query(...), top: int = Query(20, ge=1, le=200), session: Session = Depends(get_session)):
    df = load_mart()
    d = df[df["course_id"] == course_id].copy()

    if d.empty:
        return {"course_id": course_id, "week_id": week_id, "alerts": [], "note": "course_id no encontrado"}

    cur = d[d["week_id"] == week_id].copy()
    prev = d[d["week_id"] == (week_id - 1)].copy()

    if cur.empty:
        return {"course_id": course_id, "week_id": week_id, "alerts": [], "note": "sin datos para esa semana"}

    prev = prev[["user_id", "clicks_total", "events_count", "resources_touched"]].rename(
        columns={
            "clicks_total": "prev_clicks",
            "events_count": "prev_events",
            "resources_touched": "prev_resources",
        }
    )

    cur = cur.merge(prev, on="user_id", how="left")

    # flag de semana anterior real
    cur["has_prev"] = cur["prev_clicks"].notna().astype(int)

    # rellena para evitar NaN en totales
    cur["prev_clicks"] = cur["prev_clicks"].fillna(cur["clicks_total"])
    cur["prev_events"] = cur["prev_events"].fillna(cur["events_count"])
    cur["prev_resources"] = cur["prev_resources"].fillna(cur["resources_touched"])

    # drop solo si existe semana anterior
    cur["drop_clicks_pct"] = 0.0
    mask = (cur["has_prev"] == 1) & (cur["prev_clicks"] > 0)
    cur.loc[mask, "drop_clicks_pct"] = (
            (cur.loc[mask, "prev_clicks"] - cur.loc[mask, "clicks_total"]) / cur.loc[mask, "prev_clicks"]
    )
    cur["drop_clicks_pct"] = cur["drop_clicks_pct"].clip(lower=0.0, upper=1.0)

    # percentiles del curso en esa semana
    p25_clicks = float(cur["clicks_total"].quantile(0.25))
    p25_events = float(cur["events_count"].quantile(0.25))
    p25_resources = float(cur["resources_touched"].quantile(0.25))

    cur["low_clicks"] = (cur["clicks_total"] <= p25_clicks).astype(int)
    cur["low_events"] = (cur["events_count"] <= p25_events).astype(int)
    cur["low_resources"] = (cur["resources_touched"] <= p25_resources).astype(int)

    # score 0..1
    cfg = get_active_risk_config(session)
    cur["risk_score"] = (
            cfg["w_drop_clicks"] * cur["drop_clicks_pct"]
            + cfg["w_low_clicks"] * cur["low_clicks"]
            + cfg["w_low_events"] * cur["low_events"]
            + cfg["w_low_resources"] * cur["low_resources"]
    ).clip(0.0, 1.0)

    def reasons_row(r):
        reasons = []
        if r["drop_clicks_pct"] >= cfg["drop_threshold"]:
            reasons.append(f"Caída de clicks vs semana anterior ({r['drop_clicks_pct']*100:.0f}%)")
        if r["low_clicks"] == 1:
            reasons.append("Clicks en el 25% más bajo del curso")
        if r["low_events"] == 1:
            reasons.append("Eventos en el 25% más bajo del curso")
        if r["low_resources"] == 1:
            reasons.append("Recursos en el 25% más bajo del curso")
        if not reasons:
            reasons.append("Actividad baja relativa")
        return reasons[:3]

    cur["reasons"] = cur.apply(reasons_row, axis=1)

    cur = cur.sort_values("risk_score", ascending=False).head(top)
    cur["p25_clicks"] = p25_clicks
    cur["p25_events"] = p25_events
    cur["p25_resources"] = p25_resources
    cur["prev_week"] = cur["week_id"] - 1

    alerts_out = cur[
        [
            "user_id",
            "week_id",
            "clicks_total",
            "resources_touched",
            "events_count",
            "cluster",
            "final_result",
            "risk_score",
            "reasons",
            "drop_clicks_pct",
            "prev_clicks",
            "prev_events",
            "prev_resources",
            "p25_clicks",
            "p25_events",
            "p25_resources",
            "low_clicks",
            "low_events",
            "low_resources",
            "has_prev",
            "prev_week",
        ]
    ].to_dict(orient="records")

    return {"course_id": course_id, "week_id": week_id, "alerts": alerts_out}

@router.get("/courses/{course_id}/cohorts")
def cohorts_timeseries(
        course_id: str,
        metric: str = Query("clicks_total"),
        week_min: int | None = Query(default=None, ge=0),
        week_max: int | None = Query(default=None, ge=0),
):
    df = load_mart()
    d = df[df["course_id"] == course_id].copy()
    d = d[d["week_id"] >= 0]

    allowed = {
        "clicks_total": "clicks_total",
        "resources_touched": "resources_touched",
        "events_count": "events_count",
    }
    if metric not in allowed:
        return {"course_id": course_id, "metric": metric, "series": [], "note": "métrica no permitida"}

    if week_min is not None:
        d = d[d["week_id"] >= week_min]
    if week_max is not None:
        d = d[d["week_id"] <= week_max]

    if d.empty:
        return {"course_id": course_id, "metric": metric, "series": [], "note": "sin datos en el rango"}

    col = allowed[metric]
    g = (
        d.groupby(["week_id", "cluster"], as_index=False)
        .agg(value=(col, "mean"), n=("user_id", "nunique"))
        .sort_values(["week_id", "cluster"])
    )

    return {
        "course_id": course_id,
        "metric": metric,
        "week_min": week_min,
        "week_max": week_max,
        "series": g.to_dict(orient="records"),
    }


@router.get("/courses/{course_id}/baseline")
def course_baseline(
        course_id: str,
        cluster: int | None = Query(default=None),
):
    """
    Promedio semanal del curso.
    Si cluster viene, promedio semanal solo de ese cluster dentro del curso.
    """
    df = load_mart()
    d = df[df["course_id"] == course_id].copy()

    if "week_id" in d.columns:
        d = d[d["week_id"] >= 0]

    if cluster is not None:
        d = d[d["cluster"] == cluster]

    if d.empty:
        return {"course_id": course_id, "cluster": cluster, "baseline": [], "note": "sin datos"}

    baseline = (
        d.groupby("week_id", as_index=False)
        .agg(
            clicks_mean=("clicks_total", "mean"),
            resources_mean=("resources_touched", "mean"),
            events_mean=("events_count", "mean"),
        )
        .sort_values("week_id")
    )

    return {
        "course_id": course_id,
        "cluster": cluster,
        "baseline": baseline.to_dict(orient="records"),
    }

@router.get("/courses/{course_id}/student-week")
def student_week(course_id: str, week_id: int = Query(...), user_id: int = Query(...)):
    df = load_mart()
    d = df[(df["course_id"] == course_id) & (df["week_id"] == week_id) & (df["user_id"] == user_id)].copy()
    if d.empty:
        return {"course_id": course_id, "week_id": week_id, "user_id": user_id, "row": None}

    row = d.iloc[0].to_dict()
    # Si quieres, aquí también calculas reasons usando la misma lógica del /alerts
    return {"course_id": course_id, "week_id": week_id, "user_id": user_id, "row": row}

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
