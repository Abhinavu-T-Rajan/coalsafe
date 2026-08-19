/**
 * @coalsafe/types
 * Shared TypeScript definitions across the COALSAFE monorepo.
 */

export interface ApiHealthResponse {
  status: string;
  service: string;
}

// ===========================================================================
// 1. Digital Shift Handover Log System (SIH1645 Pillar 1)
// ===========================================================================

export type LogCategory = "STATUTORY" | "NON_STATUTORY";

export type LogType =
  | "OVERMAN_LOG"
  | "MINING_SIRDAR_LOG"
  | "VENTILATION_OFFICER_LOG"
  | "ELECTRICAL_MECHANICAL_LOG"
  | "HEMM_OPERATOR_LOG"
  | "PUMPING_LOG";

export type ShiftType = "SHIFT_1_MORNING" | "SHIFT_2_AFTERNOON" | "SHIFT_3_NIGHT";

export type HandoverStatus = "PENDING_HANDOVER" | "ACKNOWLEDGED_AND_ACCEPTED" | "REJECTED_WITH_REMARKS";

export interface RedFlag {
  id: string;
  severity: "CRITICAL" | "HIGH" | "WARNING";
  title: string;
  description: string;
  location: string;
  actionRequiredForIncoming: string;
  acknowledgedByIncoming: boolean;
  acknowledgedAt?: string;
}

export interface ShiftGasReading {
  location: string;
  ch4Percent: number;
  coPpm: number;
  o2Percent: number;
  airVelocityMps: number;
  status: "NORMAL" | "ELEVATED" | "TRIP_LIMIT";
}

export interface EquipmentLogItem {
  equipmentId: string;
  equipmentName: string;
  operatingHours: number;
  breakdownMinutes: number;
  defectNotes?: string;
  flpEnclosureChecked: boolean;
  brakesAndSteeringChecked?: boolean;
}

export interface ShiftLog {
  id: string;
  logType: LogType;
  category: LogCategory;
  cmrRegulationRef: string; // e.g. "CMR 2017 Reg 48 (Overman Duties)"
  mineName: string;
  seamName: string;
  districtSection: string;
  date: string;
  shift: ShiftType;
  outgoingSupervisorName: string;
  outgoingSupervisorRole: string;
  outgoingSupervisorCertNo: string;
  
  // Operational Details
  manpowerDeployed: number;
  productionTonnage: number;
  strataConditionSummary: string;
  ventilationAdequacy: string;
  waterAccumulationStatus: string;
  dustSuppressionActive: boolean;

  // Detailed Readings & Equipment
  gasReadings: ShiftGasReading[];
  equipmentLogs: EquipmentLogItem[];

  // Critical Red Flags & Pending Actions
  redFlags: RedFlag[];
  pendingActionsForNextShift: string[];
  generalRemarks: string;

  // Digital Handover Sign-off
  handoverStatus: HandoverStatus;
  incomingSupervisorName?: string;
  incomingSupervisorRole?: string;
  incomingSupervisorPin?: string;
  handoverCompletedAt?: string;
  handoverNotes?: string;

  // Cryptographic Non-repudiation
  sha256Hash: string;
  createdAt: string;
}

export interface CreateShiftLogRequest {
  logType: LogType;
  mineName: string;
  seamName: string;
  districtSection: string;
  date: string;
  shift: ShiftType;
  outgoingSupervisorName: string;
  outgoingSupervisorRole: string;
  outgoingSupervisorCertNo: string;
  manpowerDeployed: number;
  productionTonnage: number;
  strataConditionSummary: string;
  ventilationAdequacy: string;
  waterAccumulationStatus: string;
  dustSuppressionActive: boolean;
  gasReadings: ShiftGasReading[];
  equipmentLogs: EquipmentLogItem[];
  redFlags: Omit<RedFlag, "id" | "acknowledgedByIncoming">[];
  pendingActionsForNextShift: string[];
  generalRemarks: string;
}

export interface HandoverSignoffRequest {
  logId: string;
  incomingSupervisorName: string;
  incomingSupervisorRole: string;
  incomingSupervisorPin: string;
  handoverNotes?: string;
  acceptedRedFlagIds: string[];
}

// ===========================================================================
// 2. DGMS Safety Management Plan (SMP) & HIRA (SIH1645 Pillar 2)
// ===========================================================================

