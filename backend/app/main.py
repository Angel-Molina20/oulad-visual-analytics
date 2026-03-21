from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.health import router as health_router

app = FastAPI(title="OULAD Visual Analytics API", version="0.1.0")

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