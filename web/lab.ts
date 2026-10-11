/**
 * The runner behind the page.
 *
 * The specification (`src/spec.ts`), the function (`src/intervals.ts`), the
 * examples (`src/examples.ts`) and the broken versions (`mutation/mutants.ts`)
 * are all shared with the test suite — nothing here redefines what correct
 * means.
 *
 * What *is* written by hand here is the generator and the shrinker. fast-check
 * does both automatically in `npm test`, and better; these exist so the page
 * can show the mechanism rather than describe it. A shrinker you can watch
 * count its steps teaches more than one that silently hands you the answer.
 */

import { mergeIntervals, type Endpoints, type Interval } from "../src/intervals.js";
import { examples, sameIntervals } from "../src/examples.js";
import type { Property } from "../src/spec.js";
import { mutants, reference, type Implementation } from "../mutation/mutants.js";

export const LO = 0;
export const HI = 20;

/** Every implementation the page can run, the working one first. */
export interface Choice {
  readonly id: string;
  readonly label: string;
  /** The single edit, as it would appear in a diff. */
  readonly edit: string;
  readonly fn: Implementation;
}

export const choices: readonly Choice[] = [
  { id: "correct", label: "Working version", edit: "—", fn: reference },
  ...mutants.map((m) => ({
    id: m.id,
    label: `${m.id} · ${m.label}`,
    edit: m.change,
    fn: m.fn,
  })),
];

/**
 * A seeded pseudo-random generator.
 *
 * The point of seeding: the same seed and the same case count reproduce a run
 * exactly, so a failure found once can be found again. Without it, a bug
 * report is a rumour.
 */
export function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One generated input: up to four blocks with integer endpoints, start ≤ end. */
export function generate(rnd: () => number): Interval[] {
  const n = Math.floor(rnd() * 5);
  const list: Interval[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor(rnd() * (HI - LO + 1)) + LO;
    const b = Math.floor(rnd() * (HI - LO + 1)) + LO;
    list.push(a <= b ? [a, b] : [b, a]);
  }
  return list;
}

export interface Failure {
  readonly input: readonly Interval[];
  readonly output: readonly Interval[];
  readonly why: string;
  /** Which generated case it was, so the run can be described exactly. */
  readonly index: number;
}

/** Generate until one input breaks the rule, or the budget runs out. */
export function firstFailure(
  fn: Implementation,
  property: Property,
  endpoints: Endpoints,
  seed: number,
  cases: number,
): Failure | null {
  const rnd = mulberry32(seed);
  for (let i = 0; i < cases; i++) {
    const input = generate(rnd);
    let output: Interval[] = [];
    let why: string | null;
    try {
      output = fn(copy(input));
      why = property.check(input, output, endpoints);
    } catch (err) {
      why = `threw: ${(err as Error).message}`;
    }
    if (why !== null) return { input, output, why, index: i };
  }
  return null;
}

/**
 * Shrinking, by repeated removal.
 *
 * A random failure arrives with junk attached — five blocks where two were
 * enough. Drop one block, re-check; if it still fails, keep the smaller input
 * and start over. What survives is the smallest input that still breaks the
 * rule, which is the one worth reading.
 */
export function shrink(
  fn: Implementation,
  property: Property,
  endpoints: Endpoints,
  input: readonly Interval[],
): { input: readonly Interval[]; steps: number } {
  let best = input;
  let steps = 0;
  let improved = true;

  while (improved && best.length > 0) {
    improved = false;
    for (let i = 0; i < best.length; i++) {
      const smaller = [...best.slice(0, i), ...best.slice(i + 1)];
      let why: string | null;
      try {
        why = property.check(smaller, fn(copy(smaller)), endpoints);
      } catch {
        why = "threw";
      }
      if (why !== null) {
        best = smaller;
        steps++;
        improved = true;
        break;
      }
    }
  }

  return { input: best, steps };
}

export interface ExampleRun {
  readonly name: string;
  readonly input: readonly Interval[];
  readonly expected: readonly Interval[];
  readonly actual: readonly Interval[] | null;
  readonly ok: boolean;
}

/** The example suite, against any implementation. */
export function runExamples(fn: Implementation): ExampleRun[] {
  return examples.map((e) => {
    try {
      const actual = fn(copy(e.input));
      return { ...e, actual, ok: sameIntervals(actual, e.expected) };
    } catch {
      return { ...e, actual: null, ok: false };
    }
  });
}

/** What the working version returns, for side-by-side comparison. */
export function correctAnswer(input: readonly Interval[]): Interval[] {
  return mergeIntervals(input);
}

export function fmt(list: readonly Interval[] | null): string {
  if (!list) return "(threw)";
  return list.length ? list.map(([a, b]) => `[${a},${b}]`).join(" ") : "(empty)";
}

function copy(list: readonly Interval[]): Interval[] {
  return list.map(([a, b]): Interval => [a, b]);
}