export type HazardCategory =
  | "STRATA_CONTROL"
  | "MINE_GAS_VENTILATION"
  | "FIRE_EXPLOSION"
  | "INUNDATION_WATER"
  | "HEMM_TRANSPORT"
  | "ELECTRICITY_MACHINERY"
  | "DUST_ENVIRONMENT";

export type ControlHierarchy =
  | "ELIMINATION"
  | "SUBSTITUTION"
  | "ENGINEERING_CONTROL"
  | "ADMINISTRATIVE_CONTROL"
  | "PPE";

export type SmpRiskCategory = "LOW" | "MEDIUM" | "HIGH";

export interface HiraRecord {
  id: string;
  hazardCode: string; // e.g. "SMP-STR-01"
  hazardCategory: HazardCategory;
  activity: string;
  hazardDescription: string;
  potentialConsequence: string;
  
  // Initial Assessment
  initialLikelihood: number; // 1 (Rare) to 5 (Almost Certain)
  initialConsequence: number; // 1 (Insignificant) to 5 (Catastrophic)
  initialRpn: number; // Likelihood x Consequence (1 to 25)
  initialRiskCategory: SmpRiskCategory;

  // Hierarchy of Controls
  hierarchyOfControl: ControlHierarchy;
  controlMeasures: string[];
  sopReference: string; // Safe Operating Procedure Code

  // Residual Risk after Control
  residualLikelihood: number;
  residualConsequence: number;
  residualRpn: number;
  residualRiskCategory: SmpRiskCategory;

  // Responsibility & Monitoring
  accountableOfficialRole: string; // e.g. "Colliery Safety Officer / Strata Engineer"
  inspectionFrequency: "CONTINUOUS" | "EVERY_SHIFT" | "DAILY" | "WEEKLY" | "MONTHLY";
  
  // Trigger Action Response Plan (TARP)
  tarpNormalGreen: string;
  tarpTriggerYellow: string;
  tarpActionRed: string;

  status: "ACTIVE" | "COMPLIANT" | "ACTION_REQUIRED";
  lastAuditDate: string;
}

export interface CreateHiraRequest {
  hazardCategory: HazardCategory;
  activity: string;
  hazardDescription: string;
  potentialConsequence: string;
  initialLikelihood: number;
  initialConsequence: number;
  hierarchyOfControl: ControlHierarchy;
  controlMeasures: string[];
  sopReference: string;
  residualLikelihood: number;
  residualConsequence: number;
  accountableOfficialRole: string;
  inspectionFrequency: string;
  tarpNormalGreen: string;
  tarpTriggerYellow: string;
  tarpActionRed: string;
}

export interface SmpSummary {
  totalHazardsIdentified: number;
  highRiskCount: number;
  mediumRiskAlarpCount: number;
  lowRiskAcceptableCount: number;
  dgmsAuditComplianceRate: number; // Percentage
  pendingTarpActions: number;
  lastReviewDate: string;
}

// ===========================================================================
// 3. ERP Integration & Cryptographic Audit (SIH1645 Pillar 3)
// ===========================================================================

export interface ErpSyncPayload {
  syncId: string;
  timestamp: string;
  logId: string;
  shift: ShiftType;
  date: string;
  totalTonnage: number;
  manpowerPresent: number;
  equipmentDowntimeMinutes: number;
  safetyViolationsCount: number;
  erpStatus: "SYNCED" | "PENDING" | "FAILED";
  sapTransactionId: string;
  sha256Verification: string;
}

// ===========================================================================
// 4. Simulation Engine Types (Phase 3.1 - 3.8)
// ===========================================================================

export type ZoneType =
  | "LONGWALL_FACE"
  | "HAULAGE_ROAD"
  | "RETURN_AIRWAY"
  | "INTAKE_SHAFT"
  | "GOAF"
  | "BATTERY_CHARGING_STATION"
  | "REFUGE_CHAMBER"
  | "SUMP_BOTTOM";

export type HazardType =
  | "METHANE_ACCUMULATION"
  | "MINE_FIRE_CO"
  | "ROOF_FALL_STRATA"
  | "WATER_INUNDATION"
  | "VENTILATION_FAILURE"
  | "NONE";

export type RiskLevel = "NORMAL" | "ELEVATED" | "HIGH" | "CRITICAL" | "EMERGENCY";

