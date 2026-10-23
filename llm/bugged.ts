/**
 * Shared setup for the buggy-code runs: tests written for a version of
 * `mergeIntervals` that already contains mutant M1 or M4.
 *
 * The question: given broken code, does a model write tests that catch the
 * bug, or tests that expect the broken behaviour? A chat model can only read
 * the code; an agent can also run its tests and change them until they pass.
 */

import { homedir } from "node:os";
import { join } from "node:path";

export const BUGS = {
  m1: { mutant: "M1", condition: "start < last[1]" },
  m4: { mutant: "M4", condition: "start <= last[1] + 1" },
} as const;

export type Bug = keyof typeof BUGS;

export const RUNS_PER_BUG = 5;

/** Agent folders live outside this repository, so the agent cannot read it. */
export const AGENT_RUNS = join(homedir(), "Downloads", "agent-runs");

/** The function as the models see it: the prompt's version, with one changed condition. */
export function source(bug: Bug): string {
  return `/** A time block. \`[start, end]\`, with \`start <= end\`. */
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
    if (last !== undefined && ${BUGS[bug].condition}) {
      last[1] = Math.max(last[1], end);
    } else {
      out.push([start, end]);
    }
  }

  return out;
}
`;
}
