/**
 * Test with weak/thin content to validate penalty scoring.
 */
import { runFullAudit } from "../src/lib/analysis/index";

const WEAK_CONTENT = `There are many things you can do to improve your website.
Some people think SEO is hard but it is actually pretty easy.
It is important to do various things. They should probably look at
some stuff. Many businesses struggle with this. It is quite challenging.
Things are always changing in the world of marketing.
Various experts say different things about this topic.`;

const report = runFullAudit(WEAK_CONTENT);

console.log("═══════════════════════════════════════════════════════════════");
console.log("  SURFACED.AI — WEAK CONTENT TEST");
console.log("═══════════════════════════════════════════════════════════════");
console.log();
console.log(`  Overall Score: ${report.overallScore}/100`);
console.log();

for (const pillar of report.pillars) {
  console.log(`─── ${pillar.pillar} ─── Score: ${pillar.score}/100 (${pillar.issues.length} issues) ───`);
  for (const issue of pillar.issues) {
    console.log(`  [${issue.severity.toUpperCase()}] ${issue.title}`);
  }
  console.log();
}
