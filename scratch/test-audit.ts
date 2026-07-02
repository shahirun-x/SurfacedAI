/**
 * Scratch script — runs the analysis engine against a realistic sample
 * and prints the full AuditReport for review.
 *
 * Run with: npx tsx scratch/test-audit.ts
 */

// We need to resolve the @/ alias for tsx.
// Use relative paths instead.
import { runFullAudit } from "../src/lib/analysis/index";

const SAMPLE_CONTENT = `# How to Improve Your Website's Search Rankings in 2024

Search engine optimization remains one of the most important digital marketing strategies.
Many businesses struggle to get their content noticed online. There are various things
you can do to improve your rankings and drive more traffic.

## Understanding SEO Basics

SEO involves optimizing your website so search engines can better understand and rank your content.
It encompasses technical elements, content quality, and backlink strategies. According to a
2023 study by Ahrefs, 96.55% of all pages get zero traffic from Google.

This is important. It means most content never reaches its audience. They need to understand
what search engines want. It requires careful planning.

## On-Page Optimization

Some key on-page factors include:

- Title tags and meta descriptions
- Header hierarchy (H1, H2, H3)
- Internal linking structure
- Image optimization with alt text
- URL structure

![](/images/seo-diagram.png)

You should probably focus on creating high-quality content that answers user questions directly.
Various experts recommend targeting long-tail keywords for better conversion rates.

## Content Quality Matters

Search engines are getting better at understanding content quality.
They use various signals to determine whether content provides genuine value.
Some of these signals include time on page, bounce rate, and user engagement metrics.

Google's helpful content update in 2023 specifically targeted low-quality, mass-produced content.
Sites that saw traffic drops of 30-60% were often those relying on thin, keyword-stuffed articles.

![hero image](https://example.com/hero.jpg)

## Technical SEO Checklist

Ensure your site has proper technical foundations. This includes fast loading times,
mobile responsiveness, and clean code structure. It affects how search engines crawl
and index your pages.

Core Web Vitals became a ranking factor in 2021, measuring:
1. Largest Contentful Paint (LCP) — under 2.5 seconds
2. First Input Delay (FID) — under 100 milliseconds
3. Cumulative Layout Shift (CLS) — under 0.1

## Conclusion

SEO is a long-term strategy that requires patience and consistent effort.
By focusing on the fundamentals outlined above, you can significantly improve
your website's visibility in search results.
`;

const report = runFullAudit(SAMPLE_CONTENT);

console.log("═══════════════════════════════════════════════════════════════");
console.log("  SURFACED.AI — AUDIT REPORT (Sample Content Test)");
console.log("═══════════════════════════════════════════════════════════════");
console.log();
console.log(`  Overall Score: ${report.overallScore}/100`);
console.log(`  Content Length: ${report.contentLength.toLocaleString()} characters`);
console.log(`  Timestamp: ${report.timestamp}`);
console.log();

for (const pillar of report.pillars) {
  console.log(`─── ${pillar.pillar} ─── Score: ${pillar.score}/100 ───`);
  if (pillar.issues.length === 0) {
    console.log("  ✅ No issues found.");
  } else {
    for (const issue of pillar.issues) {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.title}`);
      console.log(`    ${issue.description}`);
      console.log(`    💡 ${issue.suggestion}`);
      console.log();
    }
  }
  console.log();
}

console.log("═══════════════════════════════════════════════════════════════");
