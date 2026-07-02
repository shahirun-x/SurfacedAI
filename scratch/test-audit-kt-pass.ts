import { runFullAudit } from "../src/lib/analysis";
import { generateMarkdownReport } from "../src/lib/utils/generateReport";

const markdownKT = `
# How to Make Coffee

Making coffee is a daily ritual for many. This guide will show you how to brew the perfect cup at home using simple techniques.

## Key Takeaways
- Use freshly ground beans for the best flavor
- Water temperature should be around 200°F
- A burr grinder provides consistent grounds
- Brew time varies by method

## The Best Beans

![image](https://example.com/isolated-coffee-pic.jpg)

## The Right Equipment

You need a good grinder and a scale.
`;

const reportKT = runFullAudit(markdownKT);
console.log(generateMarkdownReport(reportKT));
