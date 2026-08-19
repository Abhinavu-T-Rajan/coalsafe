"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  Mine,
  MineArea,
  Person,
  DomainHazard,
  HazardCreate,
} from "@coalsafe/types";
import {
  fetchMines,
  fetchAreas,
  fetchPeople,
  fetchHazards,
  reportHazard,
  closeHazard,
} from "@/lib/api";
import {
  AlertTriangle,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";

export function HazardManagement() {
  const [hazards, setHazards] = useState<DomainHazard[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>("");
  const [areas, setAreas] = useState<MineArea[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [newHazard, setNewHazard] = useState<HazardCreate>({
    mine_id: "",
    area_id: "",
    reported_by: "",
    title: "",
    description: "",
    category: "STRATA_CONTROL",
    severity: "MEDIUM",
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load mines & initial hazards
  const loadInitial = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [m, hz] = await Promise.all([fetchMines(), fetchHazards()]);
      setMines(m);
      setHazards(hz);
      if (m.length > 0) {
        setSelectedMineId(m[0].id);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load hazards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Load areas & people when selected mine changes
  useEffect(() => {
    async function loadMineAssets() {
      if (!selectedMineId) return;
      try {
        const [a, p] = await Promise.all([
          fetchAreas(selectedMineId),
          fetchPeople(selectedMineId),
        ]);
        setAreas(a);
        setPeople(p);
      } catch {
        // silent fallback
      }
    }
    loadMineAssets();
  }, [selectedMineId]);

  const reloadHazards = async () => {
    setErrorMsg(null);
    try {
      const data = await fetchHazards(selectedMineId || undefined);
      setHazards(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load hazards");
    }
  };

  const handleReportHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHazard.mine_id || !newHazard.title || !newHazard.category) return;
    try {
      const payload: HazardCreate = {
        ...newHazard,
        area_id: newHazard.area_id || undefined,
        reported_by: newHazard.reported_by || undefined,
      };
      const created = await reportHazard(payload);
      setHazards((prev) => [created, ...prev]);
      setShowReportModal(false);
      setNewHazard({
        mine_id: selectedMineId,
        area_id: "",
        reported_by: "",
        title: "",
        description: "",
        category: "STRATA_CONTROL",
        severity: "MEDIUM",
        location: "",
      });
      setSuccessMsg(`Hazard "${created.title}" reported and logged into audit ledger.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to report hazard");
    }
  };

  const handleCloseHazard = async (hazardId: string) => {
    try {
      const updated = await closeHazard(hazardId, undefined, "Mitigated and verified by supervisor.");
      setHazards((prev) => prev.map((h) => (h.id === hazardId ? updated : h)));
      setSuccessMsg(`Hazard "${updated.title}" closed.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to close hazard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#e6edf3] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#ea580c]" />
            Hazard Identification & Mitigation Registry
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Operational safety risk identification with audit event logging and supervisor sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadHazards}
            className="p-1.5 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] text-xs transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setNewHazard((prev) => ({ ...prev, mine_id: selectedMineId || (mines[0]?.id || "") }));
              setShowReportModal(true);
            }}
            disabled={mines.length === 0}
            className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Report Hazard
          </button>
        </div>
      </div>

      {/* Banners */}
      {errorMsg && (
        <div className="p-3 rounded bg-[#220d0e] border border-[#f85149] text-xs text-[#ff7b72] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded bg-[#112316] border border-[#238636] text-xs text-[#3fb950] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#8b949e] hover:text-[#e6edf3] text-xs">
            &times;
          </button>
        </div>
      )}

      {/* Empty State: No Hazards */}
      {hazards.length === 0 && !loading && (
        <div className="p-12 rounded-lg bg-[#161b22] border border-[#30363d] text-center space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#112316] border border-[#238636] flex items-center justify-center mx-auto text-[#3fb950]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#e6edf3]">No active hazards registered</h3>
            <p className="text-xs text-[#8b949e] mt-1">
              Zero hazards currently reported in the system. Use the button above to register an operational risk.
            </p>
          </div>
          {mines.length > 0 && (
            <button
              onClick={() => {
                setNewHazard((prev) => ({ ...prev, mine_id: selectedMineId || mines[0].id }));
                setShowReportModal(true);
              }}
              className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Report Hazard
            </button>
          )}
        </div>
      )}

      {/* Hazard Cards List */}
      {hazards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hazards.map((hz) => (
            <div
              key={hz.id}
              className={`p-4 rounded-md border text-xs space-y-2.5 transition ${
                hz.status === "OPEN"
                  ? "bg-[#161b22] border-[#f85149]/50"
                  : "bg-[#161b22] border-[#30363d] opacity-75"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#e6edf3]">{hz.title}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      hz.severity === "CRITICAL"
                        ? "bg-[#3c1618] text-[#ff7b72] border border-[#f85149]"
                        : hz.severity === "HIGH"
                        ? "bg-[#271d0e] text-[#d29922] border border-[#bb8009]"
                        : "bg-[#0d1117] text-[#58a6ff] border border-[#30363d]"
                    }`}
                  >
                    {hz.severity}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      hz.status === "OPEN" ? "bg-[#220d0e] text-[#ff7b72]" : "bg-[#112316] text-[#3fb950]"
                    }`}
                  >
                    {hz.status}
                  </span>
                </div>
              </div>

              {hz.description && <p className="text-xs text-[#c9d1d9]">{hz.description}</p>}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#21262d] text-[11px] font-mono text-[#8b949e]">
                <div>Category: <span className="text-[#e6edf3]">{hz.category}</span></div>
                {hz.location && <div>Location: <span className="text-[#e6edf3]">{hz.location}</span></div>}
              </div>

              {hz.status === "OPEN" && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleCloseHazard(hz.id)}
                    className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Close & Mitigate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Hazard Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ea580c]" /> Report Identified Safety Hazard
            </h3>
            <form onSubmit={handleReportHazard} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Mine</label>
                <select
                  required
                  value={newHazard.mine_id}
                  onChange={(e) => {
                    setNewHazard({ ...newHazard, mine_id: e.target.value });
                    setSelectedMineId(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                >
                  <option value="">-- Select Mine --</option>
                  {mines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {areas.length > 0 && (
                <div>
                  <label className="text-[#8b949e] font-semibold block mb-1">Area / Section (optional)</label>
                  <select
                    value={newHazard.area_id || ""}
                    onChange={(e) => setNewHazard({ ...newHazard, area_id: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="">-- General / Mine-Wide --</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Hazard Title</label>
                <input
                  type="text"
                  required
                  value={newHazard.title}
                  onChange={(e) => setNewHazard({ ...newHazard, title: e.target.value })}
                  placeholder="e.g. Roof Convergence Near Tailgate Turn"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8b949e] font-semibold block mb-1">Category</label>
                  <select
                    value={newHazard.category}
                    onChange={(e) => setNewHazard({ ...newHazard, category: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="STRATA_CONTROL">Strata Control</option>
                    <option value="MINE_GAS_VENTILATION">Mine Gas & Vent</option>
                    <option value="FIRE_EXPLOSION">Fire & Explosion</option>
                    <option value="INUNDATION_WATER">Water Inundation</option>
                    <option value="HEMM_TRANSPORT">HEMM & Transport</option>
                    <option value="ELECTRICITY_MACHINERY">Machinery</option>
                    <option value="DUST_ENVIRONMENT">Dust & Environment</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8b949e] font-semibold block mb-1">Severity</label>
                  <select
                    value={newHazard.severity}
                    onChange={(e) => setNewHazard({ ...newHazard, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Location Details</label>
                <input
                  type="text"
                  value={newHazard.location || ""}
                  onChange={(e) => setNewHazard({ ...newHazard, location: e.target.value })}
                  placeholder="e.g. Return Roadway Pillar #42"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Description</label>
                <textarea
                  value={newHazard.description || ""}
                  onChange={(e) => setNewHazard({ ...newHazard, description: e.target.value })}
                  placeholder="Describe the identified hazard and immediate risks..."
                  rows={2}
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 rounded bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
