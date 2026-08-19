"""FastAPI Router for ERP Integration Bridge & Audit Ledger (Pillar 3)."""
from typing import List

from fastapi import APIRouter, HTTPException, status

from app.erp.service import ErpSyncPayload, erp_service

router = APIRouter(prefix="/erp", tags=["ERP Integration & Audit Ledger"])


@router.get(
    "/sync-logs",
    response_model=List[ErpSyncPayload],
    summary="List ERP Synchronized Transactions",
)
def list_erp_sync_logs() -> List[ErpSyncPayload]:
    """Retrieves all historical sync transactions with SAP / Coal Net."""
    return erp_service.list_sync_records()


@router.post(
    "/sync/{log_id}",
    response_model=ErpSyncPayload,
    status_code=status.HTTP_201_CREATED,
    summary="Synchronize Shift Log with Colliery ERP",
)
def trigger_erp_synchronization(log_id: str) -> ErpSyncPayload:
    """Dispatches a validated statutory shift log to enterprise ERP with SHA-256 integrity verification."""
    result = erp_service.trigger_erp_sync(log_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift log '{log_id}' not found for ERP sync.",
        )
    return result
