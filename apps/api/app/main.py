from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.api.v1.erp import router as erp_router
from app.api.v1.ontology import router as ontology_router
from app.api.v1.shift_handover import router as shift_handover_router
from app.api.v1.simulations import router as simulations_router
from app.api.v1.smp import router as smp_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ontology_router, prefix="/api/v1")
app.include_router(simulations_router, prefix="/api/v1")
app.include_router(shift_handover_router, prefix="/api/v1")
app.include_router(smp_router, prefix="/api/v1")
app.include_router(erp_router, prefix="/api/v1")


class HealthResponse(BaseModel):
    status: str
    service: str


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    tags=["System"],
)
def health_check() -> HealthResponse:
    """Returns the operational status of the API service."""
    return HealthResponse(
        status="ok",
        service="coalsafe-api",
    )
