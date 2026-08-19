"use client";

import React, { useState, useEffect } from "react";
import type {
  HiraRecord,
  SmpSummary,
  HazardCategory,
  ControlHierarchy,
  CreateHiraRequest,
} from "@coalsafe/types";
import { fetchHiraHazards, createHiraHazard, fetchSmpSummary } from "@/lib/api";
import {
  ShieldCheck,
  CheckCircle,
  Plus,
  Grid,
  Users,
  X,
  FileText,
} from "lucide-react";

export const SafetyManagementPlanDashboard: React.FC = () => {
  const [hazards, setHazards] = useState<HiraRecord[]>([]);
  const [summary, setSummary] = useState<SmpSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<HazardCategory | "ALL">("ALL");
  const [selectedRpnFilter, setSelectedRpnFilter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [newCat, setNewCat] = useState<HazardCategory>("STRATA_CONTROL");
  const [newActivity, setNewActivity] = useState("Continuous Miner Heading Extraction");
  const [newDesc, setNewDesc] = useState("Roof convergence along geological slip plane.");
  const [newConsequence, setNewConsequence] = useState("Strata collapse, entrapment of machinery.");
  const [newInitL, setNewInitL] = useState(4);
  const [newInitC, setNewInitC] = useState(4);
  const [newControl, setNewControl] = useState<ControlHierarchy>("ENGINEERING_CONTROL");
  const [newMeasures, setNewMeasures] = useState(
    "Install 2.4m resin roof bolts at 1.0m grid; Tell-tale extensometers"
  );
  const [newResL, setNewResL] = useState(2);
  const [newResC, setNewResC] = useState(2);
  const [newOfficial, setNewOfficial] = useState("Colliery Strata Engineer & Safety Officer");
  const [newFreq, setNewFreq] = useState("EVERY_SHIFT");
  const [newGreen, setNewGreen] = useState("Roof sag < 2mm/shift; Load cell < 250 bar");
  const [newYellow, setNewYellow] = useState("Roof sag 2-5mm/shift. Install additional cable bolts.");
  const [newRed, setNewRed] = useState("Roof sag > 5mm/shift. Immediate withdrawal of miners.");

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [hData, sData] = await Promise.all([
        fetchHiraHazards(selectedCategory === "ALL" ? undefined : selectedCategory),
        fetchSmpSummary(),
      ]);
      setHazards(hData);
      setSummary(sData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load SMP data.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateHiraRequest = {
        hazardCategory: newCat,
        activity: newActivity,
        hazardDescription: newDesc,
        potentialConsequence: newConsequence,
        initialLikelihood: Number(newInitL),
        initialConsequence: Number(newInitC),
        hierarchyOfControl: newControl,
        controlMeasures: newMeasures
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean),
        sopReference: `SOP-${newCat.slice(0, 3)}-2024`,
        residualLikelihood: Number(newResL),
        residualConsequence: Number(newResC),
        accountableOfficialRole: newOfficial,
        inspectionFrequency: newFreq,
        tarpNormalGreen: newGreen,
        tarpTriggerYellow: newYellow,
        tarpActionRed: newRed,
      };

      await createHiraHazard(payload);
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to register hazard.";
      setErrorMsg(message);
    }
  };

  const filteredHazards = selectedRpnFilter
    ? hazards.filter(
        (h) => h.initialRpn === selectedRpnFilter || h.residualRpn === selectedRpnFilter
      )
    : hazards;

  return (
    <div className="space-y-6">
      {/* Industrial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#ea580c]" />
            <h2 className="text-xl font-bold tracking-tight text-[#e6edf3]">
              Safety Management Plan (SMP) & HIRA Register
            </h2>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Hazard Identification & Risk Assessment as per DGMS Circular 02/2011 & Coal Mines Regulations 2017 (Reg 104)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-md bg-[#ea580c] hover:bg-[#c2410c] text-white font-medium text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Register New Hazard
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-md bg-[#3c1618] border border-[#f85149] text-xs text-[#ff7b72] flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-md bg-[#161b22] border border-[#30363d]">
            <span className="text-[10px] uppercase font-mono text-[#8b949e]">Total Registered</span>
            <div className="text-2xl font-bold font-mono text-[#e6edf3]">{summary.totalHazardsIdentified}</div>
            <span className="text-[10px] text-[#8b949e]">Colliery HIRA Records</span>
          </div>

          <div className="p-3.5 rounded-md bg-[#220d0e] border border-[#f85149]">
            <span className="text-[10px] uppercase font-mono text-[#ff7b72]">High Risk (Intolerable)</span>
            <div className="text-2xl font-bold font-mono text-[#ff7b72]">{summary.highRiskCount}</div>
            <span className="text-[10px] text-[#ff7b72]/80">RPN 15 &ndash; 25</span>
          </div>

          <div className="p-3.5 rounded-md bg-[#271d0e] border border-[#bb8009]">
            <span className="text-[10px] uppercase font-mono text-[#d29922]">Medium (ALARP)</span>
            <div className="text-2xl font-bold font-mono text-[#d29922]">{summary.mediumRiskAlarpCount}</div>
            <span className="text-[10px] text-[#d29922]/80">RPN 6 &ndash; 14</span>
          </div>

          <div className="p-3.5 rounded-md bg-[#112316] border border-[#238636]">
            <span className="text-[10px] uppercase font-mono text-[#3fb950]">Low (Acceptable)</span>
            <div className="text-2xl font-bold font-mono text-[#3fb950]">{summary.lowRiskAcceptableCount}</div>
            <span className="text-[10px] text-[#3fb950]/80">RPN 1 &ndash; 5</span>
          </div>

          <div className="p-3.5 rounded-md bg-[#161b22] border border-[#30363d] col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-mono text-[#58a6ff]">Audit Compliance</span>
            <div className="text-2xl font-bold font-mono text-[#58a6ff]">
              {summary.dgmsAuditComplianceRate.toFixed(1)}%
            </div>
            <span className="text-[10px] text-[#8b949e]">CMR 104 Verified</span>
          </div>
        </div>
      )}

      {/* 5x5 HIRA Matrix */}
      <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#e6edf3]">
            <Grid className="w-4 h-4 text-[#ea580c]" />
            <span>5x5 DGMS Consequence &times; Likelihood Risk Matrix</span>
          </div>
          {selectedRpnFilter && (
            <button
              onClick={() => setSelectedRpnFilter(null)}
              className="text-xs text-[#ea580c] underline font-mono font-medium"
            >
              Clear RPN Filter ({selectedRpnFilter})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[600px] grid grid-cols-6 gap-1 text-center text-[10px] font-mono">
            {/* Header */}
            <div className="p-2 text-[#8b949e] font-semibold bg-[#0d1117] rounded">Likelihood \ Consequence</div>
            <div className="p-2 text-[#8b949e] font-semibold bg-[#0d1117] rounded">1. Minor</div>
            <div className="p-2 text-[#8b949e] font-semibold bg-[#0d1117] rounded">2. Moderate</div>
            <div className="p-2 text-[#8b949e] font-semibold bg-[#0d1117] rounded">3. Serious</div>
            <div className="p-2 text-[#8b949e] font-semibold bg-[#0d1117] rounded">4. Major</div>
            <div className="p-2 text-[#8b949e] font-semibold bg-[#0d1117] rounded">5. Catastrophic</div>

            {/* Matrix Rows (5 down to 1) */}
            {[5, 4, 3, 2, 1].map((likelihood) => (
              <React.Fragment key={likelihood}>
                <div className="p-2 text-[#8b949e] font-semibold bg-[#0d1117] rounded flex items-center justify-center">
                  L{likelihood}
                </div>
                {[1, 2, 3, 4, 5].map((consequence) => {
                  const rpn = likelihood * consequence;
                  const isHigh = rpn >= 15;
                  const isMedium = rpn >= 6 && rpn < 15;
                  const cellBg = isHigh
                    ? "bg-[#3c1618] border-[#f85149] text-[#ff7b72] hover:bg-[#4c1f22]"
                    : isMedium
                    ? "bg-[#271d0e] border-[#bb8009] text-[#d29922] hover:bg-[#392914]"
                    : "bg-[#112316] border-[#238636] text-[#3fb950] hover:bg-[#1a3821]";

                  const countInCell = hazards.filter(
                    (h) =>
                      (h.initialLikelihood === likelihood && h.initialConsequence === consequence) ||
                      (h.residualLikelihood === likelihood && h.residualConsequence === consequence)
                  ).length;

                  return (
                    <div
                      key={`${likelihood}-${consequence}`}
                      onClick={() => setSelectedRpnFilter(rpn)}
                      className={`p-2 rounded border cursor-pointer transition flex flex-col items-center justify-center ${cellBg} ${
                        selectedRpnFilter === rpn ? "ring-2 ring-[#ea580c]" : ""
                      }`}
                    >
                      <span className="font-bold text-xs">{rpn}</span>
                      {countInCell > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0d1117] text-[#e6edf3] mt-0.5">
                          {countInCell} hazards
                        </span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#21262d]">
        {[
          { id: "ALL", label: "All Categories" },
          { id: "STRATA_CONTROL", label: "Strata Control" },
          { id: "MINE_GAS_VENTILATION", label: "Gas & Ventilation" },
          { id: "FIRE_EXPLOSION", label: "Fire & Heating" },
          { id: "INUNDATION_WATER", label: "Inundation & Water" },
          { id: "HEMM_TRANSPORT", label: "HEMM & Transport" },
          { id: "ELECTRICITY_MACHINERY", label: "Electricity & Machinery" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedCategory(f.id as HazardCategory | "ALL")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === f.id
                ? "bg-[#21262d] text-[#ea580c] border border-[#30363d]"
                : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* HIRA Registry Cards */}
      <div className="space-y-3">
        {filteredHazards.map((h) => {
          return (
            <div
              key={h.id}
              className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3 shadow-sm hover:border-[#484f58] transition"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#21262d]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#ea580c]">
                      {h.hazardCode}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#21262d] text-[#c9d1d9]">
                      {h.hazardCategory.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-[#8b949e]">
                      Activity: {h.activity}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#e6edf3]">{h.hazardDescription}</h3>
                  <p className="text-xs text-[#ff7b72]">
                    <strong className="text-[#8b949e]">Worst-case Consequence:</strong> {h.potentialConsequence}
                  </p>
                </div>

                {/* RPN comparison */}
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-[#0d1117] border border-[#21262d] text-center">
                    <span className="text-[9px] text-[#8b949e] block uppercase font-mono">Initial RPN</span>
                    <span className={`font-bold font-mono text-sm ${h.initialRpn >= 15 ? "text-[#ff7b72]" : "text-[#d29922]"}`}>
                      {h.initialRpn} ({h.initialRiskCategory})
                    </span>
                  </div>
                  <span className="text-[#8b949e] font-bold">&rarr;</span>
                  <div className="p-2 rounded bg-[#0d1117] border border-[#21262d] text-center">
                    <span className="text-[9px] text-[#8b949e] block uppercase font-mono">Residual RPN</span>
                    <span className="font-bold font-mono text-sm text-[#3fb950]">
                      {h.residualRpn} ({h.residualRiskCategory})
                    </span>
                  </div>
                </div>
              </div>

              {/* Hierarchy of Controls */}
              <div className="p-3 rounded bg-[#0d1117] border border-[#21262d] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#8b949e]">
                  <span className="font-semibold text-[#ea580c]">
                    Control Hierarchy: {h.hierarchyOfControl.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-[#8b949e]">{h.sopReference}</span>
                </div>
                <ul className="space-y-1 text-[#c9d1d9]">
                  {h.controlMeasures.map((cm, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#ea580c]">&bull;</span>
                      <span>{cm}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* TARP Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded bg-[#112316] border border-[#238636]">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#3fb950] block mb-0.5">
                    TARP Level 1: Normal (Green)
                  </span>
                  <p className="text-[#c9d1d9] text-[11px]">{h.tarpNormalGreen}</p>
                </div>

                <div className="p-2.5 rounded bg-[#271d0e] border border-[#bb8009]">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#d29922] block mb-0.5">
                    TARP Level 2: Trigger (Yellow)
                  </span>
                  <p className="text-[#c9d1d9] text-[11px]">{h.tarpTriggerYellow}</p>
                </div>

                <div className="p-2.5 rounded bg-[#220d0e] border border-[#f85149]">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#ff7b72] block mb-0.5">
                    TARP Level 3: Action (Red)
                  </span>
                  <p className="text-[#c9d1d9] text-[11px]">{h.tarpActionRed}</p>
                </div>
              </div>

              {/* Accountability Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#8b949e]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span><strong>Accountable Official:</strong> {h.accountableOfficialRole}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>Inspection: {h.inspectionFrequency}</span>
                  <span className="text-[#3fb950] font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> DGMS Audit Verified ({h.lastAuditDate})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register Hazard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md bg-[#161b22] border border-[#30363d] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <h3 className="text-base font-bold text-[#e6edf3] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#ea580c]" /> Register Colliery Hazard (DGMS SMP)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8b949e] hover:text-[#c9d1d9]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHazard} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8b949e] block mb-1">Hazard Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as HazardCategory)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="STRATA_CONTROL">Strata & Roof Control</option>
                    <option value="MINE_GAS_VENTILATION">Mine Gas & Ventilation</option>
                    <option value="FIRE_EXPLOSION">Fire & Explosion</option>
                    <option value="INUNDATION_WATER">Inundation & Water</option>
                    <option value="HEMM_TRANSPORT">HEMM & Transport</option>
                    <option value="ELECTRICITY_MACHINERY">Electricity & Machinery</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8b949e] block mb-1">Mining Activity</label>
                  <input
                    type="text"
                    required
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] block mb-1">Hazard Description</label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] block mb-1">Potential Worst-Case Consequence</label>
                <input
                  type="text"
                  required
                  value={newConsequence}
                  onChange={(e) => setNewConsequence(e.target.value)}
                  className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="grid grid-cols-4 gap-3 p-3 rounded bg-[#0d1117] border border-[#30363d]">
                <div>
                  <label className="text-[#8b949e] block mb-1">Init Likelihood (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newInitL}
                    onChange={(e) => setNewInitL(Number(e.target.value))}
                    className="w-full p-1.5 rounded bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">Init Consequence (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newInitC}
                    onChange={(e) => setNewInitC(Number(e.target.value))}
                    className="w-full p-1.5 rounded bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">Res Likelihood (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newResL}
                    onChange={(e) => setNewResL(Number(e.target.value))}
                    className="w-full p-1.5 rounded bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">Res Consequence (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newResC}
                    onChange={(e) => setNewResC(Number(e.target.value))}
                    className="w-full p-1.5 rounded bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] block mb-1">Control Hierarchy & Measures (Separated by ;)</label>
                <input
                  type="text"
                  required
                  value={newMeasures}
                  onChange={(e) => setNewMeasures(e.target.value)}
                  className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8b949e] block mb-1">Accountable Colliery Official</label>
                  <input
                    type="text"
                    required
                    value={newOfficial}
                    onChange={(e) => setNewOfficial(e.target.value)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  />
                </div>
                <div>
                  <label className="text-[#8b949e] block mb-1">Inspection Frequency</label>
                  <select
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value)}
                    className="w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="CONTINUOUS">Continuous Telemetry</option>
                    <option value="EVERY_SHIFT">Every Shift</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#21262d]">
                <span className="font-semibold text-[#c9d1d9] block">Trigger Action Response Plan (TARP) Levels:</span>
                <input
                  type="text"
                  placeholder="Green Level: Normal operating parameters"
                  value={newGreen}
                  onChange={(e) => setNewGreen(e.target.value)}
                  className="w-full p-1.5 rounded bg-[#0d1117] border border-[#238636] text-[#e6edf3]"
                />
                <input
                  type="text"
                  placeholder="Yellow Level: Advisory trigger and mitigation action"
                  value={newYellow}
                  onChange={(e) => setNewYellow(e.target.value)}
                  className="w-full p-1.5 rounded bg-[#0d1117] border border-[#bb8009] text-[#e6edf3]"
                />
                <input
                  type="text"
                  placeholder="Red Level: Emergency threshold and evacuation action"
                  value={newRed}
                  onChange={(e) => setNewRed(e.target.value)}
                  className="w-full p-1.5 rounded bg-[#0d1117] border border-[#f85149] text-[#e6edf3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#21262d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[#21262d] text-[#c9d1d9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-medium uppercase tracking-wider"
                >
                  Save to Safety Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
