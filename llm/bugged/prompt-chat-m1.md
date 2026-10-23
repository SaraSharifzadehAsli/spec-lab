# Chat prompt, M1 version

`npm run llm:run-bugged` sends everything between the two lines to Claude with no tools at all,
five times, each in a new session, and saves the code block of each reply as
`llm/bugged/chat-m1-<n>.test.ts`. Settings are in `llm/run-bugged.ts`.

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
    if (last !== undefined && start < last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      out.push([start, end]);
    }
  }

  return out;
}
```

---
