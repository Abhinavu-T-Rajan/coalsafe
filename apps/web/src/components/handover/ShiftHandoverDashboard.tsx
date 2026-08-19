"use client";

import React, { useState, useEffect } from "react";
import type { ShiftLog, LogType, ShiftType, CreateShiftLogRequest } from "@coalsafe/types";
import {
  fetchShiftLogs,
  createShiftLog,
  completeHandoverSignoff,
  getDownloadPdfUrl,
} from "@/lib/api";
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  Plus,
  Clock,
  Users,
  ShieldAlert,
  X,
  Lock,
  FileCheck,
  Check,
} from "lucide-react";

export const ShiftHandoverDashboard: React.FC = () => {
  const [logs, setLogs] = useState<ShiftLog[]>([]);
  const [activeFilter, setActiveFilter] = useState<LogType | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedLogForSignoff, setSelectedLogForSignoff] = useState<ShiftLog | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Log Form State
  const [newLogType, setNewLogType] = useState<LogType>("OVERMAN_LOG");
  const [newSection, setNewSection] = useState("Longwall Panel LW-01");
  const [newShift, setNewShift] = useState<ShiftType>("SHIFT_1_MORNING");
  const [newSupervisor, setNewSupervisor] = useState("Rajesh Kumar");
  const [newCert, setNewCert] = useState("DGMS/OV/2021/8472");
  const [newManpower, setNewManpower] = useState(26);
  const [newTonnage, setNewTonnage] = useState(580);
  const [newStrata, setNewStrata] = useState("Strata roof stable. Hydraulic props set to 280 bar.");
  const [newVent, setNewVent] = useState("Intake airflow 1550 m3/min, CH4 0.25%.");
  const [newCh4, setNewCh4] = useState(0.35);
  const [newCo, setNewCo] = useState(6.0);
  const [newPendingActions, setNewPendingActions] = useState("Extend gate conveyor belt; Check water barrier.");
  const [hasRedFlag, setHasRedFlag] = useState(false);
  const [rfTitle, setRfTitle] = useState("");
  const [rfDesc, setRfDesc] = useState("");
  const [rfAction, setRfAction] = useState("");

  // Signoff Modal State
  const [incomingName, setIncomingName] = useState("Amit Singh");
  const [incomingRole, setIncomingRole] = useState("Shift Overman (Incoming)");
  const [incomingPin, setIncomingPin] = useState("1234");
  const [handoverNotes, setHandoverNotes] = useState("All red flags, gas readings, and strata observations verified on site.");

  const loadLogs = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchShiftLogs(activeFilter === "ALL" ? undefined : activeFilter);
      setLogs(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load shift logs.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Handle Create Log
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const today = new Date().toISOString().split("T")[0];
      const payload: CreateShiftLogRequest = {
        logType: newLogType,
        mineName: "Singareni Colliery Seam 3",
        seamName: "Queen Seam Bottom Section",
        districtSection: newSection,
        date: today,
        shift: newShift,
        outgoingSupervisorName: newSupervisor,
        outgoingSupervisorRole: newLogType.replace(/_/g, " "),
        outgoingSupervisorCertNo: newCert,
        manpowerDeployed: Number(newManpower),
        productionTonnage: Number(newTonnage),
        strataConditionSummary: newStrata,
        ventilationAdequacy: newVent,
        waterAccumulationStatus: "Dip sump water normal at 0.35m.",
        dustSuppressionActive: true,
        gasReadings: [
          {
            location: newSection,
            ch4Percent: Number(newCh4),
            coPpm: Number(newCo),
            o2Percent: 20.8,
            airVelocityMps: 2.1,
            status: Number(newCh4) >= 0.75 ? "ELEVATED" : "NORMAL",
          },
        ],
        equipmentLogs: [
          {
            equipmentId: "EQ-MAIN-01",
            equipmentName: "Section Primary Machinery",
            operatingHours: 7.0,
            breakdownMinutes: 0.0,
            flpEnclosureChecked: true,
          },
        ],
        redFlags: hasRedFlag && rfTitle
          ? [
              {
                severity: "WARNING",
                title: rfTitle,
                description: rfDesc,
                location: newSection,
                actionRequiredForIncoming: rfAction,
              },
            ]
          : [],
        pendingActionsForNextShift: newPendingActions.split(";").map((s) => s.trim()).filter(Boolean),
        generalRemarks: "All statutory duties performed under Coal Mines Regulations 2017.",
      };

      await createShiftLog(payload);
      setIsCreateModalOpen(false);
      loadLogs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create log.";
      setErrorMsg(message);
    }
  };

  // Handle Handover Signoff
  const handleSignoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogForSignoff) return;
    try {
      await completeHandoverSignoff(selectedLogForSignoff.id, {
        logId: selectedLogForSignoff.id,
        incomingSupervisorName: incomingName,
        incomingSupervisorRole: incomingRole,
        incomingSupervisorPin: incomingPin,
        handoverNotes,
        acceptedRedFlagIds: selectedLogForSignoff.redFlags.map((rf) => rf.id),
      });
      setSelectedLogForSignoff(null);
      loadLogs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Handover signoff failed.";
      setErrorMsg(message);
    }
  };

  // Extract all unacknowledged red flags across logs
  const unacknowledgedRedFlags = logs.flatMap((l) =>
    l.redFlags
      .filter((rf) => !rf.acknowledgedByIncoming)
      .map((rf) => ({
        ...rf,
        logId: l.id,
        logShift: l.shift,
        logSection: l.districtSection,
      }))
  );

  return (
    <div className="space-y-6">
      {/* Industrial Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#ea580c]" />
            <h2 className="text-xl font-bold tracking-tight text-[#e6edf3]">
              Digital Shift Handover Logs
            </h2>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Statutory shift documentation & incoming supervisor sign-off under DGMS CMR 2017 (Reg 47, 48, 51, 53)
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-md bg-[#ea580c] hover:bg-[#c2410c] text-white font-medium text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> New Shift Log
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-md bg-[#3c1618] border border-[#f85149] text-xs text-[#ff7b72] flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="underline text-[#ff7b72] font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Critical Red Flags Alert Panel */}
      {unacknowledgedRedFlags.length > 0 && (
        <div className="p-4 rounded-md bg-[#220d0e] border border-[#f85149] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#ff7b72] font-semibold text-xs uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-[#f85149]" />
              <span>Active Safety Red Flags Requiring Incoming Shift Briefing</span>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#3c1618] text-[#ff7b72] border border-[#f85149]/40">
              {unacknowledgedRedFlags.length} PENDING BRIEFING
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unacknowledgedRedFlags.map((rf, idx) => (
              <div
                key={`${rf.id}-${idx}`}
                className="p-3 rounded bg-[#161b22] border border-[#30363d] text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#ff7b72] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#d29922]" />
                    {rf.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#8b949e]">{rf.location}</span>
                </div>
                <p className="text-[#c9d1d9] text-[11px] leading-relaxed">{rf.description}</p>
                <div className="pt-1.5 border-t border-[#21262d] text-[11px] text-[#d29922]">
                  <strong className="text-[#8b949e]">Required Action:</strong> {rf.actionRequiredForIncoming}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#21262d]">
        {[
          { id: "ALL", label: "All Logs" },
          { id: "OVERMAN_LOG", label: "Overman (Reg 48)" },
          { id: "MINING_SIRDAR_LOG", label: "Mining Sirdar (Reg 47)" },
          { id: "VENTILATION_OFFICER_LOG", label: "Ventilation (Reg 51)" },
          { id: "ELECTRICAL_MECHANICAL_LOG", label: "Electrical / Mech (Reg 53)" },
          { id: "HEMM_OPERATOR_LOG", label: "HEMM Operator" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id as LogType | "ALL")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              activeFilter === f.id
                ? "bg-[#21262d] text-[#ea580c] border border-[#30363d]"
                : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs Register */}
      {isLoading ? (
        <div className="p-12 text-center text-[#8b949e] font-mono text-xs">Loading statutory shift records...</div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-[#8b949e] rounded-md bg-[#161b22] border border-[#30363d] text-xs">
          No logs found for this statutory filter.
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const isPending = log.handoverStatus === "PENDING_HANDOVER";

            return (
              <div
                key={log.id}
                className="p-4 rounded-md border border-[#30363d] bg-[#161b22] space-y-3.5 shadow-sm hover:border-[#484f58] transition"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#21262d]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]">
                        {log.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#21262d] text-[#c9d1d9]">
                        {log.logType.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] font-mono text-[#8b949e]">
                        {log.cmrRegulationRef}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#e6edf3]">
                      {log.seamName} &bull; {log.districtSection}
                    </h3>
                  </div>

                  {/* Badges & PDF Button */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                        isPending
                          ? "bg-[#271d0e] border-[#bb8009] text-[#d29922]"
                          : "bg-[#112316] border-[#238636] text-[#3fb950]"
                      }`}
                    >
                      {isPending ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isPending ? "PENDING HANDOVER" : "HANDOVER SIGNED"}
                    </span>

                    <a
                      href={getDownloadPdfUrl(log.id)}
                      download
                      className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] text-xs font-medium flex items-center gap-1.5 transition"
                      title="Download Official Statutory PDF Report"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[#ea580c]" />
                      <span>PDF</span>
                    </a>
                  </div>
                </div>

                {/* Industrial Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                    <span className="text-[10px] text-[#8b949e] block uppercase font-mono">Date & Shift</span>
                    <span className="font-semibold text-[#e6edf3]">
                      {log.date} ({log.shift.replace("SHIFT_", "S-")})
                    </span>
                  </div>

                  <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                    <span className="text-[10px] text-[#8b949e] block uppercase font-mono">Outgoing Official</span>
                    <span className="font-semibold text-[#e6edf3]">{log.outgoingSupervisorName}</span>
                    <span className="text-[10px] text-[#8b949e] block font-mono">{log.outgoingSupervisorCertNo}</span>
                  </div>

                  <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                    <span className="text-[10px] text-[#8b949e] block uppercase font-mono">Output & Crew</span>
                    <span className="font-semibold text-[#e6edf3] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#58a6ff]" /> {log.manpowerDeployed} miners &bull; {log.productionTonnage.toFixed(0)} T
                    </span>
                  </div>

                  <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                    <span className="text-[10px] text-[#8b949e] block uppercase font-mono">Gas Telemetry</span>
                    <span className="font-semibold text-[#e6edf3] font-mono">
                      CH4: {log.gasReadings[0]?.ch4Percent.toFixed(2) || "0.00"}% | CO: {log.gasReadings[0]?.coPpm.toFixed(0) || "0"}ppm
                    </span>
                  </div>
                </div>

                {/* Section Observations & Pending Actions */}
                <div className="p-3 rounded bg-[#0d1117] border border-[#21262d] text-xs space-y-1.5">
                  <div className="text-[#8b949e]">
                    <strong className="text-[#c9d1d9]">Strata & Ventilation: </strong>
                    <span>{log.strataConditionSummary} &mdash; {log.ventilationAdequacy}</span>
                  </div>
                  {log.pendingActionsForNextShift.length > 0 && (
                    <div className="pt-1.5 border-t border-[#21262d] text-[#d29922]">
                      <strong className="text-[#8b949e]">Pending for Next Shift: </strong>
                      <span>{log.pendingActionsForNextShift.join(" • ")}</span>
                    </div>
                  )}
                </div>

                {/* Footer Handover Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] font-mono text-[#8b949e] flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    <span>SHA-256: {log.sha256Hash.slice(0, 16)}...</span>
                  </div>

                  {isPending ? (
                    <button
                      onClick={() => setSelectedLogForSignoff(log)}
                      className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-medium text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> Sign-Off Handover
                    </button>
                  ) : (
                    <div className="text-xs text-[#3fb950] font-medium flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledged & Signed by {log.incomingSupervisorName} ({log.handoverCompletedAt})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Shift Log */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md bg-[#161b22] border border-[#30363d] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <h3 className="text-base font-bold text-[#e6edf3] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#ea580c]" /> New Statutory Shift Handover Record
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#8b949e] hover:text-[#c9d1d9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8b949e] block mb-1">Statutory Logbook Type</label>
                  <select
                    value={newLogType}
                    onChange={(e) => setNewLogType(e.target.value as LogType)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="OVERMAN_LOG">Overman Log (CMR Reg 48)</option>
                    <option value="MINING_SIRDAR_LOG">Mining Sirdar Log (CMR Reg 47)</option>
                    <option value="VENTILATION_OFFICER_LOG">Ventilation Officer Log (CMR Reg 51)</option>
                    <option value="ELECTRICAL_MECHANICAL_LOG">Electrical/Mechanical Log (CMR Reg 53)</option>
                    <option value="HEMM_OPERATOR_LOG">HEMM Operator Log</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8b949e] block mb-1">Shift</label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value as ShiftType)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="SHIFT_1_MORNING">Shift 1 (06:00 - 14:00)</option>
                    <option value="SHIFT_2_AFTERNOON">Shift 2 (14:00 - 22:00)</option>
                    <option value="SHIFT_3_NIGHT">Shift 3 (22:00 - 06:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[#8b949e] block mb-1">District / Section</label>
                  <input
                    type="text"
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">Outgoing Official Name</label>
                  <input
                    type="text"
                    value={newSupervisor}
                    onChange={(e) => setNewSupervisor(e.target.value)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">DGMS Certificate No</label>
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[#8b949e] block mb-1">Crew Count</label>
                  <input
                    type="number"
                    value={newManpower}
                    onChange={(e) => setNewManpower(Number(e.target.value))}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">Tonnage (T)</label>
                  <input
                    type="number"
                    value={newTonnage}
                    onChange={(e) => setNewTonnage(Number(e.target.value))}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">CH4 (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCh4}
                    onChange={(e) => setNewCh4(Number(e.target.value))}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">CO (ppm)</label>
                  <input
                    type="number"
                    value={newCo}
                    onChange={(e) => setNewCo(Number(e.target.value))}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] block mb-1">Strata Roof & Side Observations</label>
                <input
                  type="text"
                  value={newStrata}
                  onChange={(e) => setNewStrata(e.target.value)}
                  className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] block mb-1">Pending Priority Actions for Next Shift</label>
                <input
                  type="text"
                  value={newPendingActions}
                  onChange={(e) => setNewPendingActions(e.target.value)}
                  className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  placeholder="Separate tasks with semicolons (;)"
                />
              </div>

              {/* Red Flag Selector */}
              <div className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#ff7b72]">
                  <input
                    type="checkbox"
                    checked={hasRedFlag}
                    onChange={(e) => setHasRedFlag(e.target.checked)}
                    className="rounded text-[#ea580c] focus:ring-0"
                  />
                  <span>Attach Safety Red Flag to Shift Handover</span>
                </label>

                {hasRedFlag && (
                  <div className="space-y-2 pt-2">
                    <input
                      type="text"
                      placeholder="Red Flag Title (e.g. Methane spike at Return Airway)"
                      value={rfTitle}
                      onChange={(e) => setRfTitle(e.target.value)}
                      className="w-full p-2 rounded bg-[#161b22] border border-[#30363d] text-[#e6edf3]"
                    />
                    <input
                      type="text"
                      placeholder="Detailed Hazard Description"
                      value={rfDesc}
                      onChange={(e) => setRfDesc(e.target.value)}
                      className="w-full p-2 rounded bg-[#161b22] border border-[#30363d] text-[#e6edf3]"
                    />
                    <input
                      type="text"
                      placeholder="Mandatory Action for Incoming Supervisor"
                      value={rfAction}
                      onChange={(e) => setRfAction(e.target.value)}
                      className="w-full p-2 rounded bg-[#161b22] border border-[#30363d] text-[#e6edf3]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#21262d]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-medium uppercase tracking-wider"
                >
                  Submit Statutory Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Handover Sign-off */}
      {selectedLogForSignoff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-md bg-[#161b22] border border-[#30363d] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <h3 className="text-base font-bold text-[#e6edf3] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#3fb950]" /> Incoming Shift Handover Sign-Off
              </h3>
              <button onClick={() => setSelectedLogForSignoff(null)} className="text-[#8b949e] hover:text-[#c9d1d9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSignoff} className="space-y-3.5 text-xs">
              <div className="p-3 rounded bg-[#0d1117] border border-[#21262d] space-y-1">
                <span className="text-[#8b949e]">Taking over responsibility from:</span>
                <div className="font-semibold text-[#e6edf3]">
                  {selectedLogForSignoff.outgoingSupervisorName} ({selectedLogForSignoff.outgoingSupervisorRole})
                </div>
                <div className="text-[11px] text-[#d29922]">
                  District: {selectedLogForSignoff.districtSection} ({selectedLogForSignoff.shift})
                </div>
              </div>

              {selectedLogForSignoff.redFlags.length > 0 && (
                <div className="p-3 rounded bg-[#220d0e] border border-[#f85149] space-y-2">
                  <div className="font-semibold text-[#ff7b72] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#d29922]" />
                    <span>Acknowledge Safety Red Flags:</span>
                  </div>
                  {selectedLogForSignoff.redFlags.map((rf) => (
                    <div key={rf.id} className="text-[11px] text-[#c9d1d9] pl-2 border-l-2 border-[#f85149]">
                      <strong>{rf.title}:</strong> {rf.actionRequiredForIncoming}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8b949e] block mb-1">Incoming Official Name</label>
                  <input
                    type="text"
                    required
                    value={incomingName}
                    onChange={(e) => setIncomingName(e.target.value)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">Designation / Role</label>
                  <input
                    type="text"
                    required
                    value={incomingRole}
                    onChange={(e) => setIncomingRole(e.target.value)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] block mb-1">Digital Authorization PIN</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={incomingPin}
                  onChange={(e) => setIncomingPin(e.target.value)}
                  className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3] font-mono tracking-widest text-center"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="text-[#8b949e] block mb-1">Handover Verification Notes</label>
                <input
                  type="text"
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#21262d]">
                <button
                  type="button"
                  onClick={() => setSelectedLogForSignoff(null)}
                  className="px-3.5 py-1.5 rounded bg-[#21262d] text-[#c9d1d9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-medium uppercase tracking-wider"
                >
                  Confirm & Sign Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
