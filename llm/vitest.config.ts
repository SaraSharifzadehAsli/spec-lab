/**
 * Vitest config for `npm run llm:score`.
 *
 * Same tests as usual, plus the generated ones, but every test file's import
 * of `src/intervals` resolves to `llm/swap.ts`, so MUTANT can swap the
 * function underneath the tests without touching them.
 */

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const swap = fileURLToPath(new URL("./swap.ts", import.meta.url));
const intervalsImport = /(^|\/)src\/intervals(\.js|\.ts)?$|^\.\/intervals(\.js|\.ts)?$/;

export default defineConfig({
  plugins: [
    {
      name: "swap-merge-intervals",
      enforce: "pre",
      resolveId(source, importer) {
        if (!importer?.endsWith(".test.ts")) return null;
        return intervalsImport.test(source) ? swap : null;
      },
    },
  ],
  test: {
    globals: true,
    include: ["src/*.test.ts", "llm/generated/*.test.ts"],
  },
});
