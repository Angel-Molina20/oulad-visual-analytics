from fastapi import APIRouter
from ..services.mart_store import load_mart

router = APIRouter(prefix="/courses")


@router.get("")
def list_courses():
    df = load_mart()
    courses = sorted(df["course_id"].dropna().unique().tolist())
    return {"courses": courses, "count": len(courses)}