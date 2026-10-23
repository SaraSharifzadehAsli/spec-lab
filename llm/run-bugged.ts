/**
 * Runs the twenty buggy-code generations with Claude Code in headless mode.
 *
 *   npm run llm:run-bugged
 *
 * Both groups use the same program, model and effort. The only difference is
 * whether the model can run its tests:
 *
 *   chat   no tools at all. It reads the prompt (with the buggy code in it)
 *          and replies; the code block of the reply is saved as the test file.
 *   agent  works in its own folder from `npm run llm:prepare`. It may read and
 *          write files there and run `npx vitest`, nothing else.
 *
 * Every run is a new session: no MCP servers, no saved session, a working
 * directory that holds nothing from this repository. The JSON result of each
 * run, including the model's last message, is kept in llm/bugged/logs/. Runs
 * whose log already exists are skipped, so the script can be started again.
 *
 * The claude program is taken from CLAUDE_BIN, or else from the VS Code
 * extension.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENT_RUNS, BUGS, RUNS_PER_BUG, type Bug } from "./bugged.js";

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), ".."));

function findClaude(): string | undefined {
  if (process.env.CLAUDE_BIN && existsSync(process.env.CLAUDE_BIN)) return process.env.CLAUDE_BIN;
  const ext = join(homedir(), ".vscode", "extensions");
  if (!existsSync(ext)) return undefined;
  for (const d of readdirSync(ext).filter((d) => d.startsWith("anthropic.claude-code-")).sort().reverse()) {
    const bin = join(ext, d, "resources", "native-binary", "claude");
    if (existsSync(bin)) return bin;
  }
  return undefined;
}

const BIN = findClaude();
if (!BIN) {
  console.error("claude program not found. Set CLAUDE_BIN to its path.");
  process.exit(1);
}

const MODEL = "claude-opus-5-5";
const EFFORT = "medium";
const PARALLEL = 4;
const LOGS = "llm/bugged/logs";
mkdirSync(LOGS, { recursive: true });

/** The text between the two `---` lines of a prompt file. */
function promptFrom(file: string): string {
  const parts = readFileSync(file, "utf8").split(/^---$/m);
  if (parts.length < 3) throw new Error(`no prompt between --- lines in ${file}`);
  return parts[1]!.trim();
}

const common = [
  "--model", MODEL,
  "--effort", EFFORT,
  "--strict-mcp-config",
  "--no-session-persistence",
  "--output-format", "json",
];

interface Job {
  name: string;
  cwd: string;
  args: string[];
  after?: (result: string) => void;
}

const jobs: Job[] = [];
for (const bug of Object.keys(BUGS) as Bug[]) {
  for (let n = 1; n <= RUNS_PER_BUG; n++) {
    const chat = `chat-${bug}-${n}`;
    const chatDir = join(tmpdir(), `llm-${chat}`);
    mkdirSync(chatDir, { recursive: true });
    jobs.push({
      name: chat,
      cwd: chatDir,
      args: ["-p", promptFrom(`llm/bugged/prompt-chat-${bug}.md`), "--tools", "", ...common],
      after: (result) => {
        const code = result.match(/```(?:ts|typescript)?\n([\s\S]*?)```/);
        if (!code) throw new Error("no code block in the reply");
        writeFileSync(`llm/bugged/${chat}.test.ts`, code[1]!);
      },
    });

    jobs.push({
      name: `agent-${bug}-${n}`,
      cwd: join(AGENT_RUNS, `${bug}-${n}`),
      args: [
        "-p", promptFrom("llm/prompt-agent.md"),
        "--tools", "Read,Write,Edit,Glob,Grep,Bash",
        "--allowedTools", "Bash(npx vitest:*)",
        "--permission-mode", "acceptEdits",
        ...common,
      ],
    });
  }
}

function run(job: Job): Promise<void> {
  const log = `${LOGS}/${job.name}.json`;
  if (existsSync(log)) {
    console.log(`${job.name.padEnd(14)} already done`);
    return Promise.resolve();
  }
  return new Promise((done) => {
    const started = new Date().toISOString();
    const child = spawn(BIN!, job.args, { cwd: job.cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", () => {
      try {
        const json = JSON.parse(out);
        job.after?.(String(json.result ?? ""));
        writeFileSync(log, JSON.stringify({ started, cwd: job.cwd, ...json }, null, 2));
        console.log(`${job.name.padEnd(14)} done (${json.num_turns ?? "?"} turns)`);
      } catch (e) {
        console.log(`${job.name.padEnd(14)} FAILED: ${(e as Error).message.slice(0, 200)}`);
      }
      done();
    });
  });
}

const queue = [...jobs];
await Promise.all(
  Array.from({ length: PARALLEL }, async () => {
    while (queue.length) await run(queue.shift()!);
  }),
);
console.log("\nnext: npm run llm:collect && npm run llm:bugged");
