from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from ..db import get_session
from ..services.mart_store import load_mart, reload_mart
from ..services.risk_config_store import get_active_risk_config
from ..services.classifier_store import is_classifier_available, predict_outcomes, get_classifier_meta

router = APIRouter(prefix="/analytics")


@router.post("/reload")
def reload_mart_cache():
    result = reload_mart()
    return {"status": "ok", **result}

@router.get("/courses/{course_id}/profiles")
def profiles_by_course(course_id: str):
    from ..services.mart_store import query_mart

    cluster_counts = query_mart(
        "SELECT cluster, COUNT(DISTINCT user_id) AS students "
        "FROM mart WHERE course_id = ? "
        "GROUP BY cluster ORDER BY students DESC",
        [course_id],
    )

    if cluster_counts.empty:
        return {"course_id": course_id, "profiles": [], "note": "course_id no encontrado"}

    outcome = query_mart(
        "SELECT cluster, final_result, COUNT(DISTINCT user_id) AS students "
        "FROM mart WHERE course_id = ? "
        "GROUP BY cluster, final_result ORDER BY cluster, students DESC",
        [course_id],
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

    for col in [
        "assessment_events",
        "has_submission_week",
        "weeks_active_ratio",
        "clicks_delta_prev_week",
        "resource_diversity_delta",
    ]:
        if col not in d.columns:
            d[col] = 0

    cols = [
        "week_id",
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
        "final_result",
    ]
    traj = d[cols].to_dict(orient="records")
    return {"course_id": course_id, "user_id": user_id, "trajectory": traj}


@router.get("/courses/{course_id}/alerts")
def alerts(
    course_id: str,
    week_id: int = Query(...),
    top: int = Query(20, ge=1, le=200),
    user_id: int | None = Query(default=None, ge=1),
    session: Session = Depends(get_session),
):
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

    for col in [
        "assessment_events",
        "has_submission_week",
        "weeks_active_ratio",
        "clicks_delta_prev_week",
        "resource_diversity_delta",
    ]:
        if col not in cur.columns:
            cur[col] = 0

    # score 0..1
    cfg = get_active_risk_config(session)
    cur["risk_score"] = (
            cfg["w_drop_clicks"] * cur["drop_clicks_pct"]
            + cfg["w_low_clicks"] * cur["low_clicks"]
            + cfg["w_low_events"] * cur["low_events"]
            + cfg["w_low_resources"] * cur["low_resources"]
    ).clip(0.0, 1.0)

    # Vectorized reason building (avoids row-level Python apply loop)
    drop_threshold = cfg["drop_threshold"]
    r_no_assess   = cur["assessment_events"].fillna(0) == 0
    r_submit_low  = (cur["has_submission_week"].fillna(0) == 1) & (cur["low_clicks"] == 1)
    r_click_drop  = (cur["clicks_delta_prev_week"].fillna(0) < 0) & (cur["has_prev"] == 1)
    r_div_drop    = cur["resource_diversity_delta"].fillna(0) < 0
    r_drop_pct    = cur["drop_clicks_pct"] >= drop_threshold
    r_low_clicks  = cur["low_clicks"] == 1
    r_low_events  = cur["low_events"] == 1
    r_low_res     = cur["low_resources"] == 1

    drop_pct_vals = (cur["drop_clicks_pct"] * 100).round(0).astype(int).astype(str)

    def _build_reasons(idx):
        reasons = []
        if r_no_assess.at[idx]:
            reasons.append("Sin actividad de evaluación esta semana")
        if r_submit_low.at[idx]:
            reasons.append("Semana con entrega con baja interacción")
        if r_click_drop.at[idx]:
            reasons.append("Caída de clicks frente a la semana previa")
        if r_div_drop.at[idx]:
            reasons.append("Menor diversidad de recursos")
        if r_drop_pct.at[idx]:
            reasons.append(f"Caída de clicks vs semana anterior ({drop_pct_vals.at[idx]}%)")
        if r_low_clicks.at[idx]:
            reasons.append("Clicks en el 25% más bajo del curso")
        if r_low_events.at[idx]:
            reasons.append("Eventos en el 25% más bajo del curso")
        if r_low_res.at[idx]:
            reasons.append("Recursos en el 25% más bajo del curso")
        if not reasons:
            reasons.append("Actividad baja relativa")
        return reasons[:4]

    cur["reasons"] = [_build_reasons(i) for i in cur.index]

    if user_id is not None:
        cur = cur[cur["user_id"] == user_id].copy()
        if cur.empty:
            return {
                "course_id": course_id,
                "week_id": week_id,
                "alerts": [],
                "note": "user_id no encontrado",
            }
    else:
        cur = cur.sort_values("risk_score", ascending=False).head(top)

    cur["p25_clicks"] = p25_clicks
    cur["p25_events"] = p25_events
    cur["p25_resources"] = p25_resources
    cur["prev_week"] = cur["week_id"] - 1

    # Predicción ML (opcional — solo si el modelo está entrenado)
    if is_classifier_available():
        try:
            pred_rows = cur[
                [c for c in [
                    "clicks_total", "resources_touched", "resource_types_touched",
                    "events_count", "assessment_events", "has_submission_week",
                    "weeks_active_ratio", "clicks_delta_prev_week", "resource_diversity_delta",
                    "cluster", "week_id",
                ] if c in cur.columns]
            ].fillna(0).to_dict(orient="records")
            predictions = predict_outcomes(pred_rows)
            cur["pred_label"] = [p["pred_label"] for p in predictions]
            cur["pred_confidence"] = [p["pred_confidence"] for p in predictions]
            cur["pred_proba"] = [p["pred_proba"] for p in predictions]
        except Exception:
            cur["pred_label"] = None
            cur["pred_confidence"] = None
            cur["pred_proba"] = None

    base_cols = [
        "user_id", "week_id", "clicks_total", "resources_touched", "events_count",
        "assessment_events", "has_submission_week", "weeks_active_ratio",
        "clicks_delta_prev_week", "resource_diversity_delta",
        "cluster", "final_result", "risk_score", "reasons",
        "drop_clicks_pct", "prev_clicks", "prev_events", "prev_resources",
        "p25_clicks", "p25_events", "p25_resources",
        "low_clicks", "low_events", "low_resources", "has_prev", "prev_week",
    ]
    pred_cols = [c for c in ["pred_label", "pred_confidence", "pred_proba"] if c in cur.columns]
    alerts_out = cur[base_cols + pred_cols].to_dict(orient="records")

    return {"course_id": course_id, "week_id": week_id, "alerts": alerts_out}

@router.get("/courses/{course_id}/cohorts")
def cohorts_timeseries(
        course_id: str,
        metric: str = Query("clicks_total"),
        week_min: int | None = Query(default=None, ge=0),
        week_max: int | None = Query(default=None, ge=0),
):
    from ..services.mart_store import query_mart

    allowed = {"clicks_total", "resources_touched", "events_count"}
    if metric not in allowed:
        return {"course_id": course_id, "metric": metric, "series": [], "note": "métrica no permitida"}

    col = metric  # safe: validated against allowlist above
    wmin = week_min if week_min is not None else 0
    wmax_clause = "AND week_id <= ?" if week_max is not None else ""
    params: list = [course_id, wmin]
    if week_max is not None:
        params.append(week_max)

    g = query_mart(
        f"SELECT week_id, cluster, AVG({col}) AS value, COUNT(DISTINCT user_id) AS n "
        f"FROM mart WHERE course_id = ? AND week_id >= ? {wmax_clause} "
        f"GROUP BY week_id, cluster ORDER BY week_id, cluster",
        params,
    )

    if g.empty:
        return {"course_id": course_id, "metric": metric, "series": [], "note": "sin datos en el rango"}

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
    from ..services.mart_store import query_mart

    cluster_clause = "AND cluster = ?" if cluster is not None else ""
    params: list = [course_id]
    if cluster is not None:
        params.append(cluster)

    baseline = query_mart(
        f"SELECT week_id, AVG(clicks_total) AS clicks_mean, "
        f"AVG(resources_touched) AS resources_mean, AVG(events_count) AS events_mean "
        f"FROM mart WHERE course_id = ? AND week_id >= 0 {cluster_clause} "
        f"GROUP BY week_id ORDER BY week_id",
        params,
    )

    if baseline.empty:
        return {"course_id": course_id, "cluster": cluster, "baseline": [], "note": "sin datos"}

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

@router.get("/classifier/meta")
def classifier_meta():
    """Devuelve métricas de evaluación del modelo predictivo (accuracy, F1, feature importances)."""
    if not is_classifier_available():
        return {"available": False, "note": "Modelo no entrenado. Ejecuta el job 08 del pipeline."}
    try:
        meta = get_classifier_meta()
        return {"available": True, **meta}
    except Exception as e:
        return {"available": False, "note": str(e)}


@router.get("/courses/{course_id}/cluster-outcomes")
def cluster_outcomes(course_id: str):
    """
    Devuelve la relación cluster vs resultado final en conteos y tasa.

    Importante:
    - Se calcula a nivel estudiante-curso (una fila por estudiante),
      para evitar duplicaciones por semana.
    """
    from ..services.mart_store import query_mart

    # Última semana por estudiante, luego agrupa
    merged = query_mart(
        """
        WITH last_week AS (
            SELECT course_id, user_id,
                   LAST_VALUE(cluster)       OVER w AS cluster,
                   LAST_VALUE(final_result)  OVER w AS final_result
            FROM mart
            WHERE course_id = ?
            WINDOW w AS (PARTITION BY course_id, user_id ORDER BY week_id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
            QUALIFY ROW_NUMBER() OVER (PARTITION BY course_id, user_id ORDER BY week_id DESC) = 1
        ),
        counts AS (
            SELECT cluster, final_result, COUNT(DISTINCT user_id) AS students
            FROM last_week GROUP BY cluster, final_result
        ),
        totals AS (
            SELECT cluster, COUNT(DISTINCT user_id) AS total_students
            FROM last_week GROUP BY cluster
        )
        SELECT c.cluster, c.final_result, c.students, t.total_students,
               ROUND(c.students::DOUBLE / t.total_students, 4) AS rate
        FROM counts c JOIN totals t ON c.cluster = t.cluster
        ORDER BY c.cluster, c.students DESC
        """,
        [course_id],
    )

    if merged.empty:
        return {"course_id": course_id, "clusters": [], "note": "course_id no encontrado"}

    return {"course_id": course_id, "clusters": merged.to_dict(orient="records")}

@router.get("/courses/{course_id}/weeks")
def course_weeks(course_id: str):
    from ..services.mart_store import query_mart

    result = query_mart(
        "SELECT week_id FROM mart WHERE course_id = ? AND week_id >= 0 "
        "GROUP BY week_id ORDER BY week_id",
        [course_id],
    )

    if result.empty:
        return {
            "course_id": course_id,
            "week_min": 0,
            "week_max": 0,
            "weeks": [],
            "note": "course_id no encontrado",
        }

    weeks = [int(w) for w in result["week_id"].tolist()]
    return {
        "course_id": course_id,
        "week_min": weeks[0],
        "week_max": weeks[-1],
        "weeks": weeks,
    }


@router.get("/courses/{course_id}/students")
def course_students(course_id: str):
    """Lista de estudiantes únicos del curso con su cluster y resultado final (última semana)."""
    from ..services.mart_store import query_mart

    result = query_mart(
        """
        SELECT user_id, cluster, final_result
        FROM mart
        WHERE course_id = ?
        QUALIFY ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY week_id DESC) = 1
        ORDER BY user_id
        """,
        [course_id],
    )

    if result.empty:
        return {"course_id": course_id, "students": [], "note": "course_id no encontrado"}

    return {
        "course_id": course_id,
        "students": result.to_dict(orient="records"),
    }


@router.get("/courses/{course_id}/overview")
def course_overview(course_id: str):
    """
    KPIs y distribuciones agregadas de un curso para la página de vista general.
    Todos los cálculos en DuckDB sobre el mart cacheado.
    """
    from ..services.mart_store import query_mart

    # ── KPIs globales ────────────────────────────────────────────────────────
    kpis = query_mart(
        """
        WITH per_student AS (
            SELECT user_id,
                   LAST_VALUE(cluster)      OVER w AS cluster,
                   LAST_VALUE(final_result) OVER w AS final_result
            FROM mart
            WHERE course_id = ?
            WINDOW w AS (PARTITION BY user_id ORDER BY week_id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
            QUALIFY ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY week_id DESC) = 1
        )
        SELECT
            COUNT(DISTINCT ps.user_id)                                          AS total_students,
            COUNT(DISTINCT m.week_id)                                           AS total_weeks,
            MIN(m.week_id)                                                      AS week_min,
            MAX(m.week_id)                                                      AS week_max,
            ROUND(AVG(m.clicks_total), 1)                                       AS avg_clicks_per_student_week,
            COUNT(DISTINCT CASE WHEN ps.final_result IN ('Fail','Withdrawn')
                                THEN ps.user_id END)                            AS at_risk_count
        FROM mart m
        JOIN per_student ps ON m.user_id = ps.user_id
        WHERE m.course_id = ?
        """,
        [course_id, course_id],
    )

    if kpis.empty or kpis["total_students"].iloc[0] == 0:
        return {"course_id": course_id, "note": "course_id no encontrado"}

    row = kpis.iloc[0]

    # ── Semana más activa ────────────────────────────────────────────────────
    most_active = query_mart(
        """
        SELECT week_id, SUM(clicks_total) AS total_clicks
        FROM mart WHERE course_id = ?
        GROUP BY week_id
        ORDER BY total_clicks DESC
        LIMIT 1
        """,
        [course_id],
    )
    most_active_week = int(most_active["week_id"].iloc[0]) if not most_active.empty else None
    most_active_clicks = int(most_active["total_clicks"].iloc[0]) if not most_active.empty else 0

    # ── Distribución de resultados finales (por estudiante) ──────────────────
    results_dist = query_mart(
        """
        WITH per_student AS (
            SELECT user_id, LAST_VALUE(final_result) OVER w AS final_result
            FROM mart
            WHERE course_id = ?
            WINDOW w AS (PARTITION BY user_id ORDER BY week_id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
            QUALIFY ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY week_id DESC) = 1
        )
        SELECT final_result, COUNT(*) AS students
        FROM per_student
        GROUP BY final_result
        ORDER BY students DESC
        """,
        [course_id],
    )

    # ── Distribución de clusters (por estudiante) ────────────────────────────
    cluster_dist = query_mart(
        """
        WITH per_student AS (
            SELECT user_id, LAST_VALUE(cluster) OVER w AS cluster
            FROM mart
            WHERE course_id = ?
            WINDOW w AS (PARTITION BY user_id ORDER BY week_id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
            QUALIFY ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY week_id DESC) = 1
        )
        SELECT cluster, COUNT(*) AS students
        FROM per_student
        GROUP BY cluster
        ORDER BY cluster
        """,
        [course_id],
    )

    # ── Actividad semanal (clicks totales del curso) ─────────────────────────
    weekly_activity = query_mart(
        """
        SELECT week_id,
               SUM(clicks_total)      AS clicks_total,
               SUM(events_count)      AS events_total,
               COUNT(DISTINCT user_id) AS active_students
        FROM mart
        WHERE course_id = ? AND week_id >= 0
        GROUP BY week_id
        ORDER BY week_id
        """,
        [course_id],
    )

    return {
        "course_id": course_id,
        "kpis": {
            "total_students":           int(row["total_students"]),
            "total_weeks":              int(row["total_weeks"]),
            "week_min":                 int(row["week_min"]),
            "week_max":                 int(row["week_max"]),
            "avg_clicks_per_student_week": float(row["avg_clicks_per_student_week"]),
            "at_risk_count":            int(row["at_risk_count"]),
            "most_active_week":         most_active_week,
            "most_active_week_clicks":  most_active_clicks,
        },
        "results_dist":   results_dist.to_dict(orient="records"),
        "cluster_dist":   cluster_dist.to_dict(orient="records"),
        "weekly_activity": weekly_activity.to_dict(orient="records"),
    }
