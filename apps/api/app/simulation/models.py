from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ZoneType(str, Enum):
    LONGWALL_FACE = "LONGWALL_FACE"
    HAULAGE_ROAD = "HAULAGE_ROAD"
    RETURN_AIRWAY = "RETURN_AIRWAY"
    INTAKE_SHAFT = "INTAKE_SHAFT"
    GOAF = "GOAF"
    BATTERY_CHARGING_STATION = "BATTERY_CHARGING_STATION"
    REFUGE_CHAMBER = "REFUGE_CHAMBER"
    SUMP_BOTTOM = "SUMP_BOTTOM"


class HazardType(str, Enum):
    METHANE_ACCUMULATION = "METHANE_ACCUMULATION"
    MINE_FIRE_CO = "MINE_FIRE_CO"
    ROOF_FALL_STRATA = "ROOF_FALL_STRATA"
    WATER_INUNDATION = "WATER_INUNDATION"
    VENTILATION_FAILURE = "VENTILATION_FAILURE"
    NONE = "NONE"


class RiskLevel(str, Enum):
    NORMAL = "NORMAL"
    ELEVATED = "ELEVATED"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    EMERGENCY = "EMERGENCY"


class PersonnelStatus(str, Enum):
    HEALTHY = "HEALTHY"
    EXPOSED = "EXPOSED"
    INJURED = "INJURED"
    EVACUATING = "EVACUATING"
    SAFELY_EVACUATED = "SAFELY_EVACUATED"
    TRAPPED = "TRAPPED"
    CASUALTY = "CASUALTY"


class EquipmentType(str, Enum):
    CONTINUOUS_MINER = "CONTINUOUS_MINER"
    SHEARER = "SHEARER"
    MAIN_VENT_FAN = "MAIN_VENT_FAN"
    AUX_FAN = "AUX_FAN"
    DEWATERING_PUMP = "DEWATERING_PUMP"
    CONVEYOR_BELT = "CONVEYOR_BELT"
    REFUGE_CHAMBER = "REFUGE_CHAMBER"


class OperatorActionType(str, Enum):
    CUT_SECTION_POWER = "CUT_SECTION_POWER"
    RESTORE_SECTION_POWER = "RESTORE_SECTION_POWER"
    ACTIVATE_AUX_FAN = "ACTIVATE_AUX_FAN"
    DEACTIVATE_AUX_FAN = "DEACTIVATE_AUX_FAN"
    REVERSE_MAIN_VENTILATION = "REVERSE_MAIN_VENTILATION"
    TRIGGER_SECTION_EVACUATION = "TRIGGER_SECTION_EVACUATION"
    TRIGGER_MINE_WIDE_EVACUATION = "TRIGGER_MINE_WIDE_EVACUATION"
    DEPLOY_WATER_BARRIER = "DEPLOY_WATER_BARRIER"
    DEPLOY_ROCK_DUST = "DEPLOY_ROCK_DUST"
    START_DEWATERING_PUMPS = "START_DEWATERING_PUMPS"
    STOP_DEWATERING_PUMPS = "STOP_DEWATERING_PUMPS"
    SEAL_ZONE_STOPPINGS = "SEAL_ZONE_STOPPINGS"
    DISPATCH_MINES_RESCUE_BRIGADE = "DISPATCH_MINES_RESCUE_BRIGADE"


class ScenarioId(str, Enum):
    METHANE_INRUSH_LONGWALL = "METHANE_INRUSH_LONGWALL"
    SPONTANEOUS_COMBUSTION_GOAF = "SPONTANEOUS_COMBUSTION_GOAF"
    STRATA_FAILURE_ROOF_FALL = "STRATA_FAILURE_ROOF_FALL"
    UNDERGROUND_WATER_INUNDATION = "UNDERGROUND_WATER_INUNDATION"
    CASCADING_VENTILATION_DISASTER = "CASCADING_VENTILATION_DISASTER"


class SimulationStatus(str, Enum):
    READY = "READY"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ---------------------------------------------------------------------------
# Telemetry and Entities
# ---------------------------------------------------------------------------


