import type {
  ActionResult,
  AreaContext,
  AuditEvent,
  CreateHiraRequest,
  CreateShiftLogRequest,
  DomainHazard,
  DomainIncident,
  Equipment,
  EquipmentCreate,
  ErpSyncPayload,
  Handover,
  HandoverCreate,
  HandoverSignoffRequest,
  HazardCategory,
  HazardCreate,
  HiraRecord,
  IncidentCreate,
  LogType,
  Mine,
  MineArea,
  MineAreaCreate,
  MineContext,
  MineCreate,
  Person,
  PersonCreate,
  ScenarioId,
  Shift,
  ShiftCreate,
  ShiftLog,
  SimulationActionRequest,
  SimulationScenario,
  SimulationScoreReport,
  SimulationState,
  SmpSummary,
} from "@coalsafe/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ===========================================================================
// Simulation API
// ===========================================================================

export async function fetchScenarios(): Promise<SimulationScenario[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/simulations/scenarios`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch scenarios");
  return res.json();
}

export async function startSimulation(scenarioId: ScenarioId): Promise<SimulationState> {
  const res = await fetch(`${API_BASE_URL}/api/v1/simulations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId }),
  });
  if (!res.ok) throw new Error("Failed to start simulation session");
  return res.json();
}

export async function getSimulationState(sessionId: string): Promise<SimulationState> {
  const res = await fetch(`${API_BASE_URL}/api/v1/simulations/${sessionId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch simulation state");
  return res.json();
}

export async function stepSimulation(
  sessionId: string,
  steps: number = 1
): Promise<SimulationState> {
  const res = await fetch(`${API_BASE_URL}/api/v1/simulations/${sessionId}/step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ steps }),
  });
  if (!res.ok) throw new Error("Failed to advance simulation");
  return res.json();
}

export async function applySimulationAction(
  sessionId: string,
  actionRequest: SimulationActionRequest
): Promise<ActionResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/simulations/${sessionId}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(actionRequest),
  });
  if (!res.ok) throw new Error("Failed to execute operator action");
  return res.json();
}

