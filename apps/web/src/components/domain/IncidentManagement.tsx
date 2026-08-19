"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  Mine,
  MineArea,
  DomainIncident,
  IncidentCreate,
} from "@coalsafe/types";
import {
  fetchMines,
  fetchAreas,
  fetchIncidents,
  createIncident,
  resolveIncident,
} from "@/lib/api";
import {
  Flame,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export function IncidentManagement() {
  const [incidents, setIncidents] = useState<DomainIncident[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>("");
  const [areas, setAreas] = useState<MineArea[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIncident, setNewIncident] = useState<IncidentCreate>({
    mine_id: "",
    area_id: "",
    reported_by: "",
    title: "",
    description: "",
    type: "SAFETY",
    severity: "MEDIUM",
    location: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [m, inc] = await Promise.all([fetchMines(), fetchIncidents()]);
      setMines(m);
      setIncidents(inc);
      if (m.length > 0) {
        setSelectedMineId(m[0].id);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    async function loadAreas() {
      if (!selectedMineId) return;
      try {
        const a = await fetchAreas(selectedMineId);
        setAreas(a);
      } catch {
        // silent
      }
    }
    loadAreas();
  }, [selectedMineId]);

  const reloadIncidents = async () => {
    try {
      const data = await fetchIncidents(selectedMineId || undefined);
      setIncidents(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load incidents");
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.mine_id || !newIncident.title || !newIncident.type) return;
    try {
      const payload: IncidentCreate = {
        ...newIncident,
        area_id: newIncident.area_id || undefined,
        reported_by: newIncident.reported_by || undefined,
      };
      const created = await createIncident(payload);
      setIncidents((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewIncident({
        mine_id: selectedMineId,
        area_id: "",
        reported_by: "",
        title: "",
        description: "",
        type: "SAFETY",
        severity: "MEDIUM",
        location: "",
      });
      setSuccessMsg(`Incident "${created.title}" logged.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record incident");
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const updated = await resolveIncident(incidentId, undefined, "Root cause addressed and verified.");
      setIncidents((prev) => prev.map((i) => (i.id === incidentId ? updated : i)));
      setSuccessMsg(`Incident "${updated.title}" marked as resolved.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to resolve incident");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#e6edf3] flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#ea580c]" />
            Operational & Safety Incident Log
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Log and resolve real colliery incidents with audit events and DGMS compliance tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadIncidents}
            className="p-1.5 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] text-xs transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setNewIncident((prev) => ({ ...prev, mine_id: selectedMineId || (mines[0]?.id || "") }));
              setShowCreateModal(true);
            }}
            disabled={mines.length === 0}
            className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Incident
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

      {/* Empty State */}
      {incidents.length === 0 && !loading && (
        <div className="p-12 rounded-lg bg-[#161b22] border border-[#30363d] text-center space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#112316] border border-[#238636] flex items-center justify-center mx-auto text-[#3fb950]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#e6edf3]">No incidents recorded</h3>
            <p className="text-xs text-[#8b949e] mt-1">
              Zero operational or safety incidents currently on record.
            </p>
          </div>
          {mines.length > 0 && (
            <button
              onClick={() => {
                setNewIncident((prev) => ({ ...prev, mine_id: selectedMineId || mines[0].id }));
                setShowCreateModal(true);
              }}
              className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Incident
            </button>
          )}
        </div>
      )}

      {/* Incident List */}
      {incidents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`p-4 rounded-md border text-xs space-y-2.5 transition ${
                inc.status === "OPEN"
                  ? "bg-[#161b22] border-[#ea580c]"
                  : "bg-[#161b22] border-[#30363d] opacity-75"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[#e6edf3]">{inc.title}</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#0d1117] text-[#8b949e]">
                    {inc.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      inc.status === "OPEN" ? "bg-[#220d0e] text-[#ff7b72]" : "bg-[#112316] text-[#3fb950]"
                    }`}
                  >
                    {inc.status}
                  </span>
                </div>
              </div>

              {inc.description && <p className="text-xs text-[#c9d1d9]">{inc.description}</p>}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#21262d] text-[11px] font-mono text-[#8b949e]">
                <div>Severity: <span className="text-[#e6edf3]">{inc.severity}</span></div>
                {inc.location && <div>Location: <span className="text-[#e6edf3]">{inc.location}</span></div>}
              </div>

              {inc.status === "OPEN" && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleResolveIncident(inc.id)}
                    className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve Incident
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Record Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#ea580c]" /> Record Colliery Incident
            </h3>
            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Mine</label>
                <select
                  required
                  value={newIncident.mine_id}
                  onChange={(e) => {
                    setNewIncident({ ...newIncident, mine_id: e.target.value });
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
                    value={newIncident.area_id || ""}
                    onChange={(e) => setNewIncident({ ...newIncident, area_id: e.target.value })}
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
                <label className="text-[#8b949e] font-semibold block mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="e.g. Auxiliary Fan Electrical Trip"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8b949e] font-semibold block mb-1">Incident Type</label>
                  <select
                    value={newIncident.type}
                    onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="SAFETY">Safety</option>
                    <option value="OPERATIONAL">Operational</option>
                    <option value="ENVIRONMENTAL">Environmental</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8b949e] font-semibold block mb-1">Severity</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
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
                  value={newIncident.location || ""}
                  onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                  placeholder="e.g. Substation #2, Longwall Gate"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Description</label>
                <textarea
                  value={newIncident.description || ""}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Describe the incident, immediate impact, and actions taken..."
                  rows={2}
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold"
                >
                  Record Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
