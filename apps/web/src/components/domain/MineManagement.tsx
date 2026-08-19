"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  Mine,
  MineCreate,
  MineContext,
  MineArea,
  MineAreaCreate,
  Person,
  PersonCreate,
  Equipment,
  EquipmentCreate,
  Shift,
  ShiftCreate,
  Handover,
} from "@coalsafe/types";
import {
  fetchMines,
  createMine,
  getMineContext,
  fetchAreas,
  createArea,
  fetchPeople,
  createPerson,
  fetchEquipment,
  createEquipment,
  fetchShifts,
  createShift,
  fetchHandovers,
} from "@/lib/api";
import {
  Building2,
  Plus,
  Layers,
  Users,
  Wrench,
  Clock,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  MapPin,
  Tag,
} from "lucide-react";

export function MineManagement() {
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState<string | null>(null);
  const [mineContext, setMineContext] = useState<MineContext | null>(null);
  const [activeTab, setActiveTab] = useState<"AREAS" | "PEOPLE" | "EQUIPMENT" | "SHIFTS" | "HANDOVERS">("AREAS");

  const [areas, setAreas] = useState<MineArea[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);

  const [showCreateMine, setShowCreateMine] = useState(false);
  const [showCreateArea, setShowCreateArea] = useState(false);
  const [showCreatePerson, setShowCreatePerson] = useState(false);
  const [showCreateEquipment, setShowCreateEquipment] = useState(false);
  const [showCreateShift, setShowCreateShift] = useState(false);

  const [newMine, setNewMine] = useState<MineCreate>({ name: "", code: "", location: "", status: "ACTIVE" });
  const [newArea, setNewArea] = useState<MineAreaCreate>({ mine_id: "", name: "", code: "", description: "", status: "ACTIVE" });
  const [newPerson, setNewPerson] = useState<PersonCreate>({ mine_id: "", name: "", employee_id: "", role: "", contact_information: "", status: "ACTIVE" });
  const [newEquipment, setNewEquipment] = useState<EquipmentCreate>({ mine_id: "", area_id: "", name: "", equipment_code: "", equipment_type: "", status: "OPERATIONAL" });
  const [newShift, setNewShift] = useState<ShiftCreate>({ mine_id: "", area_id: "", supervisor_id: "", shift_type: "SHIFT_1_MORNING", start_time: "", status: "SCHEDULED" });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadMines = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchMines();
      setMines(data);
      if (data.length > 0 && !selectedMineId) {
        setSelectedMineId(data[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load mines";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedMineId]);

  useEffect(() => {
    loadMines();
  }, [loadMines]);

  const loadMineDetails = useCallback(async (mineId: string) => {
    setErrorMsg(null);
    try {
      const [ctx, a, p, eq, s, h] = await Promise.all([
        getMineContext(mineId),
        fetchAreas(mineId),
        fetchPeople(mineId),
        fetchEquipment(mineId),
        fetchShifts(mineId),
        fetchHandovers(mineId),
      ]);
      setMineContext(ctx);
      setAreas(a);
      setPeople(p);
      setEquipmentList(eq);
      setShifts(s);
      setHandovers(h);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load mine details";
      setErrorMsg(msg);
    }
  }, []);

  useEffect(() => {
    if (selectedMineId) {
      loadMineDetails(selectedMineId);
    }
  }, [selectedMineId, loadMineDetails]);

  const handleCreateMine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMine.name || !newMine.code || !newMine.location) return;
    setErrorMsg(null);
    try {
      const created = await createMine(newMine);
      setMines((prev) => [...prev, created]);
      setSelectedMineId(created.id);
      setShowCreateMine(false);
      setNewMine({ name: "", code: "", location: "", status: "ACTIVE" });
      setSuccessMsg(`Mine "${created.name}" created successfully.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create mine");
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMineId || !newArea.name || !newArea.code) return;
    try {
      const created = await createArea(selectedMineId, { ...newArea, mine_id: selectedMineId });
      setAreas((prev) => [...prev, created]);
      setShowCreateArea(false);
      setNewArea({ mine_id: "", name: "", code: "", description: "", status: "ACTIVE" });
      setSuccessMsg(`Area "${created.name}" created.`);
      loadMineDetails(selectedMineId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create area");
    }
  };

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMineId || !newPerson.name || !newPerson.employee_id || !newPerson.role) return;
    try {
      const created = await createPerson(selectedMineId, { ...newPerson, mine_id: selectedMineId });
      setPeople((prev) => [...prev, created]);
      setShowCreatePerson(false);
      setNewPerson({ mine_id: "", name: "", employee_id: "", role: "", contact_information: "", status: "ACTIVE" });
      setSuccessMsg(`Personnel "${created.name}" registered.`);
      loadMineDetails(selectedMineId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to register person");
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMineId || !newEquipment.name || !newEquipment.equipment_code || !newEquipment.equipment_type) return;
    try {
      const payload: EquipmentCreate = {
        ...newEquipment,
        mine_id: selectedMineId,
        area_id: newEquipment.area_id || undefined,
      };
      const created = await createEquipment(selectedMineId, payload);
      setEquipmentList((prev) => [...prev, created]);
      setShowCreateEquipment(false);
      setNewEquipment({ mine_id: "", area_id: "", name: "", equipment_code: "", equipment_type: "", status: "OPERATIONAL" });
      setSuccessMsg(`Equipment "${created.name}" added.`);
      loadMineDetails(selectedMineId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to add equipment");
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMineId || !newShift.start_time) return;
    try {
      const payload: ShiftCreate = {
        ...newShift,
        mine_id: selectedMineId,
        area_id: newShift.area_id || undefined,
        supervisor_id: newShift.supervisor_id || undefined,
      };
      const created = await createShift(selectedMineId, payload);
      setShifts((prev) => [...prev, created]);
      setShowCreateShift(false);
      setNewShift({ mine_id: "", area_id: "", supervisor_id: "", shift_type: "SHIFT_1_MORNING", start_time: "", status: "SCHEDULED" });
      setSuccessMsg(`Shift scheduled successfully.`);
      loadMineDetails(selectedMineId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to schedule shift");
    }
  };

  const selectedMine = mines.find((m) => m.id === selectedMineId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#e6edf3] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#ea580c]" />
            Mine & Asset Management
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Real-world ontology objects: configure mines, operational areas, personnel, equipment, and shift schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedMineId) loadMineDetails(selectedMineId);
              loadMines();
            }}
            className="p-1.5 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] text-xs transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowCreateMine(true)}
            className="px-3 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Mine
          </button>
        </div>
      </div>

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

      {mines.length === 0 && !loading && (
        <div className="p-12 rounded-lg bg-[#161b22] border border-[#30363d] text-center space-y-4 max-w-lg mx-auto mt-6">
          <div className="w-12 h-12 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center mx-auto text-[#8b949e]">
            <Building2 className="w-6 h-6 text-[#ea580c]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#e6edf3]">No mines configured yet</h3>
            <p className="text-xs text-[#8b949e] mt-1">
              COALSAFE operates on actual domain records with zero pre-populated dummy data.
              Create your first mine to configure sections, personnel, and equipment.
            </p>
          </div>
          <button
            onClick={() => setShowCreateMine(true)}
            className="px-4 py-2 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" />
            Create Mine
          </button>
        </div>
      )}

      {mines.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e] px-1">
              Registered Mines ({mines.length})
            </div>
            <div className="space-y-1.5">
              {mines.map((mine) => (
                <button
                  key={mine.id}
                  onClick={() => setSelectedMineId(mine.id)}
                  className={`w-full text-left p-3 rounded-md border text-xs transition flex items-center justify-between ${
                    selectedMineId === mine.id
                      ? "bg-[#21262d] border-[#ea580c] text-[#e6edf3]"
                      : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:bg-[#1c2128] hover:text-[#c9d1d9]"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-[#e6edf3]">{mine.name}</div>
                    <div className="text-[10px] font-mono text-[#8b949e] flex items-center gap-2 mt-0.5">
                      <span>Code: {mine.code}</span>
                      <span>&bull;</span>
                      <span className="text-[#3fb950]">{mine.status}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-[#8b949e]" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {selectedMine && (
              <>
                <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-[#e6edf3]">{selectedMine.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-[#8b949e] font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[#ea580c]" /> {selectedMine.code}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#58a6ff]" /> {selectedMine.location}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-[#112316] border border-[#238636] text-[#3fb950] font-mono text-[11px] font-bold">
                      {selectedMine.status}
                    </span>
                  </div>

                  {mineContext && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[#21262d] text-center">
                      <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                        <div className="text-[10px] text-[#8b949e] uppercase font-mono">Areas</div>
                        <div className="text-lg font-bold font-mono text-[#e6edf3]">{mineContext.area_count}</div>
                      </div>
                      <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                        <div className="text-[10px] text-[#8b949e] uppercase font-mono">People</div>
                        <div className="text-lg font-bold font-mono text-[#e6edf3]">{mineContext.people_count}</div>
                      </div>
                      <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                        <div className="text-[10px] text-[#8b949e] uppercase font-mono">Equipment</div>
                        <div className="text-lg font-bold font-mono text-[#e6edf3]">{mineContext.equipment_count}</div>
                      </div>
                      <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                        <div className="text-[10px] text-[#8b949e] uppercase font-mono">Shifts</div>
                        <div className="text-lg font-bold font-mono text-[#e6edf3]">{mineContext.shift_count}</div>
                      </div>
                      <div className="p-2 rounded bg-[#0d1117] border border-[#21262d]">
                        <div className="text-[10px] text-[#8b949e] uppercase font-mono">Hazards</div>
                        <div className="text-lg font-bold font-mono text-[#ff7b72]">{mineContext.open_hazard_count}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex border-b border-[#30363d] gap-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("AREAS")}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
                      activeTab === "AREAS"
                        ? "border-[#ea580c] text-[#ea580c]"
                        : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Areas ({areas.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("PEOPLE")}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
                      activeTab === "PEOPLE"
                        ? "border-[#ea580c] text-[#ea580c]"
                        : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Personnel ({people.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("EQUIPMENT")}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
                      activeTab === "EQUIPMENT"
                        ? "border-[#ea580c] text-[#ea580c]"
                        : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Equipment ({equipmentList.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("SHIFTS")}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
                      activeTab === "SHIFTS"
                        ? "border-[#ea580c] text-[#ea580c]"
                        : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Shifts ({shifts.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("HANDOVERS")}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
                      activeTab === "HANDOVERS"
                        ? "border-[#ea580c] text-[#ea580c]"
                        : "border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Handovers ({handovers.length})
                  </button>
                </div>

                {activeTab === "AREAS" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#8b949e]">Mine Areas / Sections</span>
                      <button
                        onClick={() => setShowCreateArea(true)}
                        className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] text-xs font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-[#ea580c]" /> Add Area
                      </button>
                    </div>

                    {areas.length === 0 ? (
                      <div className="p-8 rounded bg-[#161b22] border border-[#30363d] text-center text-xs text-[#8b949e]">
                        No operational areas created for this mine.
                        <div className="mt-2">
                          <button
                            onClick={() => setShowCreateArea(true)}
                            className="text-[#ea580c] hover:underline font-semibold"
                          >
                            + Create an area
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {areas.map((area) => (
                          <div key={area.id} className="p-3 rounded bg-[#161b22] border border-[#30363d] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-[#e6edf3]">{area.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0d1117] text-[#3fb950]">
                                {area.status}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-[#8b949e]">Code: {area.code}</div>
                            {area.description && (
                              <p className="text-[11px] text-[#8b949e]">{area.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "PEOPLE" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#8b949e]">Mine Personnel</span>
                      <button
                        onClick={() => setShowCreatePerson(true)}
                        className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] text-xs font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-[#ea580c]" /> Add Person
                      </button>
                    </div>

                    {people.length === 0 ? (
                      <div className="p-8 rounded bg-[#161b22] border border-[#30363d] text-center text-xs text-[#8b949e]">
                        No personnel registered for this mine.
                        <div className="mt-2">
                          <button
                            onClick={() => setShowCreatePerson(true)}
                            className="text-[#ea580c] hover:underline font-semibold"
                          >
                            + Add a person
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {people.map((person) => (
                          <div key={person.id} className="p-3 rounded bg-[#161b22] border border-[#30363d] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-[#e6edf3]">{person.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0d1117] text-[#58a6ff]">
                                {person.role}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-[#8b949e]">ID: {person.employee_id}</div>
                            {person.contact_information && (
                              <div className="text-[11px] text-[#8b949e]">{person.contact_information}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "EQUIPMENT" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#8b949e]">Equipment & Machinery</span>
                      <button
                        onClick={() => setShowCreateEquipment(true)}
                        className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] text-xs font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-[#ea580c]" /> Add Equipment
                      </button>
                    </div>

                    {equipmentList.length === 0 ? (
                      <div className="p-8 rounded bg-[#161b22] border border-[#30363d] text-center text-xs text-[#8b949e]">
                        No equipment registered for this mine.
                        <div className="mt-2">
                          <button
                            onClick={() => setShowCreateEquipment(true)}
                            className="text-[#ea580c] hover:underline font-semibold"
                          >
                            + Register equipment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {equipmentList.map((eq) => (
                          <div key={eq.id} className="p-3 rounded bg-[#161b22] border border-[#30363d] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-[#e6edf3]">{eq.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#112316] text-[#3fb950]">
                                {eq.status}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-[#8b949e]">
                              Code: {eq.equipment_code} &bull; Type: {eq.equipment_type}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "SHIFTS" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#8b949e]">Operational Shifts</span>
                      <button
                        onClick={() => setShowCreateShift(true)}
                        className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] text-xs font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-[#ea580c]" /> Schedule Shift
                      </button>
                    </div>

                    {shifts.length === 0 ? (
                      <div className="p-8 rounded bg-[#161b22] border border-[#30363d] text-center text-xs text-[#8b949e]">
                        No shifts scheduled for this mine.
                        <div className="mt-2">
                          <button
                            onClick={() => setShowCreateShift(true)}
                            className="text-[#ea580c] hover:underline font-semibold"
                          >
                            + Schedule a shift
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {shifts.map((shift) => (
                          <div key={shift.id} className="p-3 rounded bg-[#161b22] border border-[#30363d] flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-[#e6edf3]">{shift.shift_type.replace(/_/g, " ")}</span>
                              <div className="text-[11px] font-mono text-[#8b949e]">Start: {shift.start_time}</div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-[#d29922]">
                              {shift.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "HANDOVERS" && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-[#8b949e]">Shift Handovers for this Mine</div>
                    {handovers.length === 0 ? (
                      <div className="p-8 rounded bg-[#161b22] border border-[#30363d] text-center text-xs text-[#8b949e]">
                        No shift handovers submitted yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {handovers.map((h) => (
                          <div key={h.id} className="p-3 rounded bg-[#161b22] border border-[#30363d] space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#e6edf3]">Handover &mdash; {h.status}</span>
                              <span className="text-[10px] font-mono text-[#8b949e]">{h.created_at}</span>
                            </div>
                            {h.summary && <p className="text-[11px] text-[#8b949e]">{h.summary}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showCreateMine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#ea580c]" /> Create New Mine
            </h3>
            <form onSubmit={handleCreateMine} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Mine Name</label>
                <input
                  type="text"
                  required
                  value={newMine.name}
                  onChange={(e) => setNewMine({ ...newMine, name: e.target.value })}
                  placeholder="e.g. Korba West Underground Colliery"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Mine Code</label>
                <input
                  type="text"
                  required
                  value={newMine.code}
                  onChange={(e) => setNewMine({ ...newMine, code: e.target.value })}
                  placeholder="e.g. MINE-KOR-01"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={newMine.location}
                  onChange={(e) => setNewMine({ ...newMine, location: e.target.value })}
                  placeholder="e.g. Korba Coalfield, Chhattisgarh"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateMine(false)}
                  className="px-3 py-1.5 rounded bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold"
                >
                  Create Mine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ea580c]" /> Add Operational Area / Section
            </h3>
            <form onSubmit={handleCreateArea} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Area Name</label>
                <input
                  type="text"
                  required
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  placeholder="e.g. Longwall Panel 1"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Area Code</label>
                <input
                  type="text"
                  required
                  value={newArea.code}
                  onChange={(e) => setNewArea({ ...newArea, code: e.target.value })}
                  placeholder="e.g. AREA-LW-01"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Description (optional)</label>
                <textarea
                  value={newArea.description || ""}
                  onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                  placeholder="Operational details of this district..."
                  rows={2}
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateArea(false)}
                  className="px-3 py-1.5 rounded bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold"
                >
                  Add Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreatePerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ea580c]" /> Register Mine Personnel
            </h3>
            <form onSubmit={handleCreatePerson} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Employee / Certificate ID</label>
                <input
                  type="text"
                  required
                  value={newPerson.employee_id}
                  onChange={(e) => setNewPerson({ ...newPerson, employee_id: e.target.value })}
                  placeholder="e.g. DGMS/OV/2023/1092"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Role / Designation</label>
                <input
                  type="text"
                  required
                  value={newPerson.role}
                  onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}
                  placeholder="e.g. Shift Overman / Safety Officer / Sirdar"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Contact Information (optional)</label>
                <input
                  type="text"
                  value={newPerson.contact_information || ""}
                  onChange={(e) => setNewPerson({ ...newPerson, contact_information: e.target.value })}
                  placeholder="e.g. Phone, section radio channel"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePerson(false)}
                  className="px-3 py-1.5 rounded bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold"
                >
                  Register Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#ea580c]" /> Add Mine Equipment
            </h3>
            <form onSubmit={handleCreateEquipment} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  placeholder="e.g. Continuous Miner #1"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Equipment Code</label>
                <input
                  type="text"
                  required
                  value={newEquipment.equipment_code}
                  onChange={(e) => setNewEquipment({ ...newEquipment, equipment_code: e.target.value })}
                  placeholder="e.g. EQ-CM-01"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Equipment Type</label>
                <input
                  type="text"
                  required
                  value={newEquipment.equipment_type}
                  onChange={(e) => setNewEquipment({ ...newEquipment, equipment_type: e.target.value })}
                  placeholder="e.g. SHEARER / VENT_FAN / DEWATERING_PUMP"
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              {areas.length > 0 && (
                <div>
                  <label className="text-[#8b949e] font-semibold block mb-1">Assigned Area (optional)</label>
                  <select
                    value={newEquipment.area_id || ""}
                    onChange={(e) => setNewEquipment({ ...newEquipment, area_id: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="">-- No specific area --</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateEquipment(false)}
                  className="px-3 py-1.5 rounded bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold"
                >
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ea580c]" /> Schedule Shift
            </h3>
            <form onSubmit={handleCreateShift} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Shift Type</label>
                <select
                  value={newShift.shift_type}
                  onChange={(e) => setNewShift({ ...newShift, shift_type: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                >
                  <option value="SHIFT_1_MORNING">Morning Shift (06:00 - 14:00)</option>
                  <option value="SHIFT_2_AFTERNOON">Afternoon Shift (14:00 - 22:00)</option>
                  <option value="SHIFT_3_NIGHT">Night Shift (22:00 - 06:00)</option>
                </select>
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold block mb-1">Date & Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newShift.start_time}
                  onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                />
              </div>

              {areas.length > 0 && (
                <div>
                  <label className="text-[#8b949e] font-semibold block mb-1">Operating Area (optional)</label>
                  <select
                    value={newShift.area_id || ""}
                    onChange={(e) => setNewShift({ ...newShift, area_id: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="">-- Mine-wide / General --</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {people.length > 0 && (
                <div>
                  <label className="text-[#8b949e] font-semibold block mb-1">Shift Supervisor (optional)</label>
                  <select
                    value={newShift.supervisor_id || ""}
                    onChange={(e) => setNewShift({ ...newShift, supervisor_id: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3]"
                  >
                    <option value="">-- Select Supervisor --</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateShift(false)}
                  className="px-3 py-1.5 rounded bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold"
                >
                  Schedule Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
