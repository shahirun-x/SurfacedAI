import { runFullAudit } from "../src/lib/analysis";
import { generateMarkdownReport } from "../src/lib/utils/generateReport";

const markdownFail = `
# How to Bake a Cake

Baking a cake is a fun and easy process. Follow these steps to bake a delicious cake.

1. Gather your ingredients.
2. Mix the batter.
3. Bake in the oven.

## FAQ

### How long does it take to bake a cake?
It usually takes about 30 to 45 minutes depending on the recipe.

### What is the best temperature for baking?
Usually 350 degrees Fahrenheit.
`;

const reportFail = runFullAudit(markdownFail);
console.log(generateMarkdownReport(reportFail));
