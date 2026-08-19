"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type {
  ScenarioId,
  SimulationScenario,
  SimulationState,
  OperatorActionType,
  SimulationScoreReport,
  Mine,
  DomainHazard,
  DomainIncident,
  ShiftLog,
  Shift,
} from "@coalsafe/types";
import {
  fetchScenarios,
  startSimulation,
  stepSimulation,
  applySimulationAction,
  resetSimulation,
  fetchScoreReport,
  fetchMines,
  fetchHazards,
  fetchIncidents,
  fetchShiftLogs,
  fetchShifts,
} from "@/lib/api";
import { MineMapViewer } from "@/components/simulation/MineMapViewer";
import { TelemetryGauges } from "@/components/simulation/TelemetryGauges";
import { ActionControls } from "@/components/simulation/ActionControls";
import { EventLog } from "@/components/simulation/EventLog";
import { ScoreReportModal } from "@/components/simulation/ScoreReportModal";
import { ShiftHandoverDashboard } from "@/components/handover/ShiftHandoverDashboard";
import { SafetyManagementPlanDashboard } from "@/components/smp/SafetyManagementPlanDashboard";
import { ErpIntegrationHub } from "@/components/erp/ErpIntegrationHub";
import { MineManagement } from "@/components/domain/MineManagement";
import { AreaContextView } from "@/components/domain/AreaContextView";
import { HazardManagement } from "@/components/domain/HazardManagement";
import { IncidentManagement } from "@/components/domain/IncidentManagement";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Award,
  Flame,
  ClipboardList,
  ShieldCheck,
  Layers,
  Activity,
  LayoutDashboard,
  HardHat,
  AlertTriangle,
  Users,
  Pickaxe,
  Building,
  Plus,
  CheckCircle2,
} from "lucide-react";

type NavSection =
  | "DASHBOARD"
  | "MINES"
  | "AREAS"
  | "HAZARDS"
  | "INCIDENTS"
  | "HANDOVER"
  | "SMP"
  | "SIMULATION"
  | "ERP";

