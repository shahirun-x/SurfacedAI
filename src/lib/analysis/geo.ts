/**
 * GEO (Generative Engine Optimization) pillar analyzer.
 * Checks: specificity/concrete signals, vague language, self-containedness,
 * structured data presence.
 */

import type { PillarScore, AuditIssue } from "@/types/audit";
import {
  splitSentences,
  splitLines,
  extractWords,
  countWords,
  HEDGE_WORDS,
  computeScore,
  createIssue,
} from "./utils";

const PILLAR = "GEO" as const;

// ── Patterns for concrete signals ───────────────────────────────────────
const NUMBER_PATTERN = /\b\d[\d,.]*\b/g;
const PERCENTAGE_PATTERN = /\d+(\.\d+)?%/g;
const CURRENCY_PATTERN = /\$[\d,.]+|\€[\d,.]+|£[\d,.]+/g;
const YEAR_PATTERN = /\b(19|20)\d{2}\b/g;
// Capitalized multi-word phrase (rough named entity proxy)
const NAMED_ENTITY_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;

// ── Dangling pronoun patterns ───────────────────────────────────────────
const DANGLING_PRONOUN_PATTERN = /^(It|This|That|These|Those|They)\s/;

export function analyzeGEO(content: string): PillarScore {
  const issues: AuditIssue[] = [];
  const sentences = splitSentences(content);
  const lines = splitLines(content);
  const wordCount = countWords(content);

  // ── 1. Specificity check ──────────────────────────────────────────────
  const numbers = (content.match(NUMBER_PATTERN) || []).length;
  const percentages = (content.match(PERCENTAGE_PATTERN) || []).length;
  const currencies = (content.match(CURRENCY_PATTERN) || []).length;
  const years = (content.match(YEAR_PATTERN) || []).length;
  const namedEntities = (content.match(NAMED_ENTITY_PATTERN) || []).length;

  const concreteSignals = numbers + percentages + currencies + years + namedEntities;
  // Expect roughly 1 concrete signal per 50 words for well-sourced content
  const expectedSignals = Math.max(1, Math.floor(wordCount / 50));

  if (concreteSignals === 0 && wordCount >= 50) {
    issues.push(
      createIssue(
        PILLAR,
        "critical",
        "No concrete data points found",
        "The content contains no numbers, dates, statistics, percentages, or named entities. Generative engines prefer fact-rich, citable content.",
        "Add specific data: statistics, dates, percentages, proper names, or research citations to make claims verifiable."
      )
    );
  } else if (concreteSignals < expectedSignals * 0.4 && wordCount >= 100) {
    issues.push(
      createIssue(
        PILLAR,
        "moderate",
        "Low specificity",
        `Found only ${concreteSignals} concrete signal(s) (numbers, dates, named entities) in ${wordCount} words. Well-sourced content typically has more.`,
        "Strengthen claims with specific data points, named sources, and quantified results."
      )
    );
  }

  // ── 2. Vague language penalty ─────────────────────────────────────────
  const words = extractWords(content);
  const hedgeCount = words.filter((w) => HEDGE_WORDS.has(w)).length;
  const hedgeRatio = wordCount > 0 ? hedgeCount / wordCount : 0;

  if (hedgeRatio > 0.04 && hedgeCount >= 5) {
    issues.push(
      createIssue(
        PILLAR,
        "moderate",
        "Excessive vague language",
        `Found ${hedgeCount} hedge/filler words (${(hedgeRatio * 100).toFixed(1)}% of content). Words like "some", "many", "things", "various" weaken authority.`,
        "Replace vague language with precise terms. Instead of \"many users\", say \"78% of surveyed users\" or \"over 10,000 users\"."
      )
    );
  } else if (hedgeRatio > 0.025 && hedgeCount >= 3) {
    issues.push(
      createIssue(
        PILLAR,
        "minor",
        "Some vague language detected",
        `Found ${hedgeCount} hedge/filler words. Consider tightening language for stronger authority signals.`,
        "Review uses of \"some\", \"many\", \"various\", \"things\" and replace with specific, quantified alternatives."
      )
    );
  }

  // ── 3. Self-containedness (dangling pronoun heuristic) ────────────────
  let danglingCount = 0;
  for (let i = 1; i < sentences.length; i++) {
    if (DANGLING_PRONOUN_PATTERN.test(sentences[i].trim())) {
      danglingCount++;
    }
  }

  const danglingRatio = sentences.length > 0 ? danglingCount / sentences.length : 0;

  if (danglingRatio > 0.3 && danglingCount >= 4) {
    issues.push(
      createIssue(
        PILLAR,
        "moderate",
        "Heavy pronoun-dependent sentences",
        `${danglingCount} sentences (${(danglingRatio * 100).toFixed(0)}%) begin with pronouns like "It", "This", "They" without clear antecedents. This makes content harder for LLMs to extract as standalone passages.`,
        "Rewrite pronoun-leading sentences to include the noun they reference. For example, change \"It improves performance\" to \"Caching improves performance\"."
      )
    );
  } else if (danglingRatio > 0.2 && danglingCount >= 3) {
    issues.push(
      createIssue(
        PILLAR,
        "minor",
        "Some pronoun-heavy sentences",
        `${danglingCount} sentences start with vague pronouns. Generative engines extract passages individually — each should stand alone.`,
        "Where possible, replace sentence-starting pronouns with the specific noun they refer to."
      )
    );
  }

  // ── 4. Structured data bonus / penalty ────────────────────────────────
  const hasTable = /\|.+\|/.test(content) && /\|[-:]+\|/.test(content);
  const listLines = lines.filter((l) => /^\s*([-*+]|\d+[.)]\s)/.test(l));
  const hasLists = listLines.length >= 3;

  if (!hasTable && !hasLists) {
    issues.push(
      createIssue(
        PILLAR,
        "minor",
        "No structured data (tables or lists)",
        "The content has no markdown tables or substantial lists. Structured formats make it easier for generative engines to parse and cite information.",
        "Add a comparison table, feature list, or data table to present key information in a structured format."
      )
    );
  }

  return {
    pillar: PILLAR,
    score: computeScore(issues),
    issues,
  };
}
