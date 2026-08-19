"""FastAPI Router for Digital Shift Handover Logbooks & PDF Export (Pillar 1)."""
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Response, status

from app.shift_handover.models import (
    CreateShiftLogRequest,
    HandoverSignoffRequest,
    LogType,
    ShiftLog,
)
from app.shift_handover.service import shift_handover_service

router = APIRouter(prefix="/shift-logs", tags=["Shift Handover Log System"])


@router.get(
    "",
    response_model=List[ShiftLog],
    summary="List Statutory & Operational Shift Logs",
)
def list_shift_logs(logType: Optional[LogType] = None) -> List[ShiftLog]:
    """Retrieves all statutory and non-statutory shift logs."""
    return shift_handover_service.list_logs(log_type=logType)


@router.post(
    "",
    response_model=ShiftLog,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Digital Shift Handover Log",
)
def create_shift_log(request: CreateShiftLogRequest) -> ShiftLog:
    """Submits a new digital shift handover log with automated red flag detection and hash signing."""
    return shift_handover_service.create_log(request)


@router.get(
    "/{log_id}",
    response_model=ShiftLog,
    summary="Get Specific Shift Log Details",
)
def get_shift_log(log_id: str) -> ShiftLog:
    """Retrieves full details of a specific shift handover log."""
    log = shift_handover_service.get_log(log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift log '{log_id}' not found.",
        )
    return log


@router.post(
    "/{log_id}/handover",
    response_model=ShiftLog,
    summary="Incoming Supervisor Digital Handover Sign-Off",
)
def complete_handover_signoff(log_id: str, request: HandoverSignoffRequest) -> ShiftLog:
    """Completes incoming supervisor handover acknowledgment, red flag acceptance, and digital sign-off."""
    if request.logId != log_id:
        request.logId = log_id
    updated_log = shift_handover_service.complete_handover(request)
    if not updated_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift log '{log_id}' not found.",
        )
    return updated_log


@router.get(
    "/{log_id}/pdf",
    summary="Download Statutory Handover PDF Report",
)
def download_log_pdf(log_id: str):
    """Generates and streams a professional DGMS-compliant statutory PDF report."""
    pdf_bytes = shift_handover_service.generate_pdf_report(log_id)
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift log '{log_id}' not found.",
        )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=COALSAFE_Statutory_Handover_{log_id}.pdf"
        },
    )
