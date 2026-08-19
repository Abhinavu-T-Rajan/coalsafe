from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class LogCategory(str, Enum):
    STATUTORY = "STATUTORY"
    NON_STATUTORY = "NON_STATUTORY"


class LogType(str, Enum):
    OVERMAN_LOG = "OVERMAN_LOG"
    MINING_SIRDAR_LOG = "MINING_SIRDAR_LOG"
    VENTILATION_OFFICER_LOG = "VENTILATION_OFFICER_LOG"
    ELECTRICAL_MECHANICAL_LOG = "ELECTRICAL_MECHANICAL_LOG"
    HEMM_OPERATOR_LOG = "HEMM_OPERATOR_LOG"
    PUMPING_LOG = "PUMPING_LOG"


class ShiftType(str, Enum):
    SHIFT_1_MORNING = "SHIFT_1_MORNING"
    SHIFT_2_AFTERNOON = "SHIFT_2_AFTERNOON"
    SHIFT_3_NIGHT = "SHIFT_3_NIGHT"


class HandoverStatus(str, Enum):
    PENDING_HANDOVER = "PENDING_HANDOVER"
    ACKNOWLEDGED_AND_ACCEPTED = "ACKNOWLEDGED_AND_ACCEPTED"
    REJECTED_WITH_REMARKS = "REJECTED_WITH_REMARKS"


class RedFlag(BaseModel):
    id: str
    severity: str = "HIGH"  # CRITICAL, HIGH, WARNING
    title: str
    description: str
    location: str
    actionRequiredForIncoming: str
    acknowledgedByIncoming: bool = False
    acknowledgedAt: Optional[str] = None


class ShiftGasReading(BaseModel):
    location: str
    ch4Percent: float
    coPpm: float
    o2Percent: float = 20.9
    airVelocityMps: float = 2.0
    status: str = "NORMAL"  # NORMAL, ELEVATED, TRIP_LIMIT


class EquipmentLogItem(BaseModel):
    equipmentId: str
    equipmentName: str
    operatingHours: float
    breakdownMinutes: float = 0.0
    defectNotes: Optional[str] = None
    flpEnclosureChecked: bool = True
    brakesAndSteeringChecked: Optional[bool] = True


class ShiftLog(BaseModel):
    id: str
    logType: LogType
    category: LogCategory = LogCategory.STATUTORY
    cmrRegulationRef: str
    mineName: str
    seamName: str
    districtSection: str
    date: str
    shift: ShiftType
    outgoingSupervisorName: str
    outgoingSupervisorRole: str
    outgoingSupervisorCertNo: str

    manpowerDeployed: int
    productionTonnage: float
    strataConditionSummary: str
    ventilationAdequacy: str
    waterAccumulationStatus: str
    dustSuppressionActive: bool = True

    gasReadings: List[ShiftGasReading] = Field(default_factory=list)
    equipmentLogs: List[EquipmentLogItem] = Field(default_factory=list)

    redFlags: List[RedFlag] = Field(default_factory=list)
    pendingActionsForNextShift: List[str] = Field(default_factory=list)
    generalRemarks: str = ""

    handoverStatus: HandoverStatus = HandoverStatus.PENDING_HANDOVER
    incomingSupervisorName: Optional[str] = None
    incomingSupervisorRole: Optional[str] = None
    incomingSupervisorPin: Optional[str] = None
    handoverCompletedAt: Optional[str] = None
    handoverNotes: Optional[str] = None

    sha256Hash: str
    createdAt: str


class CreateShiftLogRequest(BaseModel):
    logType: LogType
    mineName: str
    seamName: str
    districtSection: str
    date: str
    shift: ShiftType
    outgoingSupervisorName: str
    outgoingSupervisorRole: str
    outgoingSupervisorCertNo: str
    manpowerDeployed: int = 0
    productionTonnage: float = 0.0
    strataConditionSummary: str = ""
    ventilationAdequacy: str = ""
    waterAccumulationStatus: str = ""
    dustSuppressionActive: bool = True
    gasReadings: List[ShiftGasReading] = Field(default_factory=list)
    equipmentLogs: List[EquipmentLogItem] = Field(default_factory=list)
    redFlags: List[dict] = Field(default_factory=list)
    pendingActionsForNextShift: List[str] = Field(default_factory=list)
    generalRemarks: str = ""


class HandoverSignoffRequest(BaseModel):
    logId: str
    incomingSupervisorName: str
    incomingSupervisorRole: str
    incomingSupervisorPin: str
    handoverNotes: Optional[str] = None
    acceptedRedFlagIds: List[str] = Field(default_factory=list)
