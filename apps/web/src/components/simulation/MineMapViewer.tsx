"use client";

import React from "react";
import type { MineZone, MinePersonnel, EquipmentStatus } from "@coalsafe/types";
import {
  Users,
  Flame,
  AlertTriangle,
  Fan,
  Power,
  Shield,
  Activity,
} from "lucide-react";

interface MineMapViewerProps {
  zones: MineZone[];
  personnel: MinePersonnel[];
  equipment: EquipmentStatus[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
}

export const MineMapViewer: React.FC<MineMapViewerProps> = ({
  zones,
  personnel,
  equipment,
  selectedZoneId,
  onSelectZone,
}) => {
  return (
    <div className="rounded-md border border-[#30363d] bg-[#161b22] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262d] pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#ea580c]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3]">
            Colliery Underground SCADA Topology & Telemetry Grid
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[#8b949e]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-[#238636]" /> Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-[#bb8009]" /> Warning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-[#f85149]" /> Emergency
          </span>
        </div>
      </div>

      {/* Grid of Underground Zones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {zones.map((zone) => {
          const isSelected = selectedZoneId === zone.id;
          const zonePersonnel = personnel.filter((p) => p.currentZoneId === zone.id);
          const zoneEquipment = equipment.filter((e) => e.zoneId === zone.id);

          const isEmergency = zone.riskLevel === "EMERGENCY" || zone.riskLevel === "CRITICAL";
          const isWarning = zone.riskLevel === "ELEVATED" || zone.riskLevel === "HIGH";

          const borderStyle = isSelected
            ? "border-[#ea580c] ring-1 ring-[#ea580c] bg-[#1c2128]"
            : isEmergency
            ? "border-[#f85149] bg-[#220d0e]/60 hover:border-[#ff7b72]"
            : isWarning
            ? "border-[#bb8009] bg-[#271d0e]/60 hover:border-[#d29922]"
            : "border-[#30363d] bg-[#0d1117] hover:border-[#484f58]";

          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className={`p-3 rounded border cursor-pointer transition flex flex-col justify-between space-y-2 text-xs ${borderStyle}`}
            >
              {/* Zone Header */}
              <div className="flex items-start justify-between gap-1">
                <div>
                  <span className="text-[10px] font-mono text-[#8b949e] uppercase block">
                    {zone.type.replace(/_/g, " ")}
                  </span>
                  <span className="font-bold text-[#e6edf3] text-xs leading-snug">{zone.name}</span>
                </div>
                <span
                  className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${
                    isEmergency
                      ? "bg-[#3c1618] border-[#f85149] text-[#ff7b72]"
                      : isWarning
                      ? "bg-[#271d0e] border-[#bb8009] text-[#d29922]"
                      : "bg-[#112316] border-[#238636] text-[#3fb950]"
                  }`}
                >
                  {zone.riskLevel}
                </span>
              </div>

              {/* Sensor Indicators */}
              <div className="grid grid-cols-2 gap-1 py-1 px-2 rounded bg-[#161b22] border border-[#21262d] font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">CH4:</span>
                  <span className={`font-bold ${zone.telemetry.methanePercentage >= 1.25 ? "text-[#ff7b72]" : zone.telemetry.methanePercentage >= 0.75 ? "text-[#d29922]" : "text-[#3fb950]"}`}>
                    {zone.telemetry.methanePercentage.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">CO:</span>
                  <span className={`font-bold ${zone.telemetry.carbonMonoxidePpm >= 50 ? "text-[#ff7b72]" : zone.telemetry.carbonMonoxidePpm >= 25 ? "text-[#d29922]" : "text-[#c9d1d9]"}`}>
                    {zone.telemetry.carbonMonoxidePpm.toFixed(0)}ppm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">O2:</span>
                  <span className={`font-bold ${zone.telemetry.oxygenPercentage < 19.0 ? "text-[#ff7b72]" : "text-[#c9d1d9]"}`}>
                    {zone.telemetry.oxygenPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Flow:</span>
                  <span className="text-[#c9d1d9]">{zone.telemetry.airVelocityMps.toFixed(1)}m/s</span>
                </div>
              </div>

              {/* Status footer with Icons */}
              <div className="flex items-center justify-between text-[10px] text-[#8b949e] pt-1 border-t border-[#21262d]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-[#58a6ff]" />
                  <span className="font-mono text-[#c9d1d9]">{zonePersonnel.length} crew</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {zone.powerSupplied ? (
                    <span title="Section Power Energized">
                      <Power className="w-3 h-3 text-[#3fb950]" />
                    </span>
                  ) : (
                    <span title="Section Power Isolated">
                      <Power className="w-3 h-3 text-[#ff7b72]" />
                    </span>
                  )}
                  {zone.auxiliaryFanRunning && (
                    <span title="Aux Fan Running">
                      <Fan className="w-3 h-3 text-[#58a6ff]" />
                    </span>
                  )}
                  {zone.waterBarrierDeployed && (
                    <span title="Water Barrier Armed">
                      <Shield className="w-3 h-3 text-[#58a6ff]" />
                    </span>
                  )}
                  {zone.activeHazard !== "NONE" && (
                    <span title={`Active Hazard: ${zone.activeHazard}`}>
                      <Flame className="w-3 h-3 text-[#f85149]" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
