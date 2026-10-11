/**
 * The function under test.
 *
 * It takes a list of time blocks and merges the ones that touch or overlap.
 * Input:  [[1, 3], [2, 6], [8, 10]]
 * Output: [[1, 6], [8, 10]]
 *
 * Deliberately small. The point of this repository is not the function —
 * it is everything built around it.
 */

/** A time block. `[start, end]`, with `start <= end`. */
export type Interval = readonly [number, number];

/**
 * Where an interval's endpoints belong.
 *
 * - "closed"    — `[a, b]`. The end moment belongs to the block.
 *                 So `[1, 3]` and `[3, 5]` share the moment 3 and must merge.
 * - "half-open" — `[a, b)`. The end moment does not belong to the block.
 *                 So `[1, 3)` and `[3, 5)` share nothing, but they are
 *                 adjacent: together they cover `[1, 5)` with no gap.
 *
 * This choice does not change `mergeIntervals` at all — in both readings the
 * two blocks above become one. What it changes is what counts as a violation,
 * so it belongs to the specification, not to the implementation.
 * See `spec.ts` and the README.
 */
export type Endpoints = "closed" | "half-open";

/**
 * Merge every pair of blocks that overlaps or touches.
 *
 * Result is sorted by start, and no two blocks in it touch or overlap.
 */
export function mergeIntervals(input: readonly Interval[]): Interval[] {
  // Copy before sorting: sorting in place would mutate the caller's array,
  // which is a side effect nobody asked for.
  const sorted = input.map((iv): [number, number] => [iv[0], iv[1]]);
  sorted.sort((a, b) => a[0] - b[0]);

  const out: [number, number][] = [];

  for (const [start, end] of sorted) {
    const last = out[out.length - 1];

    // `start <= last[1]` is the merge test. `<=` and not `<`, because two
    // blocks that merely touch still have to become one: with closed
    // endpoints they share a moment, and with half-open endpoints they
    // cover a continuous stretch. Either way, two blocks in the output
    // would be wrong.
    if (last !== undefined && start <= last[1]) {
      // `Math.max` and not plain assignment, because the incoming block can
      // end *before* the one already in `out` — [[1, 10], [2, 3]] — and then
      // overwriting would shrink the answer.
      last[1] = Math.max(last[1], end);
    } else {
      out.push([start, end]);
    }
  }

  return out;
}

/** Does `list` cover the moment `x`? Used by the coverage properties. */
export function coversPoint(
  list: readonly Interval[],
  x: number,
  endpoints: Endpoints,
): boolean {
  return list.some(([start, end]) =>
    endpoints === "closed" ? start <= x && x <= end : start <= x && x < end,
  );
}
