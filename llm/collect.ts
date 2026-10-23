/**
 * Copies the agents' test files into this repository.
 *
 *   npm run llm:collect
 *
 * For every folder in ~/Downloads/agent-runs that has a
 * tests/unit/intervals.test.ts, copies it to llm/bugged/agent-<bug>-<n>.test.ts.
 * Also reports whether the agent changed src/intervals.ts, which the prompt
 * told it not to do.
 */

import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AGENT_RUNS, BUGS, RUNS_PER_BUG, source, type Bug } from "./bugged.js";

for (const bug of Object.keys(BUGS) as Bug[]) {
  for (let n = 1; n <= RUNS_PER_BUG; n++) {
    const dir = join(AGENT_RUNS, `${bug}-${n}`);
    const test = join(dir, "tests", "unit", "intervals.test.ts");
    const name = `${bug}-${n}`.padEnd(6);
    if (!existsSync(test)) {
      console.log(`${name} no test file yet`);
      continue;
    }
    copyFileSync(test, `llm/bugged/agent-${bug}-${n}.test.ts`);
    const changed = readFileSync(join(dir, "src", "intervals.ts"), "utf8") !== source(bug);
    console.log(`${name} copied${changed ? "   (the agent changed src/intervals.ts)" : ""}`);
  }
}
