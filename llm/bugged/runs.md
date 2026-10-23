# Runs on buggy code

All twenty runs were made by `npm run llm:run-bugged` (Claude Code in headless mode, a new
session each time; see `llm/run-bugged.ts`). The last message of every run is in
`llm/bugged/logs/<file>.json` under `result`. "Says there may be a bug" is read from that message;
the chat runs replied with code only.

| file | model | effort | date | verdict | says there may be a bug? |
| ---- | ----- | ------ | ---- | ------- | ------------------------ |
| chat-m1-1.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | no (code only) |
| chat-m1-2.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | no (code only) |
| chat-m1-3.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | no (code only) |
| chat-m1-4.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | no (code only) |
| chat-m1-5.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | no (code only) |
| chat-m4-1.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:17 UTC | locked it in | no (code only) |
| chat-m4-2.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:17 UTC | locked it in | no (code only) |
| chat-m4-3.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:17 UTC | locked it in | no (code only) |
| chat-m4-4.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:17 UTC | locked it in | no (code only) |
| chat-m4-5.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:17 UTC | fails on both | no (code only) |
| agent-m1-1.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | yes |
| agent-m1-2.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | yes |
| agent-m1-3.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | yes |
| agent-m1-4.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | yes |
| agent-m1-5.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:16 UTC | caught the bug | yes |
| agent-m4-1.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:17 UTC | caught the bug | yes |
| agent-m4-2.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:17 UTC | missed it | yes |
| agent-m4-3.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:17 UTC | missed it | yes |
| agent-m4-4.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:17 UTC | missed it | yes |
| agent-m4-5.test.ts | claude-opus-5-5 | medium | 2026-10-23 18:18 UTC | missed it | yes |
