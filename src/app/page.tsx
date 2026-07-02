"use client";

import { useState } from "react";
import AuditInput from "@/components/AuditInput";
import AuditResults from "@/components/AuditResults";
import { runFullAudit } from "@/lib/analysis";
import type { AuditReport } from "@/types/audit";

type ViewState = "input" | "results";

export default function Home() {
  const [view, setView] = useState<ViewState>("input");
  const [report, setReport] = useState<AuditReport | null>(null);

  function handleAuditComplete(content: string) {
    const result = runFullAudit(content);
    setReport(result);
    setView("results");
  }

  function handleNewAudit() {
    setReport(null);
    setView("input");
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--color-ink)" }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="text-center mb-10">
        <h1
          className="text-hero tracking-tight"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
        >
          Surfaced
          <span style={{ color: "var(--color-teal)" }}>.ai</span>
        </h1>
        <p
          className="mt-3 text-xl font-light"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-inter), system-ui, sans-serif" }}
        >
          See if your content actually gets found.
        </p>
      </div>

      {/* ── View ─────────────────────────────────────────────────────────── */}
      {view === "input" || !report ? (
        <AuditInput onAuditComplete={handleAuditComplete} />
      ) : (
        <AuditResults report={report} onNewAudit={handleNewAudit} />
      )}
    </main>
  );
}
