/**
 * Prepares the buggy-code runs.
 *
 *   npm run llm:prepare
 *
 * Writes the two chat prompts to llm/bugged/ and creates one empty folder per
 * agent run in ~/Downloads/agent-runs (m1-1 to m4-5). Each folder holds only
 * the buggy src/intervals.ts, a package.json and an empty tests/unit/.
 * node_modules is linked from this repository so Vitest runs without an
 * install. Existing folders are left alone.
 */

import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { AGENT_RUNS, BUGS, RUNS_PER_BUG, source, type Bug } from "./bugged.js";

const bugs = Object.keys(BUGS) as Bug[];

mkdirSync("llm/bugged", { recursive: true });
for (const bug of bugs) {
  writeFileSync(
    `llm/bugged/prompt-chat-${bug}.md`,
    `# Chat prompt, ${BUGS[bug].mutant} version

\`npm run llm:run-bugged\` sends everything between the two lines to Claude with no tools at all,
five times, each in a new session, and saves the code block of each reply as
\`llm/bugged/chat-${bug}-<n>.test.ts\`. Settings are in \`llm/run-bugged.ts\`.

---

Write a Vitest test file for the TypeScript function below.

- Import it with: \`import { mergeIntervals } from "../../src/intervals";\`
- Use only Vitest (\`describe\`, \`it\`, \`expect\`). No other libraries.
- Reply with the test file only, in one code block.

\`\`\`ts
${source(bug)}\`\`\`

---
`,
  );
}

const packageJson = {
  name: "intervals",
  private: true,
  type: "module",
  scripts: { test: "vitest run" },
  devDependencies: { vitest: "^2.1.9" },
};

let created = 0;
for (const bug of bugs) {
  for (let n = 1; n <= RUNS_PER_BUG; n++) {
    const dir = join(AGENT_RUNS, `${bug}-${n}`);
    if (existsSync(dir)) continue;
    mkdirSync(join(dir, "src"), { recursive: true });
    mkdirSync(join(dir, "tests", "unit"), { recursive: true });
    writeFileSync(join(dir, "src", "intervals.ts"), source(bug));
    writeFileSync(join(dir, "package.json"), JSON.stringify(packageJson, null, 2) + "\n");
    symlinkSync(resolve("node_modules"), join(dir, "node_modules"), "dir");
    created++;
  }
}

console.log(`chat prompts: llm/bugged/prompt-chat-m1.md, llm/bugged/prompt-chat-m4.md`);
console.log(`agent folders: ${created} created in ${AGENT_RUNS}`);
