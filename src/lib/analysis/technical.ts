/**
 * Technical pillar analyzer.
 * Proxy checks for content quality (no live page in v1):
 * image alt text, heading hierarchy, content weight estimate.
 */

import type { PillarScore, AuditIssue } from "@/types/audit";
import {
  extractHeadings,
  checkHeadingHierarchy,
  countWords,
  computeScore,
  createIssue,
} from "./utils";

const PILLAR = "Technical" as const;

// Markdown image syntax: ![alt](src)
const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g;

export function analyzeTechnical(content: string): PillarScore {
  const issues: AuditIssue[] = [];
  const headings = extractHeadings(content);
  const wordCount = countWords(content);

  // ── 1. Image alt text ─────────────────────────────────────────────────
  const images: { alt: string; src: string }[] = [];
  let match: RegExpExecArray | null;
  // Reset the regex lastIndex
  IMAGE_PATTERN.lastIndex = 0;
  while ((match = IMAGE_PATTERN.exec(content)) !== null) {
    images.push({ alt: match[1].trim(), src: match[2].trim() });
  }

  if (images.length > 0) {
    const emptyAltImages = images.filter((img) => img.alt === "");
    if (emptyAltImages.length > 0) {
      issues.push(
        createIssue(
          PILLAR,
          emptyAltImages.length >= 3 ? "critical" : "moderate",
          "Images missing alt text",
          `${emptyAltImages.length} of ${images.length} image(s) have empty alt attributes. Alt text is essential for accessibility and SEO.`,
          "Add descriptive alt text to every image that conveys the image's content and purpose."
        )
      );
    }
  }

  // ── 2. Heading hierarchy ──────────────────────────────────────────────
  if (headings.length > 0) {
    const problems = checkHeadingHierarchy(headings);
    if (problems.length > 0) {
      issues.push(
        createIssue(
          PILLAR,
          "moderate",
          "Heading hierarchy problems",
          `${problems.length} heading structure issue(s) found: ${problems[0]}${problems.length > 1 ? ` (and ${problems.length - 1} more)` : ""}.`,
          "Fix heading order: H1 → H2 → H3. Don't skip levels. Use a single H1."
        )
      );
    }
  } else if (wordCount >= 100) {
    issues.push(
      createIssue(
        PILLAR,
        "moderate",
        "No heading structure",
        "The content has no markdown headings. Headings provide semantic structure critical for accessibility, SEO crawlers, and AI parsing.",
        "Add a heading hierarchy with H1 for the title, H2 for major sections, and H3 for subsections."
      )
    );
  }

  // ── 3. Content weight estimate ────────────────────────────────────────
  const charCount = content.length;

  if (wordCount < 100) {
    issues.push(
      createIssue(
        PILLAR,
        "minor",
        "Very light content (estimate)",
        `Content is approximately ${wordCount} words / ${charCount.toLocaleString()} characters — quite light. This is a proxy estimate (no live page metrics available).`,
        "Consider whether this page warrants more substantive content, or if it should be consolidated with another page."
      )
    );
  } else if (wordCount > 5000) {
    issues.push(
      createIssue(
        PILLAR,
        "minor",
        "Very long content (estimate)",
        `Content is approximately ${wordCount.toLocaleString()} words / ${charCount.toLocaleString()} characters. Very long pages can hurt user engagement and load performance.`,
        "Consider splitting into multiple focused pages or adding a table of contents for navigation."
      )
    );
  }

  return {
    pillar: PILLAR,
    score: computeScore(issues),
    issues,
  };
}
