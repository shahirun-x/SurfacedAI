/**
 * Shared helpers for the rule-based analysis engine.
 * No external dependencies — pure TypeScript.
 */

// ─── Stopwords ──────────────────────────────────────────────────────────────

export const STOPWORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any",
  "are","aren't","as","at","be","because","been","before","being","below",
  "between","both","but","by","can","can't","cannot","could","couldn't","did",
  "didn't","do","does","doesn't","doing","don't","down","during","each","few",
  "for","from","further","get","got","had","hadn't","has","hasn't","have",
  "haven't","having","he","he'd","he'll","he's","her","here","here's","hers",
  "herself","him","himself","his","how","how's","i","i'd","i'll","i'm","i've",
  "if","in","into","is","isn't","it","it's","its","itself","let","let's","me",
  "more","most","mustn't","my","myself","no","nor","not","of","off","on",
  "once","only","or","other","ought","our","ours","ourselves","out","over",
  "own","per","same","shan't","she","she'd","she'll","she's","should",
  "shouldn't","so","some","such","than","that","that's","the","their","theirs",
  "them","themselves","then","there","there's","these","they","they'd",
  "they'll","they're","they've","this","those","through","to","too","under",
  "until","up","us","very","was","wasn't","we","we'd","we'll","we're","we've",
  "were","weren't","what","what's","when","when's","where","where's","which",
  "while","who","who's","whom","why","why's","will","with","won't","would",
  "wouldn't","you","you'd","you'll","you're","you've","your","yours",
  "yourself","yourselves","also","just","like","well","even","still","already",
  "really","one","two","new","use","used","using","make","makes","made",
]);

// ─── Hedge / filler words (for GEO vagueness check) ────────────────────────

export const HEDGE_WORDS = new Set([
  "some","many","things","stuff","various","several","numerous","certain",
  "probably","maybe","perhaps","somewhat","relatively","generally",
  "basically","essentially","virtually","practically","roughly","kind of",
  "sort of","a lot","a bit","quite","rather","fairly","mostly",
]);

// ─── Text splitting ─────────────────────────────────────────────────────────

/** Split content into non-empty lines. */
export function splitLines(content: string): string[] {
  return content.split(/\r?\n/);
}

/** Split content into paragraphs (blocks separated by one or more blank lines). */
export function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Split text into sentences (simple heuristic). */
export function splitSentences(text: string): string[] {
  // Split on . ! ? followed by whitespace or end-of-string, but not
  // inside common abbreviations (e.g., U.S., Dr., etc.)
  return text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Extract words (lowercased, alpha-only tokens ≥2 chars). */
export function extractWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]{2,}/g) || []);
}

/** Count words in text (whitespace-split, non-empty). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}

// ─── Syllable estimation ────────────────────────────────────────────────────

/**
 * Estimate the number of syllables in a word.
 * Uses a vowel-group heuristic with common English adjustments.
 */
export function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 2) return 1;

  // Count vowel groups
  const vowelGroups = w.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  // Subtract silent-e at end (but not for words like "the", "be")
  if (w.endsWith("e") && w.length > 3 && !/[aeiouy]e$/i.test(w.slice(0, -1) + "x")) {
    count = Math.max(1, count - 1);
  }

  // Common suffixes that add syllables
  if (w.endsWith("le") && w.length > 3 && !/[aeiouy]le$/.test(w)) {
    count += 1;
  }
  if (w.endsWith("tion") || w.endsWith("sion")) {
    // already counted — no adjustment needed
  }

  return Math.max(1, count);
}

// ─── Flesch Reading Ease ────────────────────────────────────────────────────

export interface ReadabilityResult {
  score: number; // 0-100 (higher = easier)
  totalSentences: number;
  totalWords: number;
  totalSyllables: number;
}

/**
 * Calculate Flesch Reading Ease score from raw text.
 * Formula: 206.835 − 1.015 × (words / sentences) − 84.6 × (syllables / words)
 */