export interface EnvironmentalTelemetry {
  methanePercentage: number;
  carbonMonoxidePpm: number;
  oxygenPercentage: number;
  temperatureCelsius: number;
  humidityPercentage: number;
  airVelocityMps: number;
  strataPressureMpa: number;
  roofConvergenceMm: number;
  waterInflowLpm: number;
  waterLevelMeters: number;
}

export interface MineZone {
  id: string;
  name: string;
  type: ZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
  telemetry: EnvironmentalTelemetry;
  activeHazard: HazardType;
  riskLevel: RiskLevel;
  riskScore: number;
  powerSupplied: boolean;
  auxiliaryFanRunning: boolean;
  waterBarrierDeployed: boolean;
  rockDustDeployed: boolean;
  sealedWithStoppings: boolean;
  personnelIds: string[];
  connectedZoneIds: string[];
}

export type PersonnelStatus =
  | "HEALTHY"
  | "EXPOSED"
  | "INJURED"
  | "EVACUATING"
  | "SAFELY_EVACUATED"
  | "TRAPPED"
  | "CASUALTY";

export interface MinePersonnel {
  id: string;
  name: string;
  role: string;
  currentZoneId: string;
  status: PersonnelStatus;
  oxygenExposureRemainingMin: number;
  injurySeverity: number;
  heartRateBpm: number;
}

export type EquipmentType =
  | "CONTINUOUS_MINER"
  | "SHEARER"
  | "MAIN_VENT_FAN"
  | "AUX_FAN"
  | "DEWATERING_PUMP"
  | "CONVEYOR_BELT"
  | "REFUGE_CHAMBER";

export interface EquipmentStatus {
  id: string;
  name: string;
  type: EquipmentType;
  zoneId: string;
  isOperational: boolean;
  isTripped: boolean;
  powerDrawKw: number;
}

export interface DgmsViolation {
  code: string;
  regulation: string;
  zoneId: string;
  severity: "WARNING" | "CRITICAL" | "LETHAL";
  message: string;
  timestampStep: number;
}

export type OperatorActionType =
  | "CUT_SECTION_POWER"
  | "RESTORE_SECTION_POWER"
  | "ACTIVATE_AUX_FAN"
  | "DEACTIVATE_AUX_FAN"
  | "REVERSE_MAIN_VENTILATION"
  | "TRIGGER_SECTION_EVACUATION"
  | "TRIGGER_MINE_WIDE_EVACUATION"
  | "DEPLOY_WATER_BARRIER"
  | "DEPLOY_ROCK_DUST"
  | "START_DEWATERING_PUMPS"
  | "STOP_DEWATERING_PUMPS"
  | "SEAL_ZONE_STOPPINGS"
  | "DISPATCH_MINES_RESCUE_BRIGADE";

export interface SimulationActionRequest {
  actionType: OperatorActionType;
  targetZoneId?: string;
  targetEquipmentId?: string;
  notes?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  actionType: OperatorActionType;
  targetZoneId?: string;
  timestampStep: number;
  effectivenessScore: number;
}

export type ScenarioId =
  | "METHANE_INRUSH_LONGWALL"
  | "SPONTANEOUS_COMBUSTION_GOAF"
  | "STRATA_FAILURE_ROOF_FALL"
  | "UNDERGROUND_WATER_INUNDATION"
  | "CASCADING_VENTILATION_DISASTER";

export interface SimulationScenario {
  id: ScenarioId;
  title: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  primaryHazard: HazardType;
  estimatedDurationTicks: number;
  initialPersonnelCount: number;
  dgmsFocusRegulations: string[];
  briefing: string;
}

export type SimulationStatus = "READY" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED";

export interface IncidentTimelineEvent {
  step: number;
  timestampSeconds: number;
  type: "INJECTED_HAZARD" | "OPERATOR_ACTION" | "DGMS_ALERT" | "EVACUATION_UPDATE" | "SYSTEM";
  zoneId?: string;
  title: string;
  description: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
}

export interface SimulationScoreReport {
  overallScore: number;
  grade: "S" | "A" | "B" | "C" | "F";
  livesProtected: number;
  totalPersonnel: number;
  casualties: number;
  injuries: number;
  responseTimeSeconds: number;
  dgmsComplianceScore: number;
  violations: DgmsViolation[];
  infrastructureDamageScore: number;
  keyStrengths: string[];
  correctiveActions: string[];
  evaluationSummary: string;
}

