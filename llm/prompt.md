# The prompt

Every generated test file comes from this exact prompt. Paste everything between the two
horizontal lines into a new chat, unchanged, once per run. Save the code from the reply as
`llm/generated/<model>-<n>.test.ts` (for example `chatgpt-1.test.ts`, `claude-3.test.ts`) and
note the run in `runs.md`.

If the reply imports the function from a different path, change only that import line to the
one in the prompt. Change nothing else, even if a test looks wrong: a wrong test is a result.

Settings, the same for every run:

- Use the chat apps (chatgpt.com, claude.ai), not a coding agent. An agent can read this
  repository, including `mutation/mutants.ts` and this README, and can run and fix its own tests.
- One model per app, the app's default, fixed for all five runs. Pick it by name if the app
  offers an automatic model choice. Leave thinking or effort at the app's default.
- Memory and custom instructions off. A new chat for every run, no project, no attachments.

The function is shown without the comments in `src/intervals.ts`, because two of those comments
explain exactly the mistakes that mutants M1 and M2 make.

---

Write a Vitest test file for the TypeScript function below.

- Import it with: `import { mergeIntervals } from "../../src/intervals";`
- Use only Vitest (`describe`, `it`, `expect`). No other libraries.
- Reply with the test file only, in one code block.

```ts
/** A time block. `[start, end]`, with `start <= end`. */
export type Interval = readonly [number, number];

/**
 * Merge every pair of blocks that overlaps or touches.
 *
 * Result is sorted by start, and no two blocks in it touch or overlap.
 */
export function mergeIntervals(input: readonly Interval[]): Interval[] {
  const sorted = input.map((iv): [number, number] => [iv[0], iv[1]]);
  sorted.sort((a, b) => a[0] - b[0]);

  const out: [number, number][] = [];

  for (const [start, end] of sorted) {
    const last = out[out.length - 1];
    if (last !== undefined && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      out.push([start, end]);
    }
  }

  return out;
}
```

---
