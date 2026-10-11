/**
 * Mutation scoring, in a terminal.
 *
 *   npm run mutate
 *
 * The judging lives in `src/analysis.ts`, shared with the browser page, so
 * both report on the same suite. This file is only the printing.
 *
 * The score is `killed / total` — not a measure of the function, but a measure
 * of the tests. A suite that is all green and kills nothing is telling you
 * only that it ran.
 *
 * Caveat worth knowing before quoting any score: a mutant can survive because
 * it is *equivalent* to the original — a change that alters the text but never
 * the behaviour. No amount of testing can kill those, and deciding in general
 * whether a given mutant is equivalent is undecidable. So 100% is not always
 * the target; the useful reading is which specific mutants survived and why.
 *
 * Stryker (stryker-mutator.io) is the production tool for this on real
 * codebases — it rewrites the actual source rather than keeping hand-written
 * variants. This script is deliberately short so the mechanism is readable.
 */

import { mergeIntervals, type Endpoints, type Interval } from "../src/intervals.js";
import { examples } from "../src/examples.js";
import { defaultSuite, judge, selfCheck } from "../src/analysis.js";
import { mutants } from "./mutants.js";
import { properties } from "../src/spec.js";

const CONVENTIONS: Endpoints[] = ["closed", "half-open"];

const fmt = (list: readonly Interval[]): string =>
  list.length === 0 ? "[]" : list.map(([a, b]) => `[${a}, ${b}]`).join(" ");

for (const endpoints of CONVENTIONS) {
  const problem = selfCheck(endpoints);
  if (problem) {
    console.error(`stopped: ${problem}`);
    process.exit(1);
  }
}

for (const endpoints of CONVENTIONS) {
  const gloss =
    endpoints === "closed"
      ? "[a, b] — the end moment belongs to the block"
      : "[a, b) — the end moment belongs to nobody";

  console.log(`\n${"=".repeat(78)}`);
  console.log(`  ${endpoints.toUpperCase()} endpoints   ${gloss}`);
  console.log("=".repeat(78));

  let killed = 0;

  for (const mutant of mutants) {
    const verdict = judge(mutant.fn, endpoints);
    if (verdict.killed) killed++;

    console.log(`\n${mutant.id}  ${verdict.killed ? "KILLED  " : "SURVIVED"}  ${mutant.label}`);
    console.log(`    change      ${mutant.change}`);

    if (verdict.failingExamples.length > 0) {
      console.log(`    examples    ${verdict.failingExamples.length} of ${examples.length} fail`);
      console.log(`                first: ${verdict.failingExamples[0]}`);
    } else {
      console.log(`    examples    none fail`);
    }

    if (verdict.failingProperties.length > 0) {
      for (const hit of verdict.failingProperties) {
        console.log(`    ${hit.propertyId}          ${fmt(hit.counterexample)}  ->  ${fmt(mutant.fn(hit.counterexample))}`);
        console.log(`                ${hit.message}`);
        console.log(`                working version gives ${fmt(mergeIntervals(hit.counterexample))}`);
      }
    } else {
      console.log(`    properties  none fail`);
    }
  }

  const pct = Math.round((killed / mutants.length) * 100);
  console.log(`\n  -- score: ${killed}/${mutants.length} mutants killed (${pct}%) --`);
  console.log(`     active rules: ${defaultSuite.map((p) => p.id).join(", ")}`);

  // P3 is off by default. Under [a, b] switching it on changes nothing,
  // because P1 already forbids the same arrangement; under [a, b) it is the
  // only rule that can catch M1. Printing both is the clearest way to show it.
  const withP3 = mutants.filter(
    (m) => judge(m.fn, endpoints, { active: properties }).killed,
  ).length;
  if (withP3 !== killed) {
    console.log(`     with P3 switched on: ${withP3}/${mutants.length} killed`);
  } else {
    console.log(`     with P3 switched on: unchanged — P3 adds nothing here`);
  }
}

console.log("");