export interface SimulationState {
  sessionId: string;
  scenario: SimulationScenario;
  status: SimulationStatus;
  currentStep: number;
  tickDurationSeconds: number;
  elapsedTimeSeconds: number;
  zones: MineZone[];
  personnel: MinePersonnel[];
  equipment: EquipmentStatus[];
  overallRiskLevel: RiskLevel;
  overallRiskScore: number;
  activeViolations: DgmsViolation[];
  events: IncidentTimelineEvent[];
  scoreReport?: SimulationScoreReport;
}

// ===========================================================================
// 5. Domain Ontology Types
// ===========================================================================

export interface Mine {
  id: string;
  name: string;
  code: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MineCreate {
  name: string;
  code: string;
  location: string;
  status?: string;
}

export interface MineContext {
  mine: Mine;
  area_count: number;
  people_count: number;
  equipment_count: number;
  shift_count: number;
  open_hazard_count: number;
  open_incident_count: number;
}

export interface MineArea {
  id: string;
  mine_id: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MineAreaCreate {
  mine_id: string;
  name: string;
  code: string;
  description?: string;
  status?: string;
}

export interface AreaContext {
  area: MineArea;
  equipment_count: number;
  open_hazard_count: number;
  open_incident_count: number;
}

export interface Person {
  id: string;
  mine_id: string;
  name: string;
  employee_id: string;
  role: string;
  contact_information?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PersonCreate {
  mine_id: string;
  name: string;
  employee_id: string;
  role: string;
  contact_information?: string;
  status?: string;
}

export interface Equipment {
  id: string;
  mine_id: string;
  area_id?: string | null;
  name: string;
  equipment_code: string;
  equipment_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentCreate {
  mine_id: string;
  area_id?: string | null;
  name: string;
  equipment_code: string;
  equipment_type: string;
  status?: string;
}

export interface Shift {
  id: string;
  mine_id: string;
  area_id?: string | null;
  supervisor_id?: string | null;
  shift_type: string;
  start_time: string;
  end_time?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftCreate {
  mine_id: string;
  area_id?: string | null;
  supervisor_id?: string | null;
  shift_type: string;
  start_time: string;
  end_time?: string | null;
  status?: string;
}

export interface Handover {
  id: string;
  shift_id: string;
  created_by?: string | null;
  summary?: string | null;
  production_information?: string | null;
  equipment_information?: string | null;
  safety_information?: string | null;
  red_flags?: Record<string, unknown>[] | null;
  required_actions?: string[] | null;
  status: string;
  submitted_at?: string | null;
  acknowledged_at?: string | null;
  sha256_hash?: string | null;
  created_at: string;
}

export interface HandoverCreate {
  shift_id: string;
  created_by?: string | null;
  summary?: string | null;
  production_information?: string | null;
  equipment_information?: string | null;
  safety_information?: string | null;
  red_flags?: Record<string, unknown>[];
  required_actions?: string[];
}

export interface DomainHazard {
  id: string;
  mine_id: string;
  area_id?: string | null;
  reported_by?: string | null;
  assigned_to?: string | null;
  title: string;
  description?: string | null;
  category: string;
  severity: string;
  status: string;
  location?: string | null;
  detected_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HazardCreate {
  mine_id: string;
  area_id?: string | null;
  reported_by?: string | null;
  title: string;
  description?: string | null;
  category: string;
  severity?: string;
  location?: string | null;
  detected_at?: string | null;
}

export interface DomainIncident {
  id: string;
  mine_id: string;
  area_id?: string | null;
  reported_by?: string | null;
  title: string;
  description?: string | null;
  type: string;
  severity: string;
  status: string;
  occurred_at?: string | null;
  location?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface IncidentCreate {
  mine_id: string;
  area_id?: string | null;
  reported_by?: string | null;
  title: string;
  description?: string | null;
  type: string;
  severity?: string;
  location?: string | null;
  occurred_at?: string | null;
}

export interface AuditEvent {
  id: string;
  actor_id?: string | null;
  action_type: string;
  target_object_type: string;
  target_object_id: string;
  timestamp: string;
  metadata?: Record<string, unknown> | null;
}

