"use client";

import { useState } from "react";
import type { AuditReport, AuditIssue } from "@/types/audit";
import { generateMarkdownReport } from "@/lib/utils/generateReport";
import { downloadTextFile } from "@/lib/utils/downloadFile";
import DepthGauge from "@/components/DepthGauge";

interface AuditResultsProps {
  report: AuditReport;
  onNewAudit: () => void;
}

/** Border + background accent for a pillar card based on score */
function pillarCardClass(score: number): string {
  if (score >= 80)
    return "border-[color-mix(in_srgb,var(--color-teal)_30%,transparent)] bg-(--color-surface)";
  if (score >= 50)
    return "border-[color-mix(in_srgb,var(--color-text-muted)_30%,transparent)] bg-(--color-surface)";
  return "border-[color-mix(in_srgb,var(--color-amber)_30%,transparent)] bg-(--color-surface)";
}

/** Score number color for pillar cards */
function pillarScoreColor(score: number): string {
  if (score >= 80) return "text-(--color-teal)";
  if (score >= 50) return "text-(--color-text-muted)";
  return "text-(--color-amber)";
}

/** Severity badge styles */
function severityBadge(severity: AuditIssue["severity"]) {
  const styles: Record<
    AuditIssue["severity"],
    { bg: string; text: string; border: string; label: string }
  > = {
    critical: {
      bg: "bg-[color-mix(in_srgb,var(--color-amber)_15%,transparent)]",
      text: "text-(--color-amber)",
      border: "border-[color-mix(in_srgb,var(--color-amber)_35%,transparent)]",
      label: "critical",
    },
    moderate: {
      bg: "bg-[color-mix(in_srgb,var(--color-teal)_10%,transparent)]",
      text: "text-(--color-text-muted)",
      border: "border-[color-mix(in_srgb,var(--color-teal)_25%,transparent)]",
      label: "moderate",
    },
    minor: {
      bg: "bg-[color-mix(in_srgb,var(--color-text-muted)_12%,transparent)]",
      text: "text-(--color-text-muted)",
      border: "border-[color-mix(in_srgb,var(--color-text-muted)_25%,transparent)]",
      label: "minor",
    },
  };
  const s = styles[severity];
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}
    >
      {s.label}
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
    <div className="w-full max-w-4xl flex flex-col items-center gap-10 px-4">
      {/* ── Overall Score: Depth Gauge ───────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2">
        <p
          className="text-xs uppercase tracking-widest font-medium"
          style={{ color: "var(--color-text-muted)" }}
        >
          Overall Score
        </p>
        <DepthGauge score={report.overallScore} />
        <p className="text-caption" style={{ color: "var(--color-text-muted)" }}>
          {report.contentLength.toLocaleString()} characters analyzed ·{" "}
          {new Date(report.timestamp).toLocaleString()}
        </p>
      </div>

      {/* ── Pillar Score Cards ────────────────────────────────────────────── */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {report.pillars.map((pillar) => (
          <div
            key={pillar.pillar}
            className={`rounded-xl border ${pillarCardClass(pillar.score)} p-4 flex flex-col items-center gap-2 transition-opacity hover:opacity-90`}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              {pillar.pillar}
            </span>
            <span
              className={`font-instrument text-3xl font-bold tabular-nums ${pillarScoreColor(pillar.score)}`}
            >
              {pillar.score}
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--color-border)" }}
            >
              / 100
            </span>
          </div>
        ))}
      </div>

      {/* ── Issues ───────────────────────────────────────────────────────── */}
      <div className="w-full">
        <h2
          className="text-h2 mb-4"
          style={{ color: "var(--color-text-primary)", fontSize: "1.125rem", fontWeight: 600 }}
        >
          Issues
        </h2>

        {allIssues.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl border border-dashed"
            style={{
              color: "var(--color-text-muted)",
              borderColor: "var(--color-border)",
            }}
          >
            No issues found yet.
          </div>
        ) : (
          <div className="space-y-3">
            {allIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-xl flex flex-col gap-2"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {severityBadge(issue.severity)}
                  <span
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {issue.pillar}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {issue.title}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {issue.description}
                </p>
                <p
                  className="text-sm italic"
                  style={{ color: "var(--color-text-muted)", opacity: 0.75 }}
                >
                  💡 {issue.suggestion}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Action Buttons ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-4 pb-8">
        <button
          onClick={onNewAudit}
          className="px-6 py-2.5 rounded-xl font-medium text-sm transition-colors duration-150"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            background: "transparent",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--color-surface)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          ← New Audit
        </button>
        <button
          onClick={handleExport}
          className="px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-150"
          style={
            exported
              ? {
                  background: `color-mix(in srgb, var(--color-teal) 12%, transparent)`,
                  color: "var(--color-teal)",
                  border: "1px solid color-mix(in srgb, var(--color-teal) 35%, transparent)",
                }
              : {
                  background: "var(--color-teal)",
                  color: "var(--color-ink)",
                  border: "1px solid transparent",
                  fontWeight: 600,
                }
          }
        >
          {exported ? "Downloaded ✓" : "Export as Markdown"}
        </button>
      </div>
    </div>
  );
}