export function fleschReadingEase(text: string): ReadabilityResult {
  const sentences = splitSentences(text);
  const words = extractWords(text);
  const totalSentences = Math.max(1, sentences.length);
  const totalWords = Math.max(1, words.length);
  const totalSyllables = words.reduce((sum, w) => sum + estimateSyllables(w), 0);

  const score =
    206.835 -
    1.015 * (totalWords / totalSentences) -
    84.6 * (totalSyllables / totalWords);

  return {
    score: Math.round(Math.min(100, Math.max(0, score)) * 10) / 10,
    totalSentences,
    totalWords,
    totalSyllables,
  };
}

// ─── Markdown heading extraction ────────────────────────────────────────────

export interface Heading {
  level: number; // 1-6
  text: string;
  lineIndex: number;
}

/** Extract markdown headings (ATX-style: `# heading`). */
export function extractHeadings(content: string): Heading[] {
  const lines = splitLines(content);
  const headings: Heading[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        lineIndex: i,
      });
    }
  }
  return headings;
}

/**
 * Check heading hierarchy for issues.
 * Returns descriptions of each problem found (e.g. "H3 appears before any H2").
 */
export function checkHeadingHierarchy(headings: Heading[]): string[] {
  const problems: string[] = [];
  if (headings.length === 0) return problems;

  // Track the deepest heading level seen so far at each step
  let prevLevel = 0;
  for (const h of headings) {
    // A jump of more than 1 level deeper is a hierarchy skip
    if (prevLevel > 0 && h.level > prevLevel + 1) {
      problems.push(
        `H${h.level} ("${h.text}") appears after H${prevLevel} — skips H${prevLevel + 1}`
      );
    }
    prevLevel = h.level;
  }

  // Multiple H1s
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count > 1) {
    problems.push(`Multiple H1 headings found (${h1Count}). Use a single H1.`);
  }

  return problems;
}

// ─── Keyword frequency ──────────────────────────────────────────────────────

export interface KeywordFrequency {
  word: string;
  count: number;
  density: number; // as percentage of total words
}

/**
 * Get the top N most frequent meaningful words (excluding stopwords).
 */
export function topKeywords(text: string, n: number = 10): KeywordFrequency[] {
  const words = extractWords(text).filter((w) => !STOPWORDS.has(w));
  const total = Math.max(1, words.length);
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, count]) => ({
      word,
      count,
      density: Math.round((count / total) * 1000) / 10, // one decimal %
    }));
}

// ─── Structural signal check ────────────────────────────────────────────────

const MIN_STRUCTURAL_WORDS = 150;

/**
 * Returns false if the content has no headings, no lists, and is under a
 * word threshold. Use to gate "insufficient structure" penalties — content
 * that is *both* short and unstructured should not silently score well.
 */
export function hasMinimumStructuralSignal(content: string): boolean {
  const headings = extractHeadings(content);
  if (headings.length > 0) return true;

  const lines = splitLines(content);
  const hasList = lines.some((l) => /^\s*([-*+]|\d+[.)]\s)/.test(l));
  if (hasList) return true;

  const words = countWords(content);
  if (words >= MIN_STRUCTURAL_WORDS) return true;

  return false;
}

// ─── Scoring helper ─────────────────────────────────────────────────────────

import type { AuditIssue } from "@/types/audit";

export type Severity = AuditIssue["severity"];

export const SEVERITY_DEDUCTION: Record<Severity, number> = {
  critical: 25,
  moderate: 12,
  minor: 5,
};

/** Compute a pillar score starting at 100 and deducting per issue. Floor at 0. */
export function computeScore(issues: AuditIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    score -= SEVERITY_DEDUCTION[issue.severity];
  }
  return Math.max(0, score);
}

/** Create an AuditIssue with a unique id. */
let issueCounter = 0;
export function createIssue(
  pillar: AuditIssue["pillar"],
  severity: Severity,
  title: string,
  description: string,
  suggestion: string
): AuditIssue {
  issueCounter += 1;
  return {
    id: `${pillar.toLowerCase()}-${issueCounter}`,
    pillar,
    severity,
    title,
    description,
    suggestion,
  };
}

/** Reset the issue counter (call at the start of each full audit run). */
export function resetIssueCounter(): void {
  issueCounter = 0;
}
