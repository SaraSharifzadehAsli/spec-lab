/**
 * Vitest config Stryker uses. `llm/stryker.ts` sets SUITE to the one test
 * file being scored, so each suite gets its own mutation score.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: [process.env.SUITE ?? "src/*.test.ts"],
  },
});
