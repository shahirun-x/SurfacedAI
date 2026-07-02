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
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center p-6">
      {/* Header — always visible */}
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-neutral-200 to-neutral-500">
          Surfaced.ai
        </h1>
        <p className="mt-3 text-xl md:text-2xl text-neutral-400 font-light">
          See if your content actually gets found.
        </p>
      </div>

      {/* View switcher */}
      {view === "input" || !report ? (
        <AuditInput onAuditComplete={handleAuditComplete} />
      ) : (
        <AuditResults report={report} onNewAudit={handleNewAudit} />
      )}
    </main>
  );
}
