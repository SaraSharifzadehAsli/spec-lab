// Stryker generates its own mutants of mergeIntervals (lines 36-63 of
// src/intervals.ts only, so `coversPoint`, which the properties rely on,
// stays intact). Run it per suite with `npm run llm:stryker`.

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  vitest: { configFile: "llm/vitest.stryker.config.ts" },
  mutate: ["src/intervals.ts:36-63"],
  reporters: ["json"],
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  coverageAnalysis: "perTest",
  cleanTempDir: "always",
};
