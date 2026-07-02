/**
 * AIO (AI Optimization) pillar analyzer.
 * Checks: semantic heading structure, paragraph chunkability,
 * terminology consistency.
 */

import type { PillarScore, AuditIssue } from "@/types/audit";
import {
  extractHeadings,
  splitParagraphs,
  countWords,
  extractWords,
  STOPWORDS,
  computeScore,
  createIssue,
} from "./utils";

const PILLAR = "AIO" as const;
const MAX_PARAGRAPH_WORDS = 150;

export function analyzeAIO(content: string): PillarScore {
  const issues: AuditIssue[] = [];
  const headings = extractHeadings(content);
  const paragraphs = splitParagraphs(content);
  const wordCount = countWords(content);

  // ── 1. Semantic heading structure (wall-of-text check) ────────────────
  if (headings.length === 0 && wordCount >= 100) {
    issues.push(
      createIssue(
        PILLAR,
        "critical",
        "No headings — wall of text",
        `The content is ${wordCount} words with zero markdown headings. AI models use headings to chunk and index content semantically.`,
        "Break the content into logical sections with H2 headings, and use H3 for subsections."
      )
    );
  } else if (headings.length > 0 && wordCount >= 200) {
    // Check ratio of headings to words — ideally ~1 heading per 150-300 words
    const wordsPerHeading = wordCount / headings.length;
    if (wordsPerHeading > 500) {
      issues.push(
        createIssue(
          PILLAR,
          "moderate",
          "Too few headings for content length",
          `Only ${headings.length} heading(s) across ${wordCount} words (~${Math.round(wordsPerHeading)} words per section). Large unstructured blocks are harder for AI to parse.`,
          "Aim for a heading every 150-300 words to create well-defined, semantically clear sections."
        )
      );
    }
  }

  // ── 2. Chunkability — average paragraph length ────────────────────────
  if (paragraphs.length > 0) {
    const paraWordCounts = paragraphs.map((p) => countWords(p));
    const longParas = paraWordCounts.filter((wc) => wc > MAX_PARAGRAPH_WORDS);

    if (longParas.length > 0) {
      const longestPara = Math.max(...paraWordCounts);
      const avgPara = Math.round(
        paraWordCounts.reduce((a, b) => a + b, 0) / paraWordCounts.length
      );

      if (longParas.length >= 3 || avgPara > MAX_PARAGRAPH_WORDS) {
        issues.push(
          createIssue(
            PILLAR,
            "moderate",
            "Paragraphs too long for clean extraction",
            `${longParas.length} paragraph(s) exceed ${MAX_PARAGRAPH_WORDS} words (longest: ${longestPara} words, avg: ${avgPara}). AI systems extract individual passages — overly long blocks reduce precision.`,
            `Break paragraphs over ${MAX_PARAGRAPH_WORDS} words into smaller, self-contained chunks that each cover a single idea.`
          )
        );
      } else {
        issues.push(
          createIssue(
            PILLAR,
            "minor",
            "Some long paragraphs detected",
            `${longParas.length} paragraph(s) exceed ${MAX_PARAGRAPH_WORDS} words (longest: ${longestPara} words). Consider splitting for better AI extractability.`,
            "Aim for paragraphs of 50-100 words. Each paragraph should convey one key point."
          )
        );
      }
    }
  }

  // ── 3. Terminology consistency (light heuristic) ──────────────────────
  // Find the top meaningful terms, then check if similar-looking variants exist
  // that might indicate inconsistent naming.
  if (wordCount >= 100) {
    const words = extractWords(content).filter((w) => !STOPWORDS.has(w) && w.length >= 4);
    const freq = new Map<string, number>();
    for (const w of words) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }

    // Get words that appear at least twice
    const significantWords = Array.from(freq.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);

    // Check for potential inconsistencies:
    // words that share a stem (first 5+ chars) but differ in suffix
    const stems = new Map<string, string[]>();
    for (const [word] of significantWords) {
      if (word.length >= 5) {
        const stem = word.slice(0, Math.min(word.length - 1, 6));
        if (!stems.has(stem)) stems.set(stem, []);
        stems.get(stem)!.push(word);
      }
    }

    const inconsistentGroups = Array.from(stems.values())
      .filter((group) => group.length >= 3) // 3+ variants of the same stem
      .filter((group) => {
        // Filter out obviously different words that happen to share a prefix
        const shortest = Math.min(...group.map((w) => w.length));
        const longest = Math.max(...group.map((w) => w.length));
        return longest - shortest <= 4; // variants shouldn't differ wildly in length
      });

    if (inconsistentGroups.length >= 2) {
      const example = inconsistentGroups[0].slice(0, 3).join('", "');
      issues.push(
        createIssue(
          PILLAR,
          "minor",
          "Possible terminology inconsistency",
          `Found ${inconsistentGroups.length} groups of similar-but-different terms (e.g., "${example}"). Inconsistent terminology confuses AI knowledge extraction.`,
          "Standardize on one term for each concept. For example, pick either \"optimize\" or \"optimization\" and use it consistently."
        )
      );
    }
  }

  return {
    pillar: PILLAR,
    score: computeScore(issues),
    issues,
  };
}
