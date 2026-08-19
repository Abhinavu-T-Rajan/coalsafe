"use client";

import React from "react";
import type { SimulationScoreReport } from "@coalsafe/types";
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  FileCheck,
} from "lucide-react";

interface ScoreReportModalProps {
  report: SimulationScoreReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreReportModal: React.FC<ScoreReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !report) return null;

  const isPassed = report.grade === "S" || report.grade === "A" || report.grade === "B";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md bg-[#161b22] border border-[#30363d] p-5 space-y-4 shadow-xl text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#ea580c]" />
            <h3 className="text-base font-bold text-[#e6edf3]">
              Post-Incident DGMS Statutory Compliance Audit Report
            </h3>
          </div>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grade Banner */}
        <div
          className={`p-4 rounded-md border flex items-center justify-between ${
            isPassed
              ? "bg-[#112316] border-[#238636] text-[#3fb950]"
              : "bg-[#220d0e] border-[#f85149] text-[#ff7b72]"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider block">
              Statutory Evaluation Result
            </span>
            <div className="text-xl font-bold">
              {isPassed ? "REGULATORY CRITERIA SATISFIED" : "STATUTORY NON-COMPLIANCE DETECTED"}
            </div>
            <p className="text-[11px] text-[#c9d1d9]">{report.evaluationSummary}</p>
          </div>

          <div className="text-center p-2 rounded bg-[#0d1117] border border-current min-w-[70px]">
            <span className="text-[9px] uppercase font-mono block">Grade</span>
            <span className="text-2xl font-black font-mono">{report.grade}</span>
          </div>
        </div>

        {/* Audit Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d]">
            <span className="text-[9px] text-[#8b949e] uppercase block">Lives Protected</span>
            <div className="text-base font-bold text-[#e6edf3]">
              {report.livesProtected} / {report.totalPersonnel}
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d]">
            <span className="text-[9px] text-[#8b949e] uppercase block">Response Time</span>
            <div className="text-base font-bold text-[#ea580c]">{report.responseTimeSeconds}s</div>
          </div>
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d]">
            <span className="text-[9px] text-[#8b949e] uppercase block">DGMS Score</span>
            <div className="text-base font-bold text-[#3fb950]">{report.dgmsComplianceScore}%</div>
          </div>
          <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d]">
            <span className="text-[9px] text-[#8b949e] uppercase block">Asset Protection</span>
            <div className="text-base font-bold text-[#58a6ff]">{report.infrastructureDamageScore}%</div>
          </div>
        </div>

        {/* Violations */}
        {report.violations.length > 0 ? (
          <div className="p-3 rounded bg-[#220d0e] border border-[#f85149] space-y-1.5">
            <div className="font-bold text-[#ff7b72] flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>Statutory Violations Recorded:</span>
            </div>
            {report.violations.map((v, idx) => (
              <div key={idx} className="text-[11px] text-[#c9d1d9] pl-2 border-l-2 border-[#f85149]">
                <strong>[{v.regulation}] {v.code}:</strong> {v.message} (T+{v.timestampStep * 5}s)
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded bg-[#112316] border border-[#238636] text-[#3fb950] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero statutory Coal Mines Regulations violations detected during response.</span>
          </div>
        )}

        {/* Key Strengths & Corrective Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded bg-[#0d1117] border border-[#21262d] space-y-1">
            <span className="font-bold text-[#3fb950] block">Key Operational Strengths:</span>
            <ul className="space-y-0.5 text-[#c9d1d9] text-[11px]">
              {report.keyStrengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-[#3fb950]">&bull;</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded bg-[#0d1117] border border-[#21262d] space-y-1">
            <span className="font-bold text-[#d29922] block">Recommended Corrective Actions:</span>
            <ul className="space-y-0.5 text-[#c9d1d9] text-[11px]">
              {report.correctiveActions.map((c, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-[#d29922]">&bull;</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-[#21262d]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] font-medium uppercase tracking-wider"
          >
            Close Audit Review
          </button>
        </div>
      </div>
    </div>
  );
};
