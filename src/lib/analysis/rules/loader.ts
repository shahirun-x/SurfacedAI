import rulesData from "./content-rules-dataset.json";
import { AuditIssue } from "@/types/audit";

export interface RuleDefinition {
  id: string;
  pillar: "SEO" | "AEO" | "GEO" | "AIO" | "Editorial" | "Technical";
  rule_name: string;
  description: string;
  check_type: "automatable" | "judgment_required";
  check_logic: string;
  severity: "critical" | "moderate" | "minor";
  scope: "universal" | "brand_specific";
  brand_variables: string | null;
  applies_to: string;
  suggestion: string;
}

const typedRulesData = rulesData as RuleDefinition[];

export function getRule(id: string): RuleDefinition {
  const rule = typedRulesData.find((r) => r.id === id);
  if (!rule) {
    throw new Error(`Rule with id '${id}' not found in dataset.`);
  }
  return rule;
}

export function buildIssueFromRule(
  id: string,
  extraContext?: string,
  replacements?: Record<string, string>
): AuditIssue {
  const rule = getRule(id);
  
  let desc = rule.description;
  let sugg = rule.suggestion;

  if (replacements) {
    for (const [key, value] of Object.entries(replacements)) {
      desc = desc.replace(new RegExp(key, "g"), value);
      sugg = sugg.replace(new RegExp(key, "g"), value);
    }
  }

  return {
    id: rule.id,
    pillar: rule.pillar as AuditIssue["pillar"],
    severity: rule.severity,
    title: rule.rule_name,
    description: extraContext ? `${desc} ${extraContext}`.trim() : desc,
    suggestion: sugg,
  };
}