export default function CollieryPortalPage() {
  const [activeSection, setActiveSection] = useState<NavSection>("DASHBOARD");

  // Operational Domain State for Dashboard
  const [domainMines, setDomainMines] = useState<Mine[]>([]);
  const [domainHazards, setDomainHazards] = useState<DomainHazard[]>([]);
  const [domainIncidents, setDomainIncidents] = useState<DomainIncident[]>([]);
  const [domainShiftLogs, setDomainShiftLogs] = useState<ShiftLog[]>([]);
  const [domainShifts, setDomainShifts] = useState<Shift[]>([]);
  const [domainLoading, setDomainLoading] = useState<boolean>(true);

  // Simulation State
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId>(
    "METHANE_INRUSH_LONGWALL"
  );
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>("zone-face");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scoreReport, setScoreReport] = useState<SimulationScoreReport | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Operational Domain Data for Real-Time Dashboard
  const loadDomainDashboardData = useCallback(async () => {
    try {
      setDomainLoading(true);
      const [mines, hazards, incidents, logs] = await Promise.all([
        fetchMines().catch(() => []),
        fetchHazards().catch(() => []),
        fetchIncidents().catch(() => []),
        fetchShiftLogs().catch(() => []),
      ]);
      setDomainMines(mines);
      setDomainHazards(hazards);
      setDomainIncidents(incidents);
      setDomainShiftLogs(logs);

      if (mines.length > 0) {
        const shifts = await fetchShifts(mines[0].id).catch(() => []);
        setDomainShifts(shifts);
      } else {
        setDomainShifts([]);
      }
    } catch (err) {
      console.error("Failed to load domain dashboard:", err);
    } finally {
      setDomainLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDomainDashboardData();
  }, [loadDomainDashboardData]);

  // Load Simulation Scenarios
  useEffect(() => {
    async function initSim() {
      try {
        const scenarioList = await fetchScenarios();
        setScenarios(scenarioList);
        if (scenarioList.length > 0) {
          const initial = await startSimulation(scenarioList[0].id);
          setSimState(initial);
        }
      } catch (err: unknown) {
        console.error("Simulation init failed:", err);
      }
    }
    initSim();
  }, []);

  const handleScenarioChange = async (scenarioId: ScenarioId) => {
    setSelectedScenarioId(scenarioId);
    setIsPlaying(false);
    try {
      setIsLoading(true);
      const newState = await startSimulation(scenarioId);
      setSimState(newState);
      setSelectedZoneId("zone-face");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to switch scenario.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep = useCallback(
    async (steps: number = 1) => {
      if (!simState) return;
      try {
        const nextState = await stepSimulation(simState.sessionId, steps);
        setSimState(nextState);
        if (nextState.status === "COMPLETED" || nextState.status === "FAILED") {
          setIsPlaying(false);
          const report = await fetchScoreReport(simState.sessionId);
          setScoreReport(report);
          setIsReportOpen(true);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to advance step.";
        setErrorMsg(message);
      }
    },
    [simState]
  );

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(200, Math.floor(1000 / playbackSpeed));
      timerRef.current = setInterval(() => {
        handleStep(1);
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, handleStep]);

  const handleDispatchAction = async (
    actionType: OperatorActionType,
    targetZoneId?: string
  ) => {
    if (!simState) return;
    try {
      setIsLoading(true);
      await applySimulationAction(simState.sessionId, {
        actionType,
        targetZoneId,
      });
      const updated = await stepSimulation(simState.sessionId, 0);
      setSimState(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to dispatch action.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!simState) return;
    setIsPlaying(false);
    try {
      setIsLoading(true);
      const resetState = await resetSimulation(simState.sessionId);
      setSimState(resetState);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset simulation.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReport = async () => {
    if (!simState) return;
    try {
      const report = await fetchScoreReport(simState.sessionId);
      setScoreReport(report);
      setIsReportOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate report.";
      setErrorMsg(message);
    }
  };

  const selectedZone = simState
    ? simState.zones.find((z) => z.id === selectedZoneId) || null
    : null;

  // Real KPI calculations from persisted records
  const totalProduction = domainShiftLogs.reduce(
    (acc, log) => acc + (log.productionTonnage || 0),
    0
  );
  const totalMinersDeployed = domainShiftLogs.reduce(
    (acc, log) => acc + (log.manpowerDeployed || 0),
    0
  );
  const openHazardsCount = domainHazards.filter((h) => h.status === "OPEN").length;
  const openIncidentsCount = domainIncidents.filter((i) => i.status === "OPEN").length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col font-sans">
      {/* Industrial Top Control Bar */}
      <header className="h-14 border-b border-[#30363d] bg-[#161b22] px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#ea580c] text-white">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-[#e6edf3]">
                COAL<span className="text-[#ea580c]">SAFE</span>
              </span>
              <span className="text-[10px] text-[#8b949e] font-mono ml-2 border-l border-[#30363d] pl-2 hidden sm:inline">
                Colliery Operations & Safety System
              </span>
            </div>
          </div>
        </div>

        {/* Location & Status Pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] font-mono text-[11px] text-[#8b949e]">
            <Building className="w-3.5 h-3.5 text-[#ea580c]" />
            <span className="text-[#e6edf3]">
              {domainMines.length > 0 ? domainMines[0].name : "No Mine Configured"}
            </span>
            {domainMines.length > 0 && (
              <>
                <span>&bull;</span>
                <span>{domainMines[0].code}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#112316] border border-[#238636] text-[#3fb950] font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#238636]" />
            <span className="hidden sm:inline">STATUS:</span> LIVE
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]">
            <HardHat className="w-3.5 h-3.5 text-[#ea580c]" />
            <span className="font-semibold text-xs">Shift Supervisor</span>
          </div>
        </div>
      </header>

      {/* App Body with Sidebar Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Industrial Sidebar */}
        <aside className="w-full md:w-60 bg-[#161b22] border-r border-[#30363d] p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
          <nav className="space-y-4">
            {/* OPERATIONS SECTION */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] px-2.5">
                Operations
              </span>
              <button
                onClick={() => {
                  setActiveSection("DASHBOARD");
                  loadDomainDashboardData();
                }}
                className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium flex items-center gap-2.5 transition ${
                  activeSection === "DASHBOARD"
                    ? "bg-[#21262d] text-[#ea580c] font-semibold border border-[#30363d]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Colliery Overview</span>
              </button>

              <button
                onClick={() => setActiveSection("MINES")}
                className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium flex items-center gap-2.5 transition ${
                  activeSection === "MINES"
                    ? "bg-[#21262d] text-[#ea580c] font-semibold border border-[#30363d]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                }`}
              >
                <Building className="w-4 h-4 shrink-0" />
                <span>Mines & Assets</span>
              </button>

              <button
                onClick={() => setActiveSection("AREAS")}
                className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium flex items-center gap-2.5 transition ${
                  activeSection === "AREAS"
                    ? "bg-[#21262d] text-[#ea580c] font-semibold border border-[#30363d]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Section Context</span>
              </button>

              <button
                onClick={() => setActiveSection("HANDOVER")}
                className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium flex items-center gap-2.5 transition ${
                  activeSection === "HANDOVER"
                    ? "bg-[#21262d] text-[#ea580c] font-semibold border border-[#30363d]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                }`}
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>Shift Handover Logs</span>
              </button>
            </div>

            {/* SAFETY MANAGEMENT SECTION */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] px-2.5">
                Safety & Compliance
              </span>
              <button
                onClick={() => setActiveSection("HAZARDS")}
                className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium flex items-center gap-2.5 transition ${
                  activeSection === "HAZARDS"
                    ? "bg-[#21262d] text-[#ea580c] font-semibold border border-[#30363d]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Hazard Registry</span>
              </button>

              <button
                onClick={() => setActiveSection("INCIDENTS")}
                className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium flex items-center gap-2.5 transition ${
                  activeSection === "INCIDENTS"
                    ? "bg-[#21262d] text-[#ea580c] font-semibold border border-[#30363d]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                }`}
              >
                <Flame className="w-4 h-4 shrink-0" />
                <span>Incident Log</span>
              </button>

              <button
                onClick={() => setActiveSection("SMP")}
                className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium flex items-center gap-2.5 transition ${
                  activeSection === "SMP"
                    ? "bg-[#21262d] text-[#ea580c] font-semibold border border-[#30363d]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>DGMS Safety Plan (SMP)</span>
              </button>
            </div>

            {/* SIMULATION & TRAINING SECTION */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] px-2.5">
                Analysis & Simulator
              </span>
              <button
                onClick={() => setActiveSection("SIMULATION")}
                className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium flex items-center gap-2.5 transition ${
                  activeSection === "SIMULATION"
                    ? "bg-[#21262d] text-[#ea580c] font-semibold border border-[#30363d]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span>Safety Simulator</span>
              </button>
            </div>

            {/* SYSTEM & AUDIT SECTION */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] px-2.5">
                Enterprise System
              </span>
              <button
                onClick={() => setActiveSection("ERP")}
                className={`w-full text-left px-2.5 py-2 rounded text-xs font-medium flex items-center gap-2.5 transition ${
                  activeSection === "ERP"
                    ? "bg-[#21262d] text-[#ea580c] font-semibold border border-[#30363d]"
                    : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2128]"
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>ERP & Audit Hub</span>
              </button>
            </div>
          </nav>

          {/* Statutory Standard Footer Note */}
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] text-[10px] text-[#8b949e] space-y-1 mt-4">
            <span className="font-semibold text-[#c9d1d9] block">DGMS Standards</span>
            <p>CMR 2017 Reg 47/48/104</p>
            <p className="font-mono text-[#ea580c]">SIH1645 Prototype</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: COLLIERY OVERVIEW DASHBOARD */}
          {activeSection === "DASHBOARD" && (
            <div className="space-y-6">
              {/* Page Title */}
              <div>
                <h2 className="text-xl font-bold text-[#e6edf3]">
                  Mine Operations & Safety Status Overview
                </h2>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  Real-time colliery output, active underground personnel, and statutory safety conditions
                </p>
              </div>

              {/* Status Strip KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="flex items-center justify-between text-[#8b949e] text-xs">
                    <span className="uppercase font-mono text-[10px]">Total Production</span>
                    <Pickaxe className="w-4 h-4 text-[#ea580c]" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#e6edf3]">
                    {totalProduction > 0 ? `${totalProduction.toFixed(1)} T` : "0.0 T"}
                  </div>
                  <span className="text-[10px] text-[#8b949e]">
                    {domainShiftLogs.length > 0
                      ? `From ${domainShiftLogs.length} shift log(s)`
                      : "No production records yet"}
                  </span>
                </div>

                <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="flex items-center justify-between text-[#8b949e] text-xs">
                    <span className="uppercase font-mono text-[10px]">Active Miners</span>
                    <Users className="w-4 h-4 text-[#58a6ff]" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#e6edf3]">
                    {totalMinersDeployed > 0 ? `${totalMinersDeployed} Crew` : "0 Crew"}
                  </div>
                  <span className="text-[10px] text-[#8b949e]">
                    {domainMines.length > 0 ? `${domainMines.length} registered mine(s)` : "No active deployment"}
                  </span>
                </div>

                <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="flex items-center justify-between text-[#8b949e] text-xs">
                    <span className="uppercase font-mono text-[10px]">Open Hazards</span>
                    <ShieldCheck className="w-4 h-4 text-[#3fb950]" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#e6edf3]">
                    {openHazardsCount}
                  </div>
                  <span className="text-[10px] text-[#3fb950]">
                    {openHazardsCount === 0 ? "All areas compliant" : `${openHazardsCount} require action`}
                  </span>
                </div>

                <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="flex items-center justify-between text-[#ff7b72] text-xs">
                    <span className="uppercase font-mono text-[10px]">Active Incidents</span>
                    <AlertTriangle className="w-4 h-4 text-[#d29922]" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#ff7b72]">
                    {openIncidentsCount}
                  </div>
                  <span className="text-[10px] text-[#8b949e]">
                    {openIncidentsCount === 0 ? "0 active incidents" : "Action required"}
                  </span>
                </div>
              </div>

              {/* Zero-State Guide Banner if No Mines Configured */}
              {domainMines.length === 0 && !domainLoading && (
                <div className="p-6 rounded-md bg-[#161b22] border border-[#ea580c] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Building className="w-5 h-5 text-[#ea580c]" />
                      <div>
                        <h3 className="text-sm font-bold text-[#e6edf3]">
                          No mines have been configured yet
                        </h3>
                        <p className="text-xs text-[#8b949e] mt-0.5">
                          COALSAFE is initialized with a clean state and zero placeholder data.
                          Get started by creating your first colliery.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveSection("MINES")}
                      className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold text-xs flex items-center gap-1.5 shadow transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Mine
                    </button>
                  </div>
                </div>
              )}

              {/* Active Incidents & Action Dispatch Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3]">
                      Active Statutory Briefings & Hazards
                    </h3>
                    <span className="text-[10px] font-mono text-[#d29922]">
                      {openHazardsCount} Active
                    </span>
                  </div>

                  {domainHazards.filter((h) => h.status === "OPEN").length === 0 ? (
                    <div className="p-4 rounded bg-[#0d1117] border border-[#21262d] text-center text-xs text-[#3fb950] flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> No active hazard briefings.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {domainHazards
                        .filter((h) => h.status === "OPEN")
                        .slice(0, 3)
                        .map((hz) => (
                          <div
                            key={hz.id}
                            className="p-3 rounded bg-[#220d0e] border border-[#f85149] text-xs space-y-1"
                          >
                            <div className="font-semibold text-[#ff7b72] flex items-center justify-between">
                              <span>{hz.title}</span>
                              <span className="text-[10px] font-mono">{hz.severity}</span>
                            </div>
                            {hz.description && (
                              <p className="text-[#c9d1d9] text-[11px]">{hz.description}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3]">
                      Shift Schedule & Handover Status
                    </h3>
                    <span className="text-[10px] font-mono text-[#8b949e]">
                      {domainShifts.length} Scheduled
                    </span>
                  </div>

                  {domainShifts.length === 0 ? (
                    <div className="p-4 rounded bg-[#0d1117] border border-[#21262d] text-center text-xs text-[#8b949e]">
                      No shifts scheduled yet.
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {domainShifts.slice(0, 3).map((shift) => (
                        <div
                          key={shift.id}
                          className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-[#e6edf3]">
                              {shift.shift_type.replace(/_/g, " ")}
                            </div>
                            <div className="text-[11px] text-[#8b949e]">
                              Start: {shift.start_time}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#271d0e] border border-[#bb8009] text-[#d29922] text-[10px] font-bold">
                            {shift.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Jump Action Bar */}
              <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-[#e6edf3]">Quick Statutory Navigation:</span>
                  <span className="text-[#8b949e] ml-2">Access operational modules directly</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSection("MINES")}
                    className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#c9d1d9]"
                  >
                    Manage Mines
                  </button>
                  <button
                    onClick={() => setActiveSection("HANDOVER")}
                    className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#c9d1d9]"
                  >
                    Open Shift Logs
                  </button>
                  <button
                    onClick={() => setActiveSection("SMP")}
                    className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#c9d1d9]"
                  >
                    Safety Plan
                  </button>
                  <button
                    onClick={() => setActiveSection("SIMULATION")}
                    className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-xs font-medium text-white"
                  >
                    Launch Simulator
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: MINES & ASSET MANAGEMENT */}
          {activeSection === "MINES" && <MineManagement />}

          {/* SECTION 3: SECTION CONTEXT VIEW */}
          {activeSection === "AREAS" && <AreaContextView />}

          {/* SECTION 4: HAZARD REGISTRY */}
          {activeSection === "HAZARDS" && <HazardManagement />}

          {/* SECTION 5: INCIDENT LOG */}
          {activeSection === "INCIDENTS" && <IncidentManagement />}

          {/* SECTION 6: DIGITAL SHIFT HANDOVER LOGS */}
          {activeSection === "HANDOVER" && <ShiftHandoverDashboard />}

          {/* SECTION 7: DGMS SAFETY MANAGEMENT PLAN & HIRA */}
          {activeSection === "SMP" && <SafetyManagementPlanDashboard />}

          {/* SECTION 8: ENTERPRISE ERP CONNECTOR & AUDIT LEDGER */}
          {activeSection === "ERP" && <ErpIntegrationHub />}

          {/* SECTION 9: MINE SAFETY SIMULATION STUDIO */}
          {activeSection === "SIMULATION" && (
            <div className="space-y-4">
              {/* Header Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md bg-[#161b22] border border-[#30363d]">
                <div className="flex items-center gap-2.5">
                  <label className="text-xs text-[#8b949e] font-semibold uppercase">Scenario:</label>
                  <select
                    value={selectedScenarioId}
                    onChange={(e) => handleScenarioChange(e.target.value as ScenarioId)}
                    className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-xs font-medium text-[#e6edf3]"
                  >
                    {scenarios.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        [{sc.difficulty}] {sc.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-xs font-mono">
                    <span className="text-[#8b949e]">T+</span>
                    <span className="text-[#ea580c] font-bold ml-1">{simState?.elapsedTimeSeconds || 0}s</span>
                  </div>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`p-1.5 rounded border text-xs font-semibold ${
                      isPlaying
                        ? "bg-[#3c1618] border-[#f85149] text-[#ff7b72]"
                        : "bg-[#112316] border-[#238636] text-[#3fb950]"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleStep(1)}
                    disabled={isPlaying}
                    className="p-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#c9d1d9]"
                    title="Advance 1 Step (+5s)"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 5 : 1)}
                    className="px-2 py-1 rounded bg-[#0d1117] border border-[#30363d] text-xs font-mono font-bold text-[#c9d1d9]"
                  >
                    {playbackSpeed}x
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#c9d1d9]"
                    title="Reset"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleOpenReport}
                    className="px-3 py-1 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-medium text-xs uppercase flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5" /> Debrief
                  </button>
                </div>
              </div>

              {/* Briefing */}
              {simState && (
                <div className="p-3 rounded-md bg-[#161b22] border border-[#30363d] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#e6edf3]">{simState.scenario.title}</span>
                    <p className="text-[#8b949e] text-[11px] mt-0.5">{simState.scenario.briefing}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#ea580c] font-bold">
                      {simState.overallRiskLevel}
                    </span>
                  </div>
                </div>
              )}

              {/* Map Viewer */}
              {simState && (
                <MineMapViewer
                  zones={simState.zones}
                  personnel={simState.personnel}
                  equipment={simState.equipment}
                  selectedZoneId={selectedZoneId}
                  onSelectZone={(id) => setSelectedZoneId(id)}
                />
              )}

              {/* Telemetry */}
              <TelemetryGauges selectedZone={selectedZone} />

              {/* Action Bar & Log */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                  <ActionControls
                    selectedZone={selectedZone}
                    onDispatchAction={handleDispatchAction}
                    isLoading={isLoading}
                  />
                </div>
                <div className="lg:col-span-4">
                  <EventLog events={simState?.events || []} />
                </div>
              </div>

              {/* Score Report Modal */}
              <ScoreReportModal
                report={scoreReport}
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Industrial Footer */}
      <footer className="h-8 border-t border-[#30363d] bg-[#161b22] px-4 flex items-center justify-between text-[11px] font-mono text-[#8b949e] shrink-0">
        <div>COALSAFE Colliery OS &bull; SIH1645 Digital Mine Safety Prototype</div>
        <div>DGMS Circular 02/2011 &bull; CMR 2017 Regulations</div>
      </footer>
    </div>
  );
}
