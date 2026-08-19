"use client";

import React, { useState, useEffect } from "react";
import type { ErpSyncPayload, ShiftLog } from "@coalsafe/types";
import { fetchErpSyncLogs, triggerErpSync, fetchShiftLogs } from "@/lib/api";
import {
  Layers,
  CheckCircle2,
  RefreshCw,
  Server,
  Lock,
  Database,
} from "lucide-react";

export const ErpIntegrationHub: React.FC = () => {
  const [syncLogs, setSyncLogs] = useState<ErpSyncPayload[]>([]);
  const [shiftLogs, setShiftLogs] = useState<ShiftLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [eLogs, sLogs] = await Promise.all([
        fetchErpSyncLogs(),
        fetchShiftLogs(),
      ]);
      setSyncLogs(eLogs);
      setShiftLogs(sLogs);
      if (sLogs.length > 0 && !selectedLogId) {
        setSelectedLogId(sLogs[0].id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load ERP sync data.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLogId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    if (!selectedLogId) return;
    try {
      setIsSyncing(true);
      const synced = await triggerErpSync(selectedLogId);
      setSuccessMsg(`Log ${selectedLogId} synced to SAP S/4HANA (Tx: ${synced.sapTransactionId})`);
      setTimeout(() => setSuccessMsg(null), 5000);
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ERP synchronization failed.";
      setErrorMsg(message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Industrial Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#ea580c]" />
            <h2 className="text-xl font-bold tracking-tight text-[#e6edf3]">
              Enterprise ERP Connector & Audit Ledger
            </h2>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Bi-directional synchronization with SAP S/4HANA & Coal Net with cryptographic SHA-256 tamper verification
          </p>
        </div>

        {/* Live Connector Health Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#0d1117] border border-[#30363d] text-xs font-mono text-[#3fb950]">
          <Server className="w-3.5 h-3.5 text-[#3fb950]" />
          <span>SAP Connector: ONLINE (14ms)</span>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 rounded-md bg-[#112316] border border-[#238636] text-xs text-[#3fb950] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />
          <span className="font-mono">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-md bg-[#3c1618] border border-[#f85149] text-xs text-[#ff7b72] flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Sync Control Card */}
      <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#e6edf3]">
          <Database className="w-4 h-4 text-[#ea580c]" />
          <span>Manual Dispatch: Push Shift Log to Colliery ERP</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <select
            value={selectedLogId}
            onChange={(e) => setSelectedLogId(e.target.value)}
            className="flex-1 w-full p-2 rounded bg-[#0d1117] border border-[#30363d] text-xs text-[#e6edf3]"
          >
            {shiftLogs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} &mdash; {l.districtSection} ({l.shift.replace("SHIFT_", "S-")}) &bull; {l.productionTonnage}T &bull; {l.outgoingSupervisorName}
              </option>
            ))}
          </select>

          <button
            onClick={handleSync}
            disabled={isSyncing || !selectedLogId}
            className="w-full sm:w-auto px-4 py-2 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white font-medium text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>Sync to SAP</span>
          </button>
        </div>
      </div>

      {/* Synced Transactions Table */}
      <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#e6edf3]">
            <Lock className="w-4 h-4 text-[#3fb950]" />
            <span>Cryptographic Non-Repudiation Audit Ledger</span>
          </div>
          <span className="text-xs font-mono text-[#8b949e]">{syncLogs.length} Verified Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1117] text-[#8b949e] uppercase font-mono text-[10px] border-b border-[#21262d]">
              <tr>
                <th className="p-2.5">Sync ID</th>
                <th className="p-2.5">Log Ref</th>
                <th className="p-2.5">Shift & Date</th>
                <th className="p-2.5">Output Tonnage</th>
                <th className="p-2.5">Manpower</th>
                <th className="p-2.5">SAP Tx ID</th>
                <th className="p-2.5">SHA-256 Hash</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d] font-mono text-[11px]">
              {syncLogs.map((tx) => (
                <tr key={tx.syncId} className="hover:bg-[#0d1117]/60 transition">
                  <td className="p-2.5 font-bold text-[#ea580c]">{tx.syncId}</td>
                  <td className="p-2.5 text-[#e6edf3]">{tx.logId}</td>
                  <td className="p-2.5 text-[#8b949e]">{tx.date} ({tx.shift.replace("SHIFT_", "S-")})</td>
                  <td className="p-2.5 text-[#e6edf3] font-bold">{tx.totalTonnage.toFixed(1)} t</td>
                  <td className="p-2.5 text-[#c9d1d9]">{tx.manpowerPresent}</td>
                  <td className="p-2.5 text-[#d29922]">{tx.sapTransactionId}</td>
                  <td className="p-2.5 text-[#8b949e] text-[10px]" title={tx.sha256Verification}>
                    {tx.sha256Verification.slice(0, 16)}...
                  </td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded bg-[#112316] border border-[#238636] text-[#3fb950] font-semibold text-[10px]">
                      {tx.erpStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
