"use client";

import React from "react";
import type { IncidentTimelineEvent } from "@coalsafe/types";
import { ListOrdered } from "lucide-react";

interface EventLogProps {
  events: IncidentTimelineEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  const reversedEvents = [...events].reverse();

  return (
    <div className="rounded-md border border-[#30363d] bg-[#161b22] p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-[#ea580c]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6edf3]">
            Incident Telemetry & Action Event Log
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#8b949e]">
          {events.length} Recorded Events
        </span>
      </div>

      <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
        {reversedEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8b949e] font-mono">
            No incident events recorded yet.
          </div>
        ) : (
          reversedEvents.map((evt, idx) => {
            const isCritical = evt.severity === "CRITICAL";
            const isWarning = evt.severity === "WARNING";
            const isSuccess = evt.severity === "SUCCESS";

            const borderClass = isCritical
              ? "border-[#f85149] bg-[#220d0e]"
              : isWarning
              ? "border-[#bb8009] bg-[#271d0e]"
              : isSuccess
              ? "border-[#238636] bg-[#112316]"
              : "border-[#21262d] bg-[#0d1117]";

            const badgeClass = isCritical
              ? "text-[#ff7b72] bg-[#3c1618]"
              : isWarning
              ? "text-[#d29922] bg-[#392914]"
              : isSuccess
              ? "text-[#3fb950] bg-[#163c1e]"
              : "text-[#8b949e] bg-[#21262d]";

            return (
              <div
                key={idx}
                className={`p-2.5 rounded border text-xs space-y-1 ${borderClass}`}
              >
                <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#e6edf3]">T+{evt.timestampSeconds}s</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${badgeClass}`}>
                      {evt.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {evt.zoneId && <span className="text-[#8b949e]">{evt.zoneId}</span>}
                </div>
                <div className="font-semibold text-[#e6edf3] text-[11px]">{evt.title}</div>
                <div className="text-[11px] text-[#c9d1d9]">{evt.description}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
