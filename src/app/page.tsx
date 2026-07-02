"use client";

import { useState } from "react";
import AuditInput from "@/components/AuditInput";
import AuditResults from "@/components/AuditResults";
import type { AuditReport } from "@/types/audit";

const MOCK_REPORT: AuditReport = {
  overallScore: 62,
  contentLength: 4827,
  timestamp: new Date().toISOString(),
  pillars: [
    {
      pillar: "SEO",
      score: 74,
      issues: [
        {
          id: "seo-1",
          pillar: "SEO",
          severity: "moderate",
          title: "Missing meta description",
          description:
            "The content does not include a clear meta description or summary paragraph that search engines can use as a snippet.",
          suggestion:
            "Add a concise 150-160 character meta description that summarizes the page content and includes the primary keyword.",
        },
        {
          id: "seo-2",
          pillar: "SEO",
          severity: "minor",
          title: "Low keyword density for primary term",
          description:
            'The primary keyword "content optimization" appears only twice in ~4,800 characters of content.',
          suggestion:
            "Increase natural keyword usage to 3-5 mentions, especially in headings and the first 100 words.",
        },
      ],
    },
    {
      pillar: "AEO",
      score: 45,
      issues: [
        {
          id: "aeo-1",
          pillar: "AEO",
          severity: "critical",
          title: "No FAQ or question-answer structure",
          description:
            "The content lacks question-and-answer formatting that AI assistants and answer engines rely on to extract direct answers.",
          suggestion:
            "Add an FAQ section with 3-5 common questions answered in concise, direct paragraphs.",
        },
      ],
    },
    {
      pillar: "GEO",
      score: 58,
      issues: [
        {
          id: "geo-1",
          pillar: "GEO",
          severity: "moderate",
          title: "No citations or authoritative sources",
          description:
            "The content makes claims without linking to studies, reports, or authoritative sources that generative engines use to verify facts.",
          suggestion:
            "Add 2-3 inline citations to reputable sources (research papers, industry reports) to improve trustworthiness.",
        },
      ],
    },
    {
      pillar: "AIO",
      score: 81,
      issues: [
        {
          id: "aio-1",
          pillar: "AIO",
          severity: "minor",
          title: "Limited structured data hints",
          description:
            "Content lacks explicit structured hints (definition lists, tables) that AI models use for knowledge extraction.",
          suggestion:
            "Consider adding a comparison table or definition list for key terms.",
        },
      ],
    },
    {
      pillar: "Technical",
      score: 52,
      issues: [
        {
          id: "tech-1",
          pillar: "Technical",
          severity: "critical",
          title: "No heading hierarchy detected",
          description:
            "The content does not follow a clear H1 → H2 → H3 heading hierarchy, which hurts both SEO and AI content parsing.",
          suggestion:
            "Restructure content with a single H1, followed by H2 sections and H3 subsections.",
        },
        {
          id: "tech-2",
          pillar: "Technical",
          severity: "moderate",
          title: "Images referenced without alt text",
          description:
            "Two image references were found without descriptive alt attributes.",
          suggestion:
            "Add descriptive alt text to all images that conveys the image content and purpose.",
        },
      ],
    },
  ],
};

type ViewState = "input" | "results";

export default function Home() {
  const [view, setView] = useState<ViewState>("input");

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
      {view === "input" ? (
        <AuditInput onAuditComplete={() => setView("results")} />
      ) : (
        <AuditResults
          report={MOCK_REPORT}
          onNewAudit={() => setView("input")}
        />
      )}
    </main>
  );
}
