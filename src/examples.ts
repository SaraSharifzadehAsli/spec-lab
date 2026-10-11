/**
 * The example suite.
 *
 * Three inputs, picked the way anyone picks them: an obvious overlap, an
 * out-of-order pair, and the empty list. All three pass against the working
 * function.
 *
 * They are deliberately *not* chosen to catch the five broken versions in
 * `mutation/`. An earlier draft of this file had seven examples, one aimed at
 * each mistake — written after the mistakes were known, which is backwards.
 * A suite built to score well against the mutants you already have measures
 * nothing: real examples are written before anyone knows what will break, and
 * the whole point of the exercise is to find out what such a suite misses.
 *
 * Kept as data rather than inside `expect()` calls so the test runner, the
 * mutation scorer and the page all judge against the identical list.
 */

import type { Interval } from "./intervals.js";

export interface Example {
  readonly name: string;
  readonly input: readonly Interval[];
  readonly expected: readonly Interval[];
}

export const examples: readonly Example[] = [
  {
    name: "merges two overlapping blocks, leaves a separate one alone",
    input: [[1, 3], [2, 6], [8, 10]],
    expected: [[1, 6], [8, 10]],
  },
  {
    name: "sorts before merging, so input order does not matter",
    input: [[1, 4], [0, 2]],
    expected: [[0, 4]],
  },
  {
    name: "returns an empty list for an empty list",
    input: [],
    expected: [],
  },
];

/** Structural equality for two lists of blocks. */
export function sameIntervals(
  a: readonly Interval[],
  b: readonly Interval[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((iv, i) => iv[0] === b[i]![0] && iv[1] === b[i]![1]);
}
