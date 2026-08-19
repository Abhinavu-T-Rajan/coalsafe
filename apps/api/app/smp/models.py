from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class HazardCategory(str, Enum):
    STRATA_CONTROL = "STRATA_CONTROL"
    MINE_GAS_VENTILATION = "MINE_GAS_VENTILATION"
    FIRE_EXPLOSION = "FIRE_EXPLOSION"
    INUNDATION_WATER = "INUNDATION_WATER"
    HEMM_TRANSPORT = "HEMM_TRANSPORT"
    ELECTRICITY_MACHINERY = "ELECTRICITY_MACHINERY"
    DUST_ENVIRONMENT = "DUST_ENVIRONMENT"


class ControlHierarchy(str, Enum):
    ELIMINATION = "ELIMINATION"
    SUBSTITUTION = "SUBSTITUTION"
    ENGINEERING_CONTROL = "ENGINEERING_CONTROL"
    ADMINISTRATIVE_CONTROL = "ADMINISTRATIVE_CONTROL"
    PPE = "PPE"


class SmpRiskCategory(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class HiraRecord(BaseModel):
    id: str
    hazardCode: str
    hazardCategory: HazardCategory
    activity: str
    hazardDescription: str
    potentialConsequence: str

    # Initial Risk Matrix (1 to 5 each)
    initialLikelihood: int = Field(ge=1, le=5)
    initialConsequence: int = Field(ge=1, le=5)
    initialRpn: int
    initialRiskCategory: SmpRiskCategory

    # Control Mechanisms
    hierarchyOfControl: ControlHierarchy
    controlMeasures: List[str]
    sopReference: str

    # Residual Risk after Controls
    residualLikelihood: int = Field(ge=1, le=5)
    residualConsequence: int = Field(ge=1, le=5)
    residualRpn: int
    residualRiskCategory: SmpRiskCategory

    # Responsibility & Monitoring
    accountableOfficialRole: str
    inspectionFrequency: str

    # Trigger Action Response Plan (TARP)
    tarpNormalGreen: str
    tarpTriggerYellow: str
    tarpActionRed: str

    status: str = "COMPLIANT"  # ACTIVE, COMPLIANT, ACTION_REQUIRED
    lastAuditDate: str


class CreateHiraRequest(BaseModel):
    hazardCategory: HazardCategory
    activity: str
    hazardDescription: str
    potentialConsequence: str
    initialLikelihood: int = Field(default=4, ge=1, le=5)
    initialConsequence: int = Field(default=4, ge=1, le=5)
    hierarchyOfControl: ControlHierarchy = ControlHierarchy.ENGINEERING_CONTROL
    controlMeasures: List[str]
    sopReference: str = "SOP-COL-2024-01"
    residualLikelihood: int = Field(default=2, ge=1, le=5)
    residualConsequence: int = Field(default=2, ge=1, le=5)
    accountableOfficialRole: str = "Colliery Safety Officer"
    inspectionFrequency: str = "DAILY"
    tarpNormalGreen: str
    tarpTriggerYellow: str
    tarpActionRed: str


class SmpSummary(BaseModel):
    totalHazardsIdentified: int
    highRiskCount: int
    mediumRiskAlarpCount: int
    lowRiskAcceptableCount: int
    dgmsAuditComplianceRate: float
    pendingTarpActions: int
    lastReviewDate: str