class EnvironmentalTelemetry(BaseModel):
    methanePercentage: float = Field(default=0.15, description="CH4 % concentration")
    carbonMonoxidePpm: float = Field(default=5.0, description="CO ppm concentration")
    oxygenPercentage: float = Field(default=20.9, description="O2 % concentration")
    temperatureCelsius: float = Field(default=24.0, description="Ambient temp in °C")
    humidityPercentage: float = Field(default=65.0, description="Relative humidity %")
    airVelocityMps: float = Field(default=2.5, description="Air velocity in m/s")
    strataPressureMpa: float = Field(default=12.0, description="Roof pressure in MPa")
    roofConvergenceMm: float = Field(default=1.2, description="Roof displacement in mm")
    waterInflowLpm: float = Field(default=20.0, description="Inflow in L/min")
    waterLevelMeters: float = Field(default=0.05, description="Water level in meters")


class MineZone(BaseModel):
    id: str
    name: str
    type: ZoneType
    x: int
    y: int
    width: int
    height: int
    telemetry: EnvironmentalTelemetry = Field(default_factory=EnvironmentalTelemetry)
    activeHazard: HazardType = HazardType.NONE
    riskLevel: RiskLevel = RiskLevel.NORMAL
    riskScore: float = 0.0
    powerSupplied: bool = True
    auxiliaryFanRunning: bool = True
    waterBarrierDeployed: bool = False
    rockDustDeployed: bool = False
    sealedWithStoppings: bool = False
    personnelIds: List[str] = Field(default_factory=list)
    connectedZoneIds: List[str] = Field(default_factory=list)


class MinePersonnel(BaseModel):
    id: str
    name: str
    role: str
    currentZoneId: str
    status: PersonnelStatus = PersonnelStatus.HEALTHY
    oxygenExposureRemainingMin: float = 60.0
    injurySeverity: float = 0.0
    heartRateBpm: int = 75


class EquipmentStatus(BaseModel):
    id: str
    name: str
    type: EquipmentType
    zoneId: str
    isOperational: bool = True
    isTripped: bool = False
    powerDrawKw: float = 120.0


class DgmsViolation(BaseModel):
    code: str
    regulation: str
    zoneId: str
    severity: str
    message: str
    timestampStep: int


class IncidentTimelineEvent(BaseModel):
    step: int
    timestampSeconds: int
    type: str
    zoneId: Optional[str] = None
    title: str
    description: str
    severity: str


class SimulationActionRequest(BaseModel):
    actionType: OperatorActionType
    targetZoneId: Optional[str] = None
    targetEquipmentId: Optional[str] = None
    notes: Optional[str] = None


class ActionResult(BaseModel):
    success: bool
    message: str
    actionType: OperatorActionType
    targetZoneId: Optional[str] = None
    timestampStep: int
    effectivenessScore: float


class SimulationScenario(BaseModel):
    id: ScenarioId
    title: str = Field(default="", alias="title")
    description: str
    difficulty: str
    primaryHazard: HazardType
    estimatedDurationTicks: int
    initialPersonnelCount: int
    dgmsFocusRegulations: List[str]
    briefing: str


class SimulationScoreReport(BaseModel):
    overallScore: float
    grade: str
    livesProtected: int
    totalPersonnel: int
    casualties: int
    injuries: int
    responseTimeSeconds: int
    dgmsComplianceScore: float
    violations: List[DgmsViolation]
    infrastructureDamageScore: float
    keyStrengths: List[str]
    correctiveActions: List[str]
    evaluationSummary: str


class SimulationState(BaseModel):
    sessionId: str
    scenario: SimulationScenario
    status: SimulationStatus
    currentStep: int = 0
    tickDurationSeconds: int = 5
    elapsedTimeSeconds: int = 0
    zones: List[MineZone]
    personnel: List[MinePersonnel]
    equipment: List[EquipmentStatus]
    overallRiskLevel: RiskLevel = RiskLevel.NORMAL
    overallRiskScore: float = 0.0
    activeViolations: List[DgmsViolation] = Field(default_factory=list)
    events: List[IncidentTimelineEvent] = Field(default_factory=list)
    scoreReport: Optional[SimulationScoreReport] = None
