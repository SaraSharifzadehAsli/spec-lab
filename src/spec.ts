/**
 * The specification.
 *
 * Five rules a correct answer must obey. Each one is a function of the input,
 * the output and the endpoint convention; it returns `null` when the rule held
 * and a sentence saying what went wrong when it did not.
 *
 * No random generation happens here — this file only says what "correct"
 * means. `web/lab.ts` and the property tests do the generating.
 */

import { coversPoint, type Endpoints, type Interval } from "./intervals.js";

export interface Property {
  readonly id: string;
  readonly name: string;
  /**
   * Whether the rule is part of the suite by default. P3 is the exception:
   * under closed endpoints it says nothing P1 does not already say, so it
   * starts switched off and earns its place only under [a, b).
   */
  readonly defaultOn: boolean;
  /** What the rule means — which depends on the convention for P1 and P3. */
  readonly describe: (endpoints: Endpoints) => string;
  /** `null` if the rule held, otherwise why it did not. */
  readonly check: (
    input: readonly Interval[],
    output: readonly Interval[],
    endpoints: Endpoints,
  ) => string | null;
}

/** Moments to sample for the coverage rules. Half-steps: see `inventsNoTime`. */
const STEP = 0.5;
const LO = 0;
const HI = 20;
const SAMPLE: number[] = [];
for (let x = LO; x <= HI; x += STEP) SAMPLE.push(x);

/**
 * P1 — no moment belongs to two blocks.
 *
 * The rule whose statement depends on the convention, and the reason
 * `Endpoints` exists at all. Writing this one for [a, b) while the coverage
 * rules below assume [a, b] is the contradiction the README describes.
 */
export const noSharedMoments: Property = {
  id: "P1",
  name: "P1 · no shared moments",
  defaultOn: true,
  describe: (endpoints) =>
    endpoints === "closed"
      ? "No moment belongs to two blocks. With [a,b] the end is part of the block, so blocks that meet at a point do share that moment: the test is next.start > last.end."
      : "No moment belongs to two blocks. With [a,b) the end is outside the block, so blocks that meet at a point share nothing: the test is next.start >= last.end.",
  check: (_input, out, endpoints) => {
    for (let i = 0; i + 1 < out.length; i++) {
      const prev = out[i]!;
      const next = out[i + 1]!;
      const shared = endpoints === "closed" ? next[0] <= prev[1] : next[0] < prev[1];
      if (shared) {
        return endpoints === "closed"
          ? `out[${i}] ends at ${prev[1]} and out[${i + 1}] starts at ${next[0]} — the moment ${next[0]} belongs to both blocks`
          : `out[${i + 1}] starts at ${next[0]}, inside out[${i}] which ends at ${prev[1]}`;
      }
    }
    return null;
  },
};

/**
 * P2 — the output is sorted by start.
 *
 * Kept deliberately, and labelled, because it can never fail: a block is only
 * pushed when `start > last.end >= last.start`, so every new start is strictly
 * greater than the one before. A test that cannot fail still costs a line in
 * every report and buys nothing; it stays as the worked example of that.
 */
export const sorted: Property = {
  id: "P2",
  name: "P2 · sorted",
  defaultOn: true,
  describe: () =>
    "Blocks come out in order of start time. This one can never fail — the push condition already guarantees it — and it is kept as an example of a test that passes for free.",
  check: (_input, out) => {
    for (let i = 0; i + 1 < out.length; i++) {
      if (out[i + 1]![0] < out[i]![0]) return `out[${i + 1}] starts before out[${i}]`;
    }
    return null;
  },
};

/**
 * P3 — blocks that meet at a point must be one block.
 *
 * Off by default. Under [a, b] it is redundant: P1 already forbids the same
 * arrangement, so switching it on changes no score. Under [a, b) it is a
 * genuinely separate requirement, because two blocks that merely meet share no
 * moment and P1 permits them.
 */
export const adjacentMerged: Property = {
  id: "P3",
  name: "P3 · adjacent blocks merged",
  defaultOn: false,
  describe: (endpoints) =>
    endpoints === "closed"
      ? "Blocks that meet at a point must be one block. Under [a,b] this says nothing new — P1 already forbids it, so switching P3 on changes no score."
      : "Blocks that meet at a point must be one block. Under [a,b) this is a separate requirement: they share no moment, so P1 permits them.",
  check: (_input, out) => {
    for (let i = 0; i + 1 < out.length; i++) {
      if (out[i + 1]![0] <= out[i]![1]) {
        return `out[${i}] ends at ${out[i]![1]} and out[${i + 1}] starts at ${out[i + 1]![0]} — these should be one block`;
      }
    }
    return null;
  },
};

/** P4 — every moment the input covered, the output still covers. */
export const losesNoTime: Property = {
  id: "P4",
  name: "P4 · loses no time",
  defaultOn: true,
  describe: () =>
    "Every moment the input covered, the output still covers. This is the rule that catches a merge which drops a block or shortens one.",
  check: (input, out, endpoints) => {
    for (const x of SAMPLE) {
      if (coversPoint(input, x, endpoints) && !coversPoint(out, x, endpoints)) {
        return `moment ${x} was covered by the input and is missing from the output`;
      }
    }
    return null;
  },
};

/**
 * P5 — the output covers no moment the input left free.
 *
 * Sampled at half-steps, and that is not arbitrary: the generator produces
 * integer endpoints, so a gap the output wrongly swallows is at least 1 wide
 * and a 0.5 grid cannot step over it. The half-step is precisely where
 * over-merging hides.
 */
export const inventsNoTime: Property = {
  id: "P5",
  name: "P5 · invents no time",
  defaultOn: true,
  describe: () =>
    "The output covers no moment the input left free. This is the rule that catches an off-by-one which bridges a real gap.",
  check: (input, out, endpoints) => {
    for (const x of SAMPLE) {
      if (coversPoint(out, x, endpoints) && !coversPoint(input, x, endpoints)) {
        return `moment ${x} appears in the output but was free in the input`;
      }
    }
    return null;
  },
};

/** The whole specification, in report order. */
export const properties: readonly Property[] = [
  noSharedMoments,
  sorted,
  adjacentMerged,
  losesNoTime,
  inventsNoTime,
];
