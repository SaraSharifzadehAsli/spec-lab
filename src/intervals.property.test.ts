/**
 * Property tests.
 *
 * Instead of naming inputs, these state the rules from `spec.ts` and let
 * fast-check search for an input that breaks one. When it finds one it shrinks
 * it: it keeps cutting the failing input down while it still fails, so the
 * report is the smallest counterexample rather than the first one found.
 *
 * The generator and the seed live in `analysis.ts`, shared with the mutation
 * scorer and the browser page.
 */

import fc from "fast-check";
import { describe, it } from "vitest";
import { mergeIntervals, type Endpoints } from "./intervals.js";
import { properties } from "./spec.js";
import { intervalList, RUNS, SEED } from "./analysis.js";

const conventions: Endpoints[] = ["closed", "half-open"];

for (const endpoints of conventions) {
  describe(`mergeIntervals — properties under ${endpoints} endpoints`, () => {
    for (const property of properties) {
      it(property.name, () => {
        fc.assert(
          fc.property(intervalList, (input) => {
            const why = property.check(input, mergeIntervals(input), endpoints);
            if (why !== null) throw new Error(why);
            return true;
          }),
          { seed: SEED, numRuns: RUNS },
        );
      });
    }
  });
}
