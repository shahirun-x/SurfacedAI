/**
 * Main analysis engine entry point.
 * Runs all 5 pillar analyzers and computes an overall score.
 */

import type { AuditReport } from "@/types/audit";
import { resetIssueCounter } from "./utils";
import { analyzeSEO } from "./seo";
import { analyzeAEO } from "./aeo";
import { analyzeGEO } from "./geo";
import { analyzeAIO } from "./aio";
import { analyzeTechnical } from "./technical";

export function runFullAudit(content: string, targetKeyword?: string): AuditReport {
  // Reset issue ID counter for a clean run
  resetIssueCounter();

  const pillars = [
    analyzeSEO(content, targetKeyword),
    analyzeAEO(content),
    analyzeGEO(content),
    analyzeAIO(content),
    analyzeTechnical(content),
  ];

  const overallScore = Math.round(
    pillars.reduce((sum, p) => sum + p.score, 0) / pillars.length
  );

  return {
    overallScore,
    pillars,
    contentLength: content.length,
    timestamp: new Date().toISOString(),
  };
}
