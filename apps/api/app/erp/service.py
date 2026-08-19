"""ERP Integration Bridge (SAP / Coal Net) and Cryptographic Audit Ledger."""
import datetime
import uuid
from typing import Dict, List, Optional

from pydantic import BaseModel

from app.shift_handover.service import shift_handover_service


class ErpSyncPayload(BaseModel):
    syncId: str
    timestamp: str
    logId: str
    shift: str
    date: str
    totalTonnage: float
    manpowerPresent: int
    equipmentDowntimeMinutes: float
    safetyViolationsCount: int
    erpStatus: str  # SYNCED, PENDING, FAILED
    sapTransactionId: str
    sha256Verification: str


class ErpSyncService:
    """Simulates bi-directional synchronization with Colliery SAP/ERP systems."""

    def __init__(self):
        self._sync_ledger: Dict[str, ErpSyncPayload] = {}

    def list_sync_records(self) -> List[ErpSyncPayload]:
        """Returns all ERP transaction sync logs, sorted newest first."""
        return sorted(self._sync_ledger.values(), key=lambda x: x.timestamp, reverse=True)

    def trigger_erp_sync(self, log_id: str) -> Optional[ErpSyncPayload]:
        """Packages a statutory shift log into an ERP payload and syncs with SAP."""
        log = shift_handover_service.get_log(log_id)
        if not log:
            return None

        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        sync_id = f"ERP-SYNC-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        sap_tx = f"SAP-COL-{uuid.uuid4().hex[:8].upper()}"

        total_downtime = sum(eq.breakdownMinutes for eq in log.equipmentLogs)
        safety_issues = len(log.redFlags)

        record = ErpSyncPayload(
            syncId=sync_id,
            timestamp=now_str,
            logId=log.id,
            shift=log.shift,
            date=log.date,
            totalTonnage=log.productionTonnage,
            manpowerPresent=log.manpowerDeployed,
            equipmentDowntimeMinutes=total_downtime,
            safetyViolationsCount=safety_issues,
            erpStatus="SYNCED",
            sapTransactionId=sap_tx,
            sha256Verification=log.sha256Hash,
        )

        self._sync_ledger[sync_id] = record
        return record


erp_service = ErpSyncService()
