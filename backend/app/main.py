from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.health import router as health_router
from .api.courses import router as courses_router
from .api.analytics import router as analytics_router
from .api.meta import router as meta_router
from .api.ops import router as ops_router
from .db import init_db

app = FastAPI(title="OULAD Visual Analytics API", version="0.1.0")


@app.on_event("startup")
def on_startup():
    init_db()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["health"])
app.include_router(courses_router, tags=["courses"])
app.include_router(analytics_router, tags=["analytics"])
app.include_router(meta_router, tags=["meta"])
app.include_router(ops_router, tags=["ops"])
