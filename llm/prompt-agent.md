# Agent prompt

For the buggy-code runs. `npm run llm:run-bugged` sends everything between the two lines to
Claude Code in headless mode, once per folder in `~/Downloads/agent-runs` (m1-1 to m4-5), each
in a new session. See `llm/run-bugged.ts` for the exact settings.

Each folder holds only the buggy `src/intervals.ts`, a `package.json` and an empty
`tests/unit/`, so the agent cannot read this repository, the mutants or the README. The agent
may read and write files in its folder and run `npx vitest`; nothing else.

---

Write a Vitest test file for the function `mergeIntervals` in `src/intervals.ts`.

- Save it as `tests/unit/intervals.test.ts`.
- Use only Vitest (`describe`, `it`, `expect`). No other libraries.
- Run it with `npx vitest run` before you finish.
- Write tests only. Do not change `src/intervals.ts`.

---
