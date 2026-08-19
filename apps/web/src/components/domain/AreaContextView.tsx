"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  Mine,
  MineArea,
  AreaContext,
  Equipment,
  DomainHazard,
  DomainIncident,
} from "@coalsafe/types";
import {
  fetchMines,
  fetchAreas,
  getAreaContext,
  fetchEquipment,
  fetchHazards,
  fetchIncidents,
} from "@/lib/api";
import {
  Layers,
  Wrench,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RefreshCw,
  Building2,
} from "lucide-react";

export function AreaContextView() {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string>("");
  const [areas, setAreas] = useState<MineArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");

  const [areaContext, setAreaContext] = useState<AreaContext | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [hazards, setHazards] = useState<DomainHazard[]>([]);
  const [incidents, setIncidents] = useState<DomainIncident[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load mines
  useEffect(() => {
    async function loadMines() {
      try {
        const m = await fetchMines();
        setMines(m);
        if (m.length > 0) {
          setSelectedMineId(m[0].id);
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load mines");
      }
    }
    loadMines();
  }, []);

  // Load areas when selectedMineId changes
  useEffect(() => {
    async function loadAreas() {
      if (!selectedMineId) return;
      try {
        const a = await fetchAreas(selectedMineId);
        setAreas(a);
        if (a.length > 0) {
          setSelectedAreaId(a[0].id);
        } else {
          setSelectedAreaId("");
          setAreaContext(null);
          setEquipmentList([]);
          setHazards([]);
          setIncidents([]);
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load areas");
      }
    }
    loadAreas();
  }, [selectedMineId]);

  // Load area context
  const loadAreaDetails = useCallback(async (areaId: string) => {
    if (!areaId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [ctx, eq, hz, inc] = await Promise.all([
        getAreaContext(areaId),
        fetchEquipment(selectedMineId, areaId),
        fetchHazards(selectedMineId, areaId),
        fetchIncidents(selectedMineId, areaId),
      ]);
      setAreaContext(ctx);
      setEquipmentList(eq);
      setHazards(hz);
      setIncidents(inc);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load area context");
    } finally {
      setLoading(false);
    }
  }, [selectedMineId]);

  useEffect(() => {
    if (selectedAreaId) {
      loadAreaDetails(selectedAreaId);
    }
  }, [selectedAreaId, loadAreaDetails]);

  const selectedArea = areas.find((a) => a.id === selectedAreaId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#e6edf3] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#ea580c]" />
            Mine Section / Area Context
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Object-centric view of a specific operational section: equipment, active hazards, and incident history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedAreaId && (
            <button
              onClick={() => loadAreaDetails(selectedAreaId)}
              className="p-1.5 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] text-xs transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Selectors */}
      <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] block mb-1">
            Select Mine
          </label>
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-xs text-[#e6edf3]"
          >
            {mines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] block mb-1">
            Select Operational Area / Section
          </label>
          {areas.length === 0 ? (
            <div className="px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-xs text-[#8b949e]">
              No areas configured for this mine
            </div>
          ) : (
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-xs text-[#e6edf3]"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="p-3 rounded bg-[#220d0e] border border-[#f85149] text-xs text-[#ff7b72]">
          {errorMsg}
        </div>
      )}

      {/* Empty State: No areas configured */}
      {mines.length === 0 && (
        <div className="p-12 rounded-lg bg-[#161b22] border border-[#30363d] text-center space-y-2 text-xs text-[#8b949e]">
          <Building2 className="w-8 h-8 mx-auto text-[#8b949e]" />
          <p className="font-semibold text-[#e6edf3]">No mines configured</p>
          <p>Create a mine in Mine Management to inspect area contexts.</p>
        </div>
      )}

      {mines.length > 0 && areas.length === 0 && (
        <div className="p-12 rounded-lg bg-[#161b22] border border-[#30363d] text-center space-y-2 text-xs text-[#8b949e]">
          <Layers className="w-8 h-8 mx-auto text-[#8b949e]" />
          <p className="font-semibold text-[#e6edf3]">No operational areas in this mine</p>
          <p>Go to Mine Management &rarr; Areas to create one.</p>
        </div>
      )}

      {/* Area Context Body */}
      {selectedArea && areaContext && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#e6edf3]">{selectedArea.name}</h3>
                <span className="text-xs font-mono text-[#8b949e]">Code: {selectedArea.code}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-[#112316] border border-[#238636] text-[#3fb950] font-mono text-xs font-bold">
                {selectedArea.status}
              </span>
            </div>
            {selectedArea.description && (
              <p className="text-xs text-[#8b949e]">{selectedArea.description}</p>
            )}
          </div>

          {/* Grid of Sections: Equipment, Hazards, Incidents */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Section 1: Equipment */}
            <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3">
              <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3] flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#ea580c]" /> Equipment ({equipmentList.length})
                </h4>
              </div>

              {equipmentList.length === 0 ? (
                <div className="p-4 rounded bg-[#0d1117] border border-[#21262d] text-center text-xs text-[#8b949e]">
                  No equipment registered for this area.
                </div>
              ) : (
                <div className="space-y-2">
                  {equipmentList.map((eq) => (
                    <div key={eq.id} className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] text-xs space-y-0.5">
                      <div className="font-semibold text-[#e6edf3] flex items-center justify-between">
                        <span>{eq.name}</span>
                        <span className="text-[10px] text-[#3fb950] font-mono">{eq.status}</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#8b949e]">
                        {eq.equipment_code} &bull; {eq.equipment_type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Active Hazards */}
            <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3">
              <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#d29922]" /> Hazards ({hazards.length})
                </h4>
              </div>

              {hazards.length === 0 ? (
                <div className="p-4 rounded bg-[#0d1117] border border-[#21262d] text-center text-xs text-[#3fb950] flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> No active hazards.
                </div>
              ) : (
                <div className="space-y-2">
                  {hazards.map((hz) => (
                    <div key={hz.id} className="p-2.5 rounded bg-[#220d0e] border border-[#f85149] text-xs space-y-0.5">
                      <div className="font-semibold text-[#ff7b72] flex items-center justify-between">
                        <span>{hz.title}</span>
                        <span className="text-[10px] font-mono uppercase">{hz.severity}</span>
                      </div>
                      {hz.description && (
                        <p className="text-[11px] text-[#c9d1d9]">{hz.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Active Incidents */}
            <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3">
              <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#f85149]" /> Incidents ({incidents.length})
                </h4>
              </div>

              {incidents.length === 0 ? (
                <div className="p-4 rounded bg-[#0d1117] border border-[#21262d] text-center text-xs text-[#3fb950] flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> No incidents recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] text-xs space-y-0.5">
                      <div className="font-semibold text-[#e6edf3] flex items-center justify-between">
                        <span>{inc.title}</span>
                        <span className="text-[10px] font-mono text-[#d29922]">{inc.status}</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#8b949e]">{inc.type} &bull; {inc.severity}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
