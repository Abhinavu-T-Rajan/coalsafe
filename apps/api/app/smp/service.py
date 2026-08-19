"""DGMS Safety Management Plan (SMP) & HIRA Service."""
import datetime
import uuid
from typing import Dict, List, Optional

from app.smp.models import (
    CreateHiraRequest,
    HazardCategory,
    HiraRecord,
    SmpRiskCategory,
    SmpSummary,
)


class SmpService:
    """Implements DGMS Circular 02/2011 & CMR 2017 Reg 104 Hazard Identification

    and Risk Assessment (HIRA) Engine.
    """

    def __init__(self):
        self._hazards: Dict[str, HiraRecord] = {}

    def _calculate_risk_category(self, rpn: int) -> SmpRiskCategory:
        """Categorizes Risk Priority Number according to DGMS 5x5 Matrix."""
        if rpn >= 15:
            return SmpRiskCategory.HIGH
        elif rpn >= 6:
            return SmpRiskCategory.MEDIUM
        return SmpRiskCategory.LOW

    def list_hira_records(self, category: Optional[HazardCategory] = None) -> List[HiraRecord]:
        """Returns all HIRA risk records, optionally filtered by hazard category."""
        records = list(self._hazards.values())
        if category:
            records = [r for r in records if r.hazardCategory == category]
        return records

    def create_hira_record(self, req: CreateHiraRequest) -> HiraRecord:
        """Adds a new hazard identification record to the colliery SMP."""
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        code_prefix = req.hazardCategory.split("_")[0][:3]
        hazard_code = f"SMP-{code_prefix}-{uuid.uuid4().hex[:4].upper()}"
        record_id = f"HIRA-{hazard_code}"

        init_rpn = req.initialLikelihood * req.initialConsequence
        res_rpn = req.residualLikelihood * req.residualConsequence

        record = HiraRecord(
            id=record_id,
            hazardCode=hazard_code,
            hazardCategory=req.hazardCategory,
            activity=req.activity,
            hazardDescription=req.hazardDescription,
            potentialConsequence=req.potentialConsequence,
            initialLikelihood=req.initialLikelihood,
            initialConsequence=req.initialConsequence,
            initialRpn=init_rpn,
            initialRiskCategory=self._calculate_risk_category(init_rpn),
            hierarchyOfControl=req.hierarchyOfControl,
            controlMeasures=req.controlMeasures,
            sopReference=req.sopReference,
            residualLikelihood=req.residualLikelihood,
            residualConsequence=req.residualConsequence,
            residualRpn=res_rpn,
            residualRiskCategory=self._calculate_risk_category(res_rpn),
            accountableOfficialRole=req.accountableOfficialRole,
            inspectionFrequency=req.inspectionFrequency,
            tarpNormalGreen=req.tarpNormalGreen,
            tarpTriggerYellow=req.tarpTriggerYellow,
            tarpActionRed=req.tarpActionRed,
            status="COMPLIANT",
            lastAuditDate=today,
        )
        self._hazards[record_id] = record
        return record

    def get_smp_summary(self) -> SmpSummary:
        """Returns statistical overview of the Colliery Safety Management Plan."""
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        records = list(self._hazards.values())
        total = len(records)
        high = len([r for r in records if r.residualRiskCategory == SmpRiskCategory.HIGH])
        medium = len([r for r in records if r.residualRiskCategory == SmpRiskCategory.MEDIUM])
        low = len([r for r in records if r.residualRiskCategory == SmpRiskCategory.LOW])
        compliant = len([r for r in records if r.status == "COMPLIANT"])

        compliance_rate = (compliant / max(1, total)) * 100.0

        return SmpSummary(
            totalHazardsIdentified=total,
            highRiskCount=high,
            mediumRiskAlarpCount=medium,
            lowRiskAcceptableCount=low,
            dgmsAuditComplianceRate=round(compliance_rate, 1),
            pendingTarpActions=0,
            lastReviewDate=today,
        )


smp_service = SmpService()
