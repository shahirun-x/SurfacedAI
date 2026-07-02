/**
 * SEO pillar analyzer.
 * Checks: title/H1, heading hierarchy, content length, keyword density, readability.
 */

import type { PillarScore, AuditIssue } from "@/types/audit";
import {
  extractHeadings,
  checkHeadingHierarchy,
  countWords,
  topKeywords,
  fleschReadingEase,
  splitLines,
  computeScore,
  createIssue,
} from "./utils";
import { buildIssueFromRule } from "./rules/loader";
import { defaultBrandConfig } from "./config";

const PILLAR = "SEO" as const;
const KEYWORD_STUFFING_THRESHOLD = 5.0; // density % above which we flag
const LOW_KEYWORD_DENSITY = 0.8; // density % below which top keyword is too rare

export function analyzeSEO(content: string, targetKeyword?: string): PillarScore {
  const issues: AuditIssue[] = [];
  const headings = extractHeadings(content);
  const wordCount = countWords(content);
  const lines = splitLines(content);

  // ── 1. Title / H1 detection ───────────────────────────────────────────
  const h1s = headings.filter((h) => h.level === 1);
  let titleText = "";

  if (h1s.length === 0) {
    // Check if the first non-empty line looks like a title (short, no period)
    const firstLine = lines.find((l) => l.trim().length > 0)?.trim() || "";
    const looksLikeTitle =
      firstLine.length > 0 &&
      firstLine.length < 120 &&
      !firstLine.endsWith(".");

    if (!looksLikeTitle) {
      issues.push(
        createIssue(
          PILLAR,
          "critical",
          "No title or H1 heading detected",
          "The content has no markdown H1 heading and the first line doesn't appear to be a title. Search engines rely on a clear H1 to understand page topic.",
          "Add a descriptive H1 heading (# Your Title) as the first element of your content."
        )
      );
    } else {
      titleText = firstLine.replace(/^#+\s*/, "");
    }
  } else {
    titleText = h1s[0].text;
  }

  if (titleText) {
    if (titleText.length >= 60) {
      issues.push(
        buildIssueFromRule("title-max-length", `(Current length: ${titleText.length} chars)`)
      );
    }

    if (targetKeyword) {
      if (!titleText.toLowerCase().includes(targetKeyword.toLowerCase())) {
        issues.push(
          buildIssueFromRule("title-primary-keyword-present", `(Missing keyword: "${targetKeyword}")`)
        );
      }
    }
  }

  // ── 2. Heading hierarchy ──────────────────────────────────────────────
  const hierarchyProblems = checkHeadingHierarchy(headings);
  if (hierarchyProblems.length > 0) {
    issues.push(
      createIssue(
        PILLAR,
        "moderate",
        "Heading hierarchy issues",
        `Found ${hierarchyProblems.length} heading structure problem(s): ${hierarchyProblems[0]}${hierarchyProblems.length > 1 ? ` (and ${hierarchyProblems.length - 1} more)` : ""}.`,
        "Ensure headings follow a logical order: H1 → H2 → H3. Don't skip levels."
      )
    );
  }

  // ── 3. Content length ─────────────────────────────────────────────────
  // Note: We use the standard-articles threshold by default as a simplification,
  // since we cannot automatically determine 'complex' topics yet.
  if (wordCount < defaultBrandConfig.minWordCountStandard) {
    issues.push(
      buildIssueFromRule(
        "content-length-standard-articles",
        `(Current word count: ${wordCount})`,
        { "1,700-1,800": defaultBrandConfig.minWordCountStandard.toString() }
      )
    );
  }

  // ── 4. Keyword density ────────────────────────────────────────────────
  const keywords = topKeywords(content, 5);

  if (wordCount >= 50) {
    // Only check if there's enough content to be meaningful
    if (keywords.length === 0 || keywords[0].density < LOW_KEYWORD_DENSITY) {
      issues.push(
        createIssue(
          PILLAR,
          "minor",
          "No clear primary keyword",
          `No single meaningful word appears with enough frequency to act as a primary keyword. The most frequent term${keywords[0] ? ` ("${keywords[0].word}") appears at only ${keywords[0].density}% density` : " could not be determined"}.`,
          "Identify your target keyword and use it naturally 3–5 times, especially in the title, first paragraph, and subheadings."
        )
      );
    }

    // Check for keyword stuffing
    const stuffedKeywords = keywords.filter(
      (k) => k.density > KEYWORD_STUFFING_THRESHOLD
    );
    if (stuffedKeywords.length > 0) {
      const worst = stuffedKeywords[0];
      issues.push(
        createIssue(
          PILLAR,
          "moderate",
          "Possible keyword stuffing",
          `The word "${worst.word}" appears ${worst.count} times (${worst.density}% density), which may be flagged as keyword stuffing by search engines.`,
          `Reduce usage of "${worst.word}" and use synonyms or related terms to sound more natural.`
        )
      );
    }
  }

  // ── 5. Readability ────────────────────────────────────────────────────
  if (wordCount >= 30) {
    const readability = fleschReadingEase(content);
    if (readability.score < 30) {
      issues.push(
        createIssue(
          PILLAR,
          "moderate",
          "Very difficult readability",
          `Flesch Reading Ease score is ${readability.score} (college graduate level). Most web content should target 50–70 for broad accessibility.`,
          "Use shorter sentences, simpler words, and break up complex ideas into digestible paragraphs."
        )
      );
    } else if (readability.score < 50) {
      issues.push(
        createIssue(
          PILLAR,
          "minor",
          "Difficult readability",
          `Flesch Reading Ease score is ${readability.score} (college level). Consider simplifying for a wider audience.`,
          "Aim for a Flesch score of 50–70 by shortening sentences and replacing jargon where possible."
        )
      );
    }
  }

  // ── 6. Internal links ─────────────────────────────────────────────────
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  const internalLinks = [];
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2].trim();
    if (url.startsWith("/") && url !== "/" && !url.includes("pricing")) {
      internalLinks.push({ url, index: match.index });
    }
  }

  if (
    internalLinks.length < defaultBrandConfig.internalLinksMin ||
    (defaultBrandConfig.internalLinksMax !== null && internalLinks.length > defaultBrandConfig.internalLinksMax)
  ) {
    const internalLinksRange = defaultBrandConfig.internalLinksMax 
      ? `${defaultBrandConfig.internalLinksMin} to ${defaultBrandConfig.internalLinksMax}` 
      : `at least ${defaultBrandConfig.internalLinksMin}`;
    const internalLinksBetween = defaultBrandConfig.internalLinksMax 
      ? `between ${defaultBrandConfig.internalLinksMin} and ${defaultBrandConfig.internalLinksMax}` 
      : `at least ${defaultBrandConfig.internalLinksMin}`;
      
    const linksWord = defaultBrandConfig.internalLinksMax || defaultBrandConfig.internalLinksMin !== 1 ? "internal links" : "internal link";
    const qualifyingLinksWord = internalLinks.length === 1 ? "link" : "links";

    issues.push(
      buildIssueFromRule(
        "internal-links-minimum-count",
        `(Found ${internalLinks.length} qualifying ${qualifyingLinksWord})`,
        {
          "between 2 and 4": internalLinksBetween,
          "2 to 4 internal links": `${internalLinksRange} ${linksWord}`
        }
      )
    );
  }

  if (internalLinks.length > 0) {
    const oneThird = Math.floor(content.length / 3);
    const twoThirds = Math.floor((content.length * 2) / 3);
    const hasMidLink = internalLinks.some(link => link.index >= oneThird && link.index <= twoThirds);
    if (!hasMidLink) {
      issues.push(buildIssueFromRule("internal-links-mid-article-placement"));
    }
  }

  return {
    pillar: PILLAR,
    score: computeScore(issues),
    issues,
  };
}
