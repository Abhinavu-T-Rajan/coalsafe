"""COALSAFE FastAPI Application Entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import settings


class HealthResponse(BaseModel):
    """Healthcheck response model."""
    status: str
    service: str


app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    description="Digital Mine Operations, Shift Handover & Safety Management Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Service Health Check",
)
async def health_check() -> HealthResponse:
    """Return service status for container and monitoring checks."""
    return HealthResponse(
        status="ok",
        service="coalsafe-api",
    )


@app.get("/", tags=["Root"], summary="Root Endpoint")
async def root():
    """Welcome endpoint providing basic API metadata."""
    return {
        "app": settings.app_name,
        "version": settings.api_version,
        "environment": settings.environment,
        "docs": "/docs",
    }
