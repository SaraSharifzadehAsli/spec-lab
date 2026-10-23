/**
 * Lets one test file run against the working function or a broken one.
 *
 * Test files import `mergeIntervals` from `src/intervals`. Under
 * `llm/vitest.config.ts` those imports are sent here instead, and the
 * environment variable MUTANT picks the version: unset means the real
 * function, M1 to M5 mean the hand-written mutants in `mutation/mutants.ts`.
 *
 * Only test files are redirected. The specification and the analysis code
 * keep importing the real module, so the rules are never judged by a broken
 * function.
 */

import * as real from "../src/intervals.js";
import { mutants } from "../mutation/mutants.js";

export * from "../src/intervals.js";

const id = process.env.MUTANT;
const mutant = id ? mutants.find((m) => m.id === id) : undefined;
if (id && !mutant) throw new Error(`unknown mutant: ${id}`);

export const mergeIntervals = mutant ? mutant.fn : real.mergeIntervals;
