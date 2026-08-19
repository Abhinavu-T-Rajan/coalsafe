"""FastAPI Router for DGMS Safety Management Plan & HIRA (Pillar 2)."""
from typing import List, Optional

from fastapi import APIRouter, status

from app.smp.models import (
    CreateHiraRequest,
    HazardCategory,
    HiraRecord,
    SmpSummary,
)
from app.smp.service import smp_service

router = APIRouter(prefix="/smp", tags=["Safety Management Plan & HIRA"])


@router.get(
    "/hazards",
    response_model=List[HiraRecord],
    summary="List Colliery Hazard Registry & HIRA Matrix",
)
def list_hira_hazards(category: Optional[HazardCategory] = None) -> List[HiraRecord]:
    """Retrieves all identified colliery hazards, risk priority numbers (RPN), and TARP protocols."""
    return smp_service.list_hira_records(category=category)


@router.post(
    "/hazards",
    response_model=HiraRecord,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Hazard into SMP",
)
def create_hira_hazard(request: CreateHiraRequest) -> HiraRecord:
    """Registers a new hazard with hierarchy of controls, TARP action levels, and accountable mine official."""
    return smp_service.create_hira_record(request)


@router.get(
    "/summary",
    response_model=SmpSummary,
    summary="Get Safety Management Plan Overview & Compliance Rate",
)
def get_smp_summary() -> SmpSummary:
    """Returns high-level statistics of high, ALARP, and low risk hazards under DGMS audit rules."""
    return smp_service.get_smp_summary()
