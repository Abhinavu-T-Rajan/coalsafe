"use client";

import React from "react";
import type { OperatorActionType, MineZone } from "@coalsafe/types";
import {
  Power,
  Fan,
  Megaphone,
  ShieldAlert,
  Droplets,
  Radio,
  SlidersHorizontal,
} from "lucide-react";

interface ActionControlsProps {
  selectedZone: MineZone | null;
  onDispatchAction: (actionType: OperatorActionType, targetZoneId?: string) => void;
  isLoading: boolean;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  selectedZone,
  onDispatchAction,
  isLoading,
}) => {
  return (
    <div className="rounded-md border border-[#30363d] bg-[#161b22] p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#ea580c]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3]">
            Emergency Control-Room Action Dispatch
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#8b949e]">
          Target: {selectedZone ? selectedZone.name : "Mine-Wide"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Power Isolation */}
        <button
          onClick={() =>
            onDispatchAction(
              selectedZone?.powerSupplied ? "CUT_SECTION_POWER" : "RESTORE_SECTION_POWER",
              selectedZone?.id
            )
          }
          disabled={isLoading || !selectedZone}
          className={`p-2.5 rounded border text-left flex items-center gap-2.5 transition disabled:opacity-40 ${
            selectedZone?.powerSupplied
              ? "bg-[#220d0e] border-[#f85149] hover:bg-[#3c1618] text-[#ff7b72]"
              : "bg-[#112316] border-[#238636] hover:bg-[#1a3821] text-[#3fb950]"
          }`}
        >
          <Power className="w-4 h-4 shrink-0" />
          <div className="text-xs">
            <div className="font-bold">
              {selectedZone?.powerSupplied ? "Cut Power (CMR 53)" : "Restore Power"}
            </div>
            <div className="text-[10px] text-[#8b949e]">Flameproof FLP breaker</div>
          </div>
        </button>

        {/* Aux Fan Control */}
        <button
          onClick={() =>
            onDispatchAction(
              selectedZone?.auxiliaryFanRunning ? "DEACTIVATE_AUX_FAN" : "ACTIVATE_AUX_FAN",
              selectedZone?.id
            )
          }
          disabled={isLoading || !selectedZone}
          className={`p-2.5 rounded border text-left flex items-center gap-2.5 transition disabled:opacity-40 ${
            selectedZone?.auxiliaryFanRunning
              ? "bg-[#271d0e] border-[#bb8009] hover:bg-[#392914] text-[#d29922]"
              : "bg-[#0d1117] border-[#30363d] hover:bg-[#161b22] text-[#c9d1d9]"
          }`}
        >
          <Fan className="w-4 h-4 shrink-0" />
          <div className="text-xs">
            <div className="font-bold">
              {selectedZone?.auxiliaryFanRunning ? "Stop Aux Fan" : "Boost Aux Fan"}
            </div>
            <div className="text-[10px] text-[#8b949e]">Increase airflow to face</div>
          </div>
        </button>

        {/* Section Evacuation */}
        <button
          onClick={() => onDispatchAction("TRIGGER_SECTION_EVACUATION", selectedZone?.id)}
          disabled={isLoading || !selectedZone}
          className="p-2.5 rounded bg-[#220d0e] border border-[#f85149] hover:bg-[#3c1618] text-[#ff7b72] text-left flex items-center gap-2.5 transition disabled:opacity-40"
        >
          <Megaphone className="w-4 h-4 shrink-0" />
          <div className="text-xs">
            <div className="font-bold">Section Evac Siren</div>
            <div className="text-[10px] text-[#8b949e]">Direct crew to intake</div>
          </div>
        </button>

        {/* Mine-Wide Evacuation */}
        <button
          onClick={() => onDispatchAction("TRIGGER_MINE_WIDE_EVACUATION")}
          disabled={isLoading}
          className="p-2.5 rounded bg-[#3c1618] border border-[#f85149] hover:bg-[#4c1f22] text-[#ff7b72] text-left flex items-center gap-2.5 transition disabled:opacity-40"
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <div className="text-xs">
            <div className="font-bold">Mine-Wide Alarm</div>
            <div className="text-[10px] text-[#8b949e]">General withdrawal order</div>
          </div>
        </button>

        {/* Water Barrier Deployment */}
        <button
          onClick={() => onDispatchAction("DEPLOY_WATER_BARRIER", selectedZone?.id)}
          disabled={isLoading || !selectedZone}
          className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] hover:bg-[#161b22] text-[#c9d1d9] text-left flex items-center gap-2.5 transition disabled:opacity-40"
        >
          <Droplets className="w-4 h-4 shrink-0 text-[#58a6ff]" />
          <div className="text-xs">
            <div className="font-bold">Deploy Water Barrier</div>
            <div className="text-[10px] text-[#8b949e]">Explosion suppression</div>
          </div>
        </button>

        {/* Rescue Brigade Dispatch */}
        <button
          onClick={() => onDispatchAction("DISPATCH_MINES_RESCUE_BRIGADE", selectedZone?.id)}
          disabled={isLoading}
          className="p-2.5 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white text-left flex items-center gap-2.5 transition disabled:opacity-40"
        >
          <Radio className="w-4 h-4 shrink-0" />
          <div className="text-xs">
            <div className="font-bold">Dispatch Rescue Team</div>
            <div className="text-[10px] text-white/80">DGMS certified rescue crew</div>
          </div>
        </button>
      </div>
    </div>
  );
};
