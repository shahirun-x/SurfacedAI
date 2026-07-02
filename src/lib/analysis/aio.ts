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
  hasMinimumStructuralSignal,
  splitLines,
} from "./utils";
import { buildIssueFromRule } from "./rules/loader";

const PILLAR = "AIO" as const;
const MAX_PARAGRAPH_WORDS = 150;

export function analyzeAIO(content: string): PillarScore {
  const issues: AuditIssue[] = [];
  const headings = extractHeadings(content);
  const paragraphs = splitParagraphs(content);
  const wordCount = countWords(content);
  const lines = splitLines(content);

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
  } else if (headings.length === 0 && !hasMinimumStructuralSignal(content)) {
    // Short AND unstructured — this is a fundamental failure for AI parsability
    issues.push(
      createIssue(
        PILLAR,
        "critical",
        "Content too short/unstructured for reliable AI parsing",
        `The content is only ${wordCount} words with no headings or lists. There is not enough structural signal for AI models to reliably chunk, index, or extract knowledge from this content.`,
        "Add markdown headings (## Section Title) and expand content to at least 150 words with clear topical sections."
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

    // Single undifferentiated block — no headings to create chunk boundaries
    if (headings.length === 0 && paragraphs.length <= 2 && wordCount >= 30) {
      issues.push(
        createIssue(
          PILLAR,
          "moderate",
          "No meaningful chunk boundaries",
          `Content exists as ${paragraphs.length === 1 ? "a single block" : "one or two blocks"} with no heading-based sections. AI models cannot determine where one topic ends and another begins.`,
          "Split the content into distinct sections with descriptive H2/H3 headings so each chunk has a clear topical scope."
        )
      );
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

  // ── 4. Key Takeaways ──────────────────────────────────────────────────
  const KEY_TAKEAWAY_PATTERNS = /^(#+\s+)?(key takeaways?|key points?|tl;?dr|in summary)[:]?/i;
  let ktLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (KEY_TAKEAWAY_PATTERNS.test(lines[i].trim())) {
      ktLineIndex = i;
      break;
    }
  }

  const firstH2 = headings.find((h) => h.level === 2);
  const h2Limit = firstH2 ? firstH2.lineIndex : lines.length;

  if (ktLineIndex === -1) {
    issues.push(buildIssueFromRule("key-takeaways-present"));
  } else if (ktLineIndex > h2Limit) {
    issues.push(
      buildIssueFromRule(
        "key-takeaways-present",
        "(A Key Takeaways block was found, but it is not positioned before the first H2.)"
      )
    );
  } else {
    // Check bullet count and formatting
    const nextHeading = headings.find((h) => h.lineIndex > ktLineIndex);
    const blockEnd = nextHeading ? nextHeading.lineIndex : h2Limit;

    let topLevelBullets = 0;
    let hasNestedBullets = false;
    let hasNonListText = false;

    for (let i = ktLineIndex + 1; i < blockEnd; i++) {
      const line = lines[i];
      if (line.trim().length === 0) continue;

      const match = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)/);
      if (match) {
        const indent = match[1].length;
        if (indent >= 2) {
          hasNestedBullets = true;
        } else {
          topLevelBullets++;
        }
      } else {
        hasNonListText = true;
      }
    }

    if (topLevelBullets < 3 || topLevelBullets > 5 || hasNestedBullets || hasNonListText) {
      let msg = `(Found ${topLevelBullets} bullets`;
      if (hasNestedBullets) msg += ", contains nested bullets";
      if (hasNonListText) msg += ", contains non-list paragraph text";
      msg += ")";
      issues.push(buildIssueFromRule("key-takeaways-bullet-count", msg));
    }
  }

  // ── 5. Real-world example visible text (heuristic) ────────────────────
  const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/;
  const genericAlt = /^(image|photo|picture|untitled|screenshot)?$/i;

  const isTextLine = (idx: number) => {
    if (idx < 0 || idx >= lines.length) return false;
    const l = lines[idx].trim();
    if (l.length === 0) return false;
    if (l.startsWith("![")) return false;
    if (l.startsWith("#")) return false;
    return true;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = IMAGE_PATTERN.exec(line);
    if (match) {
      const alt = match[1].trim();
      if (genericAlt.test(alt)) {
        const hasTextBefore = isTextLine(i - 1) || isTextLine(i - 2);
        const hasTextAfter = isTextLine(i + 1) || isTextLine(i + 2);

        if (!hasTextBefore && !hasTextAfter) {
          const issue = buildIssueFromRule(
            "real-world-example-visible-text",
            "(Found an isolated image with generic/empty alt text that might contain trapped text)"
          );
          issue.severity = "minor";
          issues.push(issue);
          break; // Only flag once
        }
      }
    }
  }

  return {
    pillar: PILLAR,
    score: computeScore(issues),
    issues,
  };
}
