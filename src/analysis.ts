/**
 * Running the specification against an implementation.
 *
 * This is the shared engine. `mutation/score.ts` prints its results in a
 * terminal and `web/` draws them in a browser, but both call into here, so
 * there is exactly one definition of what "this mutant was killed" means.
 * If the two had their own copies they would eventually disagree, and then
 * the report and the page would both be describing something that isn't the
 * suite anyone runs.
 */

import fc from "fast-check";
import { mergeIntervals, type Endpoints, type Interval } from "./intervals.js";
import { examples, sameIntervals } from "./examples.js";
import { properties, type Property } from "./spec.js";

/**
 * The rules that are on unless something says otherwise. P3 is left out: under
 * closed endpoints it is redundant with P1, so it only earns its place when
 * the convention changes. Pass `active` to run a different set.
 */
export const defaultSuite: readonly Property[] = properties.filter((p) => p.defaultOn);

export const SEED = 42;
export const RUNS = 2000;

/**
 * The generator: lists of up to 8 blocks with integer endpoints and
 * `start <= end`, so a zero-length block like [4, 4] is legal and will
 * be produced.
 */
export const intervalList: fc.Arbitrary<Interval[]> = fc.array(
  fc
    .tuple(fc.integer({ min: 0, max: 20 }), fc.integer({ min: 0, max: 20 }))
    .map(([a, b]): Interval => (a <= b ? [a, b] : [b, a])),
  { maxLength: 8 },
);

export type Implementation = (input: readonly Interval[]) => Interval[];

/** A property violated, together with the smallest input that violates it. */
export interface PropertyFailure {
  readonly propertyId: string;
  /** Shrunk: fast-check cut this down as far as it could while still failing. */
  readonly counterexample: readonly Interval[];
  readonly message: string;
}

/** Everything one implementation does against the whole suite. */
export interface Verdict {
  readonly failingExamples: readonly string[];
  readonly failingProperties: readonly PropertyFailure[];
  readonly killed: boolean;
}

/** Which named examples does this implementation get wrong? */
export function failingExamples(fn: Implementation): string[] {
  return examples
    .filter((ex) => !sameIntervals(fn(ex.input), ex.expected))
    .map((ex) => ex.name);
}

/**
 * Which properties does this implementation violate, and on what input?
 *
 * `numRuns` is how many inputs each property gets. `seed` fixes where the
 * generator starts, so a failure found today reproduces exactly tomorrow.
 */
export function failingProperties(
  fn: Implementation,
  endpoints: Endpoints,
  opts: { seed?: number; runs?: number; active?: readonly Property[] } = {},
): PropertyFailure[] {
  const found: PropertyFailure[] = [];

  for (const property of opts.active ?? defaultSuite) {
    let message = "";
    const run = fc.check(
      fc.property(intervalList, (input) => {
        const why = property.check(input, fn(input), endpoints);
        if (why !== null) {
          message = why;
          return false;
        }
        return true;
      }),
      { seed: opts.seed ?? SEED, numRuns: opts.runs ?? RUNS },
    );

    if (run.failed && run.counterexample) {
      found.push({
        propertyId: property.id,
        counterexample: run.counterexample[0] as readonly Interval[],
        message,
      });
    }
  }

  return found;
}

/** Judge one implementation against both halves of the suite. */
export function judge(
  fn: Implementation,
  endpoints: Endpoints,
  opts: { seed?: number; runs?: number; active?: readonly Property[] } = {},
): Verdict {
  const byExample = failingExamples(fn);
  const byProperty = failingProperties(fn, endpoints, opts);
  return {
    failingExamples: byExample,
    failingProperties: byProperty,
    killed: byExample.length > 0 || byProperty.length > 0,
  };
}

/** The working implementation must survive its own suite. Returns the problem, or null. */
export function selfCheck(endpoints: Endpoints): string | null {
  const wrong = failingExamples(mergeIntervals);
  if (wrong.length > 0) return `the implementation fails its own example: ${wrong[0]}`;
  const violated = failingProperties(mergeIntervals, endpoints);
  if (violated.length > 0) {
    const first = violated[0]!;
    return `the implementation violates its own ${first.propertyId}: ${first.message}`;
  }
  return null;
}
