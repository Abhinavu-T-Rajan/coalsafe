"use client";

import React from "react";
import type { MineZone } from "@coalsafe/types";
import { Gauge } from "lucide-react";

interface TelemetryGaugesProps {
  selectedZone: MineZone | null;
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ selectedZone }) => {
  if (!selectedZone) {
    return (
      <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] text-center text-xs text-[#8b949e]">
        Select an underground zone from the topology grid to inspect telemetry.
      </div>
    );
  }

  const { telemetry } = selectedZone;

  const meters = [
    {
      label: "Methane (CH4)",
      value: `${telemetry.methanePercentage.toFixed(2)} %`,
      statutoryLimit: "Max 0.75% (CMR 153)",
      percentage: Math.min(100, (telemetry.methanePercentage / 3.0) * 100),
      color:
        telemetry.methanePercentage >= 1.25
          ? "bg-[#f85149]"
          : telemetry.methanePercentage >= 0.75
          ? "bg-[#d29922]"
          : "bg-[#238636]",
      textColor:
        telemetry.methanePercentage >= 1.25
          ? "text-[#ff7b72]"
          : telemetry.methanePercentage >= 0.75
          ? "text-[#d29922]"
          : "text-[#3fb950]",
    },
    {
      label: "Carbon Monoxide (CO)",
      value: `${telemetry.carbonMonoxidePpm.toFixed(0)} ppm`,
      statutoryLimit: "Max 50 ppm (TARP)",
      percentage: Math.min(100, (telemetry.carbonMonoxidePpm / 150) * 100),
      color:
        telemetry.carbonMonoxidePpm >= 50
          ? "bg-[#f85149]"
          : telemetry.carbonMonoxidePpm >= 25
          ? "bg-[#d29922]"
          : "bg-[#238636]",
      textColor:
        telemetry.carbonMonoxidePpm >= 50
          ? "text-[#ff7b72]"
          : telemetry.carbonMonoxidePpm >= 25
          ? "text-[#d29922]"
          : "text-[#3fb950]",
    },
    {
      label: "Oxygen Content (O2)",
      value: `${telemetry.oxygenPercentage.toFixed(1)} %`,
      statutoryLimit: "Min 19.0% (CMR 153)",
      percentage: Math.min(100, (telemetry.oxygenPercentage / 21.0) * 100),
      color: telemetry.oxygenPercentage < 19.0 ? "bg-[#f85149]" : "bg-[#238636]",
      textColor: telemetry.oxygenPercentage < 19.0 ? "text-[#ff7b72]" : "text-[#3fb950]",
    },
    {
      label: "Airflow Velocity",
      value: `${telemetry.airVelocityMps.toFixed(2)} m/s`,
      statutoryLimit: "Min 1.5 m/s",
      percentage: Math.min(100, (telemetry.airVelocityMps / 5.0) * 100),
      color: telemetry.airVelocityMps < 1.0 ? "bg-[#d29922]" : "bg-[#238636]",
      textColor: telemetry.airVelocityMps < 1.0 ? "text-[#d29922]" : "text-[#e6edf3]",
    },
    {
      label: "Strata Pressure",
      value: `${telemetry.strataPressureMpa.toFixed(1)} MPa`,
      statutoryLimit: "Max 35 MPa",
      percentage: Math.min(100, (telemetry.strataPressureMpa / 50.0) * 100),
      color:
        telemetry.strataPressureMpa >= 35.0
          ? "bg-[#f85149]"
          : telemetry.strataPressureMpa >= 25.0
          ? "bg-[#d29922]"
          : "bg-[#238636]",
      textColor:
        telemetry.strataPressureMpa >= 35.0
          ? "text-[#ff7b72]"
          : telemetry.strataPressureMpa >= 25.0
          ? "text-[#d29922]"
          : "text-[#e6edf3]",
    },
    {
      label: "Water Inflow",
      value: `${telemetry.waterInflowLpm.toFixed(0)} L/min`,
      statutoryLimit: "Sump Level: " + telemetry.waterLevelMeters.toFixed(2) + "m",
      percentage: Math.min(100, (telemetry.waterInflowLpm / 1000) * 100),
      color: telemetry.waterInflowLpm > 300 ? "bg-[#d29922]" : "bg-[#238636]",
      textColor: telemetry.waterInflowLpm > 300 ? "text-[#d29922]" : "text-[#e6edf3]",
    },
  ];

  return (
    <div className="rounded-md border border-[#30363d] bg-[#161b22] p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#ea580c]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3]">
            Telemetry Inspection Readouts &mdash; {selectedZone.name}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#8b949e]">
          Sampling Rate: 1000ms &bull; Continuous SCADA
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {meters.map((m, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] space-y-1.5"
          >
            <span className="text-[10px] text-[#8b949e] font-medium block truncate">{m.label}</span>
            <div className={`text-base font-bold font-mono ${m.textColor}`}>{m.value}</div>
            <div className="w-full bg-[#21262d] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${m.color}`}
                style={{ width: `${m.percentage}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#8b949e] block truncate">{m.statutoryLimit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
