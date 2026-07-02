/**
 * AEO (Answer Engine Optimization) pillar analyzer.
 * Checks: question-style headings, list structures, direct-answer opening,
 * FAQ-style sections.
 */

import type { PillarScore, AuditIssue } from "@/types/audit";
import {
  extractHeadings,
  splitParagraphs,
  splitLines,
  countWords,
  computeScore,
  createIssue,
  hasMinimumStructuralSignal,
} from "./utils";
import { buildIssueFromRule } from "./rules/loader";
import { defaultBrandConfig } from "./config";

const PILLAR = "AEO" as const;

const QUESTION_PATTERNS = [
  /^(what|who|where|when|why|how|which|can|does|do|is|are|should|will|would)\b/i,
];

const DEFINITION_PATTERNS = [
  /^.{0,60}\b(is a|is an|refers to|means|defined as|describes|involves)\b/i,
];

export function analyzeAEO(content: string): PillarScore {
  const issues: AuditIssue[] = [];
  const headings = extractHeadings(content);
  const paragraphs = splitParagraphs(content);
  const lines = splitLines(content);

  // ── 1. Question-style headings or sentences ───────────────────────────
  const questionHeadings = headings.filter(
    (h) =>
      h.text.endsWith("?") ||
      QUESTION_PATTERNS.some((p) => p.test(h.text))
  );

  // Also scan for question sentences in the body
  const questionSentences = lines.filter(
    (line) =>
      line.trim().endsWith("?") &&
      !line.trim().startsWith("#") // not a heading
  );

  const totalQuestions = questionHeadings.length + questionSentences.length;

  if (totalQuestions === 0) {
    issues.push(
      createIssue(
        PILLAR,
        "critical",
        "No question-style content detected",
        "The content contains no questions — neither in headings nor in body text. Answer engines prioritize content that directly mirrors user queries.",
        'Add question-based headings like "What is X?", "How does Y work?" to match common search queries.'
      )
    );
  } else if (questionHeadings.length === 0 && questionSentences.length > 0) {
    issues.push(
      createIssue(
        PILLAR,
        "minor",
        "Questions found in body but not in headings",
        `Found ${questionSentences.length} question(s) in body text but none used as headings. Question headings are stronger signals for answer engines.`,
        "Promote key questions to H2 or H3 headings so they can be directly matched to user queries."
      )
    );
  }

  // ── 2. List / numbered structure ──────────────────────────────────────
  const listLines = lines.filter((line) =>
    /^\s*([-*+]|\d+[.)]\s)/.test(line)
  );

  if (listLines.length === 0) {
    issues.push(
      createIssue(
        PILLAR,
        "moderate",
        "No list or step-by-step structure",
        "The content lacks markdown lists (-, *, 1.) which answer engines use to extract structured how-to answers and featured snippets.",
        'Add bullet or numbered lists for processes, features, or key points — especially under "How to" headings.'
      )
    );
  }

  // ── 3. Direct-answer opening paragraph ────────────────────────────────
  if (paragraphs.length > 0) {
    const firstPara = paragraphs[0];
    // Strip leading heading if the first paragraph starts with one
    const cleaned = firstPara.replace(/^#{1,6}\s+.+\n?/, "").trim();

    if (cleaned.length > 0) {
      const firstParaWords = countWords(cleaned);
      const hasDefinitionPattern = DEFINITION_PATTERNS.some((p) =>
        p.test(cleaned)
      );

      if (firstParaWords > 80 && !hasDefinitionPattern) {
        issues.push(
          createIssue(
            PILLAR,
            "moderate",
            "Opening paragraph buries the point",
            `The first paragraph is ${firstParaWords} words long and doesn't appear to directly define or answer the topic. Answer engines prefer concise, upfront answers.`,
            "Start with a 1-2 sentence definition or direct answer (under 50 words), then expand in subsequent paragraphs."
          )
        );
      }
    }
  }

  // ── 4. FAQ-style sections ─────────────────────────────────────────────
  const faqHeadings = headings.filter(
    (h) =>
      /\bfaq\b/i.test(h.text) ||
      /\bfrequently asked/i.test(h.text) ||
      /\bquestions?\b/i.test(h.text)
  );

  let maxFaqQuestions = 0;

  if (faqHeadings.length > 0) {
    for (const faqHeading of faqHeadings) {
      // Find the end line of this FAQ section
      let endLineIndex = lines.length;
      for (const h of headings) {
        if (h.lineIndex > faqHeading.lineIndex && h.level <= faqHeading.level) {
          endLineIndex = h.lineIndex;
          break;
        }
      }

      // Count questions in this section
      let sectionQuestions = 0;
      for (let i = faqHeading.lineIndex + 1; i < endLineIndex; i++) {
        const line = lines[i].trim();
        const cleanedLine = line.replace(/^#{1,6}\s+/, "").trim();
        if (cleanedLine.length > 0 && (cleanedLine.endsWith("?") || QUESTION_PATTERNS.some((p) => p.test(cleanedLine)))) {
          sectionQuestions++;
        }
      }
      maxFaqQuestions = Math.max(maxFaqQuestions, sectionQuestions);
    }
  }

  // Also check if there are multiple consecutive question headings (implicit FAQ)
  let consecutiveQuestions = 0;
  let maxConsecutive = 0;
  for (const h of headings) {
    if (h.text.endsWith("?") || QUESTION_PATTERNS.some((p) => p.test(h.text))) {
      consecutiveQuestions++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveQuestions);
    } else {
      consecutiveQuestions = 0;
    }
  }

  const hasImplicitFAQ = maxConsecutive >= 3;

  if (hasImplicitFAQ && maxFaqQuestions < maxConsecutive) {
    maxFaqQuestions = maxConsecutive;
  }

  if (faqHeadings.length === 0 && !hasImplicitFAQ) {
    issues.push(
      createIssue(
        PILLAR,
        "moderate",
        "No FAQ section detected",
        "The content has no dedicated FAQ section or cluster of question-answer headings. FAQ blocks are high-value for answer engine extraction.",
        'Add an "FAQ" or "Frequently Asked Questions" section with 3-5 Q&A pairs relevant to the topic.'
      )
    );
  } else if (maxFaqQuestions < defaultBrandConfig.faqMinimumCount) {
    const faqWord = defaultBrandConfig.faqMinimumCount === 1 ? "question" : "questions";
    const foundWord = maxFaqQuestions === 1 ? "question" : "questions";
    issues.push(
      buildIssueFromRule(
        "faq-minimum-count",
        `(Found ${maxFaqQuestions} ${foundWord})`,
        {
          "5 questions": `${defaultBrandConfig.faqMinimumCount} ${faqWord}`,
          "at least 5": `at least ${defaultBrandConfig.faqMinimumCount}`,
          "5 FAQs": `${defaultBrandConfig.faqMinimumCount} FAQs`
        }
      )
    );
  }

  // ── 5. Insufficient structure for answer extraction ────────────────────
  if (!hasMinimumStructuralSignal(content)) {
    issues.push(
      createIssue(
        PILLAR,
        "critical",
        "Content too unstructured for answer extraction",
        "The content is short and lacks any structural signals (headings, lists). Answer engines cannot reliably extract answers from unstructured, sparse content.",
        "Structure your content with headings, bullet lists, and question-answer pairs to make it extractable by answer engines."
      )
    );
  }

  return {
    pillar: PILLAR,
    score: computeScore(issues),
    issues,
  };
}
