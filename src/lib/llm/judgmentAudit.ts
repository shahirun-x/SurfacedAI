import { buildIssueFromRule } from "../analysis/rules/loader";
import rulesData from "../analysis/rules/content-rules-dataset.json";
import { runWithFallback } from "./index";
import type { AuditIssue } from "@/types/audit";
import type { BrandConfig } from "../analysis/config";
import type { RuleDefinition } from "../analysis/rules/loader";

const typedRulesData = rulesData as RuleDefinition[];

export async function runJudgmentChecks(content: string, brandConfig: BrandConfig): Promise<AuditIssue[]> {
  const rules = typedRulesData.filter(r => {
    if (r.check_type !== "judgment_required") return false;
    if (r.id.startsWith("checklist-crossref-")) return false;
    if (r.applies_to === "competitor_review_articles") return false;
    if (r.scope === "brand_specific" && (!brandConfig.brandName || brandConfig.brandName.trim() === "")) return false;
    return true;
  });
  
  console.log(`[LLM] Evaluated ${rules.length} rules dynamically. Rules: ${rules.map(r => r.id).join(", ")}`);

  const rulesPrompt = rules.map(r => `
Rule ID: ${r.id}
Description: ${r.description}
Evaluation Logic: ${r.check_logic}
`).join("\n---\n");

  const prompt = `
You are an expert content auditor analyzing a markdown article based on a specific set of rules.

Here is the article content:
==========
${content}
==========

Here are the rules to evaluate:
${rulesPrompt}

For each rule, determine if the article violates it based strictly on the Evaluation Logic provided.
You must respond with ONLY a JSON array, with no markdown formatting, no code blocks, and no extra commentary.
The JSON array should contain one object per rule evaluated, with this exact shape:
[
  {
    "rule_id": "the-rule-id",
    "triggered": true, // true if the content VIOLATES the rule and an issue should be raised, false if it complies
    "confidence": "high", // "high" or "borderline". Use "borderline" when the content could reasonably be judged either way, and "high" when the violation or pass is clear-cut.
    "finding": "1-2 sentence specific explanation of what was found, referencing actual content from the article."
  }
]
`;

  const result = await runWithFallback(prompt);
  
  if (!result.success) {
    console.error("LLM failed to evaluate judgment rules:", result.error);
    return [];
  }

  let rawJson = result.text.trim();
  // Strip markdown code fences if present
  if (rawJson.startsWith("```json")) {
    rawJson = rawJson.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (rawJson.startsWith("```")) {
    rawJson = rawJson.replace(/^```/, "").replace(/```$/, "").trim();
  }

  let parsed: any[] = [];
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    console.error("Failed to parse LLM JSON response:", err);
    console.log("Raw Response was:", result.text);
    return [];
  }

  const issues: AuditIssue[] = [];
  for (const item of parsed) {
    if (item.triggered) {
      const isBorderline = item.confidence === "borderline";
      issues.push(buildIssueFromRule(item.rule_id, `(${item.finding})`, undefined, isBorderline));
    }
  }

  return issues;
}