export async function resetSimulation(sessionId: string): Promise<SimulationState> {
  const res = await fetch(`${API_BASE_URL}/api/v1/simulations/${sessionId}/reset`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset simulation");
  return res.json();
}

export async function fetchScoreReport(sessionId: string): Promise<SimulationScoreReport> {
  const res = await fetch(`${API_BASE_URL}/api/v1/simulations/${sessionId}/report`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch score report");
  return res.json();
}

// ===========================================================================
// Digital Shift Handover Logs API (Pillar 1)
// ===========================================================================

export async function fetchShiftLogs(logType?: LogType): Promise<ShiftLog[]> {
  const url = logType
    ? `${API_BASE_URL}/api/v1/shift-logs?logType=${logType}`
    : `${API_BASE_URL}/api/v1/shift-logs`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch shift logs");
  return res.json();
}

export async function createShiftLog(payload: CreateShiftLogRequest): Promise<ShiftLog> {
  const res = await fetch(`${API_BASE_URL}/api/v1/shift-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create shift log");
  return res.json();
}

export async function completeHandoverSignoff(
  logId: string,
  payload: HandoverSignoffRequest
): Promise<ShiftLog> {
  const res = await fetch(`${API_BASE_URL}/api/v1/shift-logs/${logId}/handover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to complete handover signoff");
  return res.json();
}

export function getDownloadPdfUrl(logId: string): string {
  return `${API_BASE_URL}/api/v1/shift-logs/${logId}/pdf`;
}

// ===========================================================================
// DGMS Safety Management Plan & HIRA API (Pillar 2)
// ===========================================================================

export async function fetchHiraHazards(category?: HazardCategory): Promise<HiraRecord[]> {
  const url = category
    ? `${API_BASE_URL}/api/v1/smp/hazards?category=${category}`
    : `${API_BASE_URL}/api/v1/smp/hazards`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch HIRA hazards");
  return res.json();
}

export async function createHiraHazard(payload: CreateHiraRequest): Promise<HiraRecord> {
  const res = await fetch(`${API_BASE_URL}/api/v1/smp/hazards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to register HIRA hazard");
  return res.json();
}

export async function fetchSmpSummary(): Promise<SmpSummary> {
  const res = await fetch(`${API_BASE_URL}/api/v1/smp/summary`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch SMP summary");
  return res.json();
}

// ===========================================================================
// ERP Integration Bridge API (Pillar 3)
// ===========================================================================

export async function fetchErpSyncLogs(): Promise<ErpSyncPayload[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/erp/sync-logs`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch ERP sync logs");
  return res.json();
}

export async function triggerErpSync(logId: string): Promise<ErpSyncPayload> {
  const res = await fetch(`${API_BASE_URL}/api/v1/erp/sync/${logId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to synchronize with ERP");
  return res.json();
}

// ===========================================================================
// Domain Ontology API
// ===========================================================================

export async function fetchMines(): Promise<Mine[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch mines");
  return res.json();
}

export async function createMine(payload: MineCreate): Promise<Mine> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create mine");
  return res.json();
}

export async function getMine(mineId: string): Promise<Mine> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch mine");
  return res.json();
}

export async function getMineContext(mineId: string): Promise<MineContext> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}/context`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch mine context");
  return res.json();
}

export async function fetchAreas(mineId: string): Promise<MineArea[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}/areas`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch mine areas");
  return res.json();
}

export async function createArea(mineId: string, payload: MineAreaCreate): Promise<MineArea> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}/areas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create mine area");
  return res.json();
}

export async function getAreaContext(areaId: string): Promise<AreaContext> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/areas/${areaId}/context`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch area context");
  return res.json();
}

export async function fetchPeople(mineId: string): Promise<Person[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}/people`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch personnel");
  return res.json();
}

export async function createPerson(mineId: string, payload: PersonCreate): Promise<Person> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}/people`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to add personnel");
  return res.json();
}

export async function fetchEquipment(mineId: string, areaId?: string): Promise<Equipment[]> {
  const url = areaId
    ? `${API_BASE_URL}/api/v1/ontology/mines/${mineId}/equipment?area_id=${areaId}`
    : `${API_BASE_URL}/api/v1/ontology/mines/${mineId}/equipment`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch equipment");
  return res.json();
}

export async function createEquipment(mineId: string, payload: EquipmentCreate): Promise<Equipment> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}/equipment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to add equipment");
  return res.json();
}

export async function fetchShifts(mineId: string): Promise<Shift[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}/shifts`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch shifts");
  return res.json();
}

export async function createShift(mineId: string, payload: ShiftCreate): Promise<Shift> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}/shifts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create shift");
  return res.json();
}

export async function fetchHandovers(mineId: string): Promise<Handover[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/mines/${mineId}/handovers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch handovers");
  return res.json();
}

export async function createHandover(shiftId: string, payload: HandoverCreate): Promise<Handover> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/shifts/${shiftId}/handovers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create handover");
  return res.json();
}

export async function submitHandover(handoverId: string, actorId?: string): Promise<Handover> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/handovers/${handoverId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id: actorId }),
  });
  if (!res.ok) throw new Error("Failed to submit handover");
  return res.json();
}

export async function acknowledgeHandover(
  handoverId: string,
  actorId?: string,
  notes?: string
): Promise<Handover> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/handovers/${handoverId}/acknowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id: actorId, notes }),
  });
  if (!res.ok) throw new Error("Failed to acknowledge handover");
  return res.json();
}

export async function fetchHazards(mineId?: string, areaId?: string): Promise<DomainHazard[]> {
  let url = `${API_BASE_URL}/api/v1/ontology/hazards`;
  const params = new URLSearchParams();
  if (mineId) params.append("mine_id", mineId);
  if (areaId) params.append("area_id", areaId);
  if (params.toString()) url += `?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch hazards");
  return res.json();
}

export async function reportHazard(payload: HazardCreate): Promise<DomainHazard> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/hazards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to report hazard");
  return res.json();
}

export async function closeHazard(
  hazardId: string,
  actorId?: string,
  resolutionNotes?: string
): Promise<DomainHazard> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/hazards/${hazardId}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id: actorId, resolution_notes: resolutionNotes }),
  });
  if (!res.ok) throw new Error("Failed to close hazard");
  return res.json();
}

export async function fetchIncidents(mineId?: string, areaId?: string): Promise<DomainIncident[]> {
  let url = `${API_BASE_URL}/api/v1/ontology/incidents`;
  const params = new URLSearchParams();
  if (mineId) params.append("mine_id", mineId);
  if (areaId) params.append("area_id", areaId);
  if (params.toString()) url += `?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function createIncident(payload: IncidentCreate): Promise<DomainIncident> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to record incident");
  return res.json();
}

export async function resolveIncident(
  incidentId: string,
  actorId?: string,
  resolutionNotes?: string
): Promise<DomainIncident> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ontology/incidents/${incidentId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id: actorId, resolution_notes: resolutionNotes }),
  });
  if (!res.ok) throw new Error("Failed to resolve incident");
  return res.json();
}

export async function fetchAuditEvents(targetObjectType?: string): Promise<AuditEvent[]> {
  const url = targetObjectType
    ? `${API_BASE_URL}/api/v1/ontology/audit-events?target_object_type=${targetObjectType}`
    : `${API_BASE_URL}/api/v1/ontology/audit-events`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch audit events");
  return res.json();
}

