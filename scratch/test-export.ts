/**
 * Generates and prints the markdown export for the weak content test case.
 */
import { runFullAudit } from "../src/lib/analysis/index";
import { generateMarkdownReport } from "../src/lib/utils/generateReport";

const WEAK_CONTENT = `There are many things you can do to improve your website.
Some people think SEO is hard but it is actually pretty easy.
It is important to do various things. They should probably look at
some stuff. Many businesses struggle with this. It is quite challenging.
Things are always changing in the world of marketing.
Various experts say different things about this topic.`;

const report = runFullAudit(WEAK_CONTENT);
const markdown = generateMarkdownReport(report);

console.log(markdown);
