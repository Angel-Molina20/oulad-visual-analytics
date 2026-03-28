from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, update, desc
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import AlertFeedback, AuditEvent, RiskConfig

router = APIRouter(prefix="/ops")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AlertFeedbackIn(BaseModel):
    course_id: str
    week_id: int
    user_id: int
    risk_score: float | None = None
    status: Literal["open", "resolved"] = "open"
    note: str | None = None


class AlertFeedbackOut(AlertFeedbackIn, ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime | None = None


@router.get("/alerts/feedback", response_model=list[AlertFeedbackOut])
def list_alert_feedback(
    course_id: str | None = Query(default=None),
    week_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    user_id: int | None = Query(default=None),
    note_only: bool = Query(default=False),
    session: Session = Depends(get_session),
):
    stmt = select(AlertFeedback)
    if course_id:
        stmt = stmt.where(AlertFeedback.course_id == course_id)
    if week_id is not None:
        stmt = stmt.where(AlertFeedback.week_id == week_id)
    if status:
        stmt = stmt.where(AlertFeedback.status == status)
    if user_id is not None:
        stmt = stmt.where(AlertFeedback.user_id == user_id)
    if note_only:
        stmt = stmt.where(AlertFeedback.note.isnot(None), AlertFeedback.note != "")
    stmt = stmt.order_by(desc(AlertFeedback.updated_at), desc(AlertFeedback.created_at))
    rows = session.execute(stmt).scalars().all()
    return rows


@router.post("/alerts/feedback", response_model=AlertFeedbackOut)
def upsert_alert_feedback(payload: AlertFeedbackIn, session: Session = Depends(get_session)):
    stmt = select(AlertFeedback).where(
        AlertFeedback.course_id == payload.course_id,
        AlertFeedback.week_id == payload.week_id,
        AlertFeedback.user_id == payload.user_id,
    )
    row = session.execute(stmt).scalars().first()
    if row:
        row.status = payload.status
        row.note = payload.note
        row.risk_score = payload.risk_score
        row.updated_at = datetime.utcnow()
        session.commit()
        session.refresh(row)
        return row

    row = AlertFeedback(
        course_id=payload.course_id,
        week_id=payload.week_id,
        user_id=payload.user_id,
        risk_score=payload.risk_score,
        status=payload.status,
        note=payload.note,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


class RiskConfigIn(BaseModel):
    name: str = Field(default="manual")
    w_drop_clicks: float = Field(ge=0, le=1)
    w_low_clicks: float = Field(ge=0, le=1)
    w_low_events: float = Field(ge=0, le=1)
    w_low_resources: float = Field(ge=0, le=1)
    drop_threshold: float = Field(ge=0, le=1)


class RiskConfigOut(RiskConfigIn, ORMModel):
    id: int
    active: bool
    created_at: datetime


@router.get("/risk-config/active", response_model=RiskConfigOut | None)
def get_active_risk_config(session: Session = Depends(get_session)):
    stmt = select(RiskConfig).where(RiskConfig.active.is_(True)).order_by(RiskConfig.created_at.desc())
    row = session.execute(stmt).scalars().first()
    return row


@router.post("/risk-config", response_model=RiskConfigOut)
def create_risk_config(payload: RiskConfigIn, session: Session = Depends(get_session)):
    session.execute(update(RiskConfig).values(active=False))
    row = RiskConfig(
        name=payload.name,
        w_drop_clicks=payload.w_drop_clicks,
        w_low_clicks=payload.w_low_clicks,
        w_low_events=payload.w_low_events,
        w_low_resources=payload.w_low_resources,
        drop_threshold=payload.drop_threshold,
        active=True,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


class AuditEventIn(BaseModel):
    user_id: int | None = None
    action: str
    payload: dict[str, Any] | None = None


class AuditEventOut(AuditEventIn, ORMModel):
    id: int
    created_at: datetime


@router.post("/audit-events", response_model=AuditEventOut)
def create_audit_event(payload: AuditEventIn, session: Session = Depends(get_session)):
    row = AuditEvent(
        user_id=payload.user_id,
        action=payload.action,
        payload=payload.payload,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row

