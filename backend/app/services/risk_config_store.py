from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import RiskConfig

DEFAULT_RISK_CONFIG = {
    "name": "default",
    "w_drop_clicks": 0.55,
    "w_low_clicks": 0.20,
    "w_low_events": 0.15,
    "w_low_resources": 0.10,
    "drop_threshold": 0.30,
}


def get_active_risk_config(session: Session) -> dict:
    stmt = select(RiskConfig).where(RiskConfig.active.is_(True)).order_by(RiskConfig.created_at.desc())
    row = session.execute(stmt).scalars().first()
    if not row:
        return DEFAULT_RISK_CONFIG
    return {
        "name": row.name,
        "w_drop_clicks": row.w_drop_clicks,
        "w_low_clicks": row.w_low_clicks,
        "w_low_events": row.w_low_events,
        "w_low_resources": row.w_low_resources,
        "drop_threshold": row.drop_threshold,
    }

