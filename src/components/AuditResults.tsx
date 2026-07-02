"use client";

import { useState } from "react";
import type { AuditReport, AuditIssue } from "@/types/audit";
import { generateMarkdownReport } from "@/lib/utils/generateReport";
import { downloadTextFile } from "@/lib/utils/downloadFile";

interface AuditResultsProps {
  report: AuditReport;
  onNewAudit: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return "from-emerald-500 to-emerald-400";
  if (score >= 50) return "from-amber-500 to-yellow-400";
  return "from-red-500 to-rose-400";
}

function scoreBorderColor(score: number): string {
  if (score >= 80) return "border-emerald-500/30";
  if (score >= 50) return "border-amber-500/30";
  return "border-red-500/30";
}

function scoreTextColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function severityBadge(severity: AuditIssue["severity"]) {
  const colors: Record<AuditIssue["severity"], string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    moderate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    minor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colors[severity]}`}
    >
      {severity}
    </span>
  );
}

export default function AuditResults({ report, onNewAudit }: AuditResultsProps) {
  const [exported, setExported] = useState(false);
  const allIssues = report.pillars.flatMap((p) => p.issues);

  function handleExport() {
    const markdown = generateMarkdownReport(report);
    const ts = new Date(report.timestamp)
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    downloadTextFile(`surfaced-audit-${ts}.md`, markdown);

    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-10">
      {/* Overall Score Hero */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm uppercase tracking-widest text-neutral-500 font-medium">
          Overall Score
        </p>
        <div
          className={`text-7xl md:text-8xl font-bold tracking-tighter bg-gradient-to-b ${scoreColor(report.overallScore)} bg-clip-text text-transparent`}
        >
          {report.overallScore}
        </div>
        <p className="text-sm text-neutral-600">
          {report.contentLength.toLocaleString()} characters analyzed ·{" "}
          {new Date(report.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Pillar Score Cards */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {report.pillars.map((pillar) => (
          <div
            key={pillar.pillar}
            className={`rounded-xl border ${scoreBorderColor(pillar.score)} bg-neutral-900/60 p-4 flex flex-col items-center gap-2 transition-transform hover:scale-[1.03]`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {pillar.pillar}
            </span>
            <span
              className={`text-3xl font-bold ${scoreTextColor(pillar.score)}`}
            >
              {pillar.score}
            </span>
            <span className="text-[11px] text-neutral-600">/ 100</span>
          </div>
        ))}
      </div>

      {/* Issues Section */}
      <div className="w-full">
        <h2 className="text-lg font-semibold text-neutral-300 mb-4">Issues</h2>

        {allIssues.length === 0 ? (
          <div className="text-center py-12 text-neutral-600 border border-dashed border-neutral-800 rounded-xl">
            No issues found yet.
          </div>
        ) : (
          <div className="space-y-3">
            {allIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col gap-2"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {severityBadge(issue.severity)}
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                    {issue.pillar}
                  </span>
                  <span className="text-sm font-medium text-neutral-200">
                    {issue.title}
                  </span>
                </div>
                <p className="text-sm text-neutral-400">{issue.description}</p>
                <p className="text-sm text-neutral-500 italic">
                  💡 {issue.suggestion}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4 pb-8">
        <button
          onClick={onNewAudit}
          className="px-6 py-2.5 rounded-xl font-medium text-sm border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          ← New Audit
        </button>
        <button
          onClick={handleExport}
          className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            exported
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:brightness-110"
          }`}
        >
          {exported ? "Downloaded ✓" : "Export as Markdown"}
        </button>
      </div>
    </div>
  );
}

