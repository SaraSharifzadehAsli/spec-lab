/**
 * Spec Lab — the page.
 *
 * Six steps, in the order the idea was worked out: the function, the examples
 * anyone would write, properties instead of examples, scoring both suites
 * against five broken versions, the convention question that turned out to sit
 * underneath all of it, and shrinking.
 *
 * Everything on the page is a live run of the repository's own modules. The
 * specification is `src/spec.ts`, the broken versions are `mutation/mutants.ts`
 * and the examples are `src/examples.ts` — the same ones `npm test` and
 * `npm run mutate` use. Change a rule and this page changes with it.
 */

import { useMemo, useState } from "react";
import type { Endpoints, Interval } from "../src/intervals.js";
import { examples } from "../src/examples.js";
import { properties } from "../src/spec.js";
import {
  choices,
  correctAnswer,
  firstFailure,
  fmt,
  runExamples,
  shrink,
  type Failure,
} from "./lab.js";
import { Ruler } from "./Ruler.js";

type Verdict = "held" | "violated" | "off" | "idle";

interface Counter {
  readonly propertyName: string;
  readonly why: string;
  readonly raw: readonly Interval[];
  readonly shrunk: readonly Interval[];
  readonly steps: number;
  readonly actual: readonly Interval[];
  readonly correct: readonly Interval[];
}

interface MutantRow {
  readonly id: string;
  readonly edit: string;
  readonly killedByExamples: boolean;
  readonly killedByProperty: string | null;
}

interface Scores {
  readonly byExamples: number;
  readonly byProperties: number;
  readonly activeCount: number;
  readonly cases: number;
  readonly seed: number;
  readonly total: number;
}

export function App() {
  const [endpoints, setEndpoints] = useState<Endpoints>("closed");
  const [implId, setImplId] = useState("M1");
  const [seed, setSeed] = useState(7);
  const [cases, setCases] = useState(300);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(properties.map((p) => [p.id, p.defaultOn])),
  );

  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(() =>
    Object.fromEntries(properties.map((p) => [p.id, "idle" as Verdict])),
  );
  const [summary, setSummary] = useState<React.ReactNode>(
    <>
      Press <strong>Run properties</strong>.
    </>,
  );
  const [counter, setCounter] = useState<Counter | null>(null);
  const [mutantRows, setMutantRows] = useState<MutantRow[] | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);

  const active = properties.filter((p) => enabled[p.id]);
  const choice = choices.find((c) => c.id === implId)!;
  const exampleRows = useMemo(() => runExamples(correctAnswer), []);

  function clearResults() {
    setVerdicts(Object.fromEntries(properties.map((p) => [p.id, "idle" as Verdict])));
    setCounter(null);
    setMutantRows(null);
    setScores(null);
  }

  function changeEndpoints(next: Endpoints) {
    setEndpoints(next);
    clearResults();
    setSummary(
      next === "closed" ? (
        <>
          Endpoints are now <strong>included</strong>: a block owns its end, so
          blocks meeting at a point share that moment. Run the properties again.
        </>
      ) : (
        <>
          Endpoints are now <strong>excluded</strong>: a block stops just before
          its end, so blocks meeting at a point share nothing. Run the
          properties again.
        </>
      ),
    );
  }

  function runProperties() {
    if (active.length === 0) {
      setSummary(<>No properties are switched on, so nothing can be checked.</>);
      setCounter(null);
      setVerdicts(Object.fromEntries(properties.map((p) => [p.id, "idle" as Verdict])));
      return;
    }

    const next: Record<string, Verdict> = {};
    let firstBad: { name: string; failure: Failure; propertyId: string } | null = null;

    for (const p of properties) {
      if (!enabled[p.id]) {
        next[p.id] = "off";
        continue;
      }
      const failure = firstFailure(choice.fn, p, endpoints, seed, cases);
      next[p.id] = failure ? "violated" : "held";
      if (failure && !firstBad) {
        firstBad = { name: p.name, failure, propertyId: p.id };
      }
    }
    setVerdicts(next);

    const broken = choice.id !== "correct";

    if (!firstBad) {
      setSummary(
        <>
          <strong>{choice.label}</strong>
          {broken && <span className="mono"> — edit: {choice.edit}</span>}
          <br />
          All {active.length} active properties held across {cases} generated
          inputs.
          {broken && (
            <>
              {" "}
              This broken version <strong>survived</strong> — the specification
              has a gap, not the code.
            </>
          )}
        </>,
      );
      setCounter(null);
      return;
    }

    const property = properties.find((p) => p.id === firstBad!.propertyId)!;
    const sh = shrink(choice.fn, property, endpoints, firstBad.failure.input);
    let actual: Interval[] = [];
    try {
      actual = choice.fn(sh.input.map(([a, b]): Interval => [a, b]));
    } catch {
      actual = [];
    }

    setSummary(
      <>
        <strong>{choice.label}</strong>
        {broken && <span className="mono"> — edit: {choice.edit}</span>}
        <br />
        <strong>{firstBad.name}</strong> was violated on generated input #
        {firstBad.failure.index + 1}.
      </>,
    );
    setCounter({
      propertyName: firstBad.name,
      why: firstBad.failure.why,
      raw: firstBad.failure.input,
      shrunk: sh.input,
      steps: sh.steps,
      actual,
      correct: correctAnswer(sh.input),
    });
  }

  function scoreBothSuites() {
    const broken = choices.filter((c) => c.id !== "correct");
    let killedByEx = 0;
    let killedByProp = 0;

    const rows: MutantRow[] = broken.map((m) => {
      const exFail = runExamples(m.fn).some((r) => !r.ok);
      let caughtBy: string | null = null;
      for (const p of active) {
        if (firstFailure(m.fn, p, endpoints, seed, cases)) {
          caughtBy = p.id;
          break;
        }
      }
      if (exFail) killedByEx++;
      if (caughtBy) killedByProp++;
      return {
        id: m.id,
        edit: m.edit,
        killedByExamples: exFail,
        killedByProperty: caughtBy,
      };
    });

    setMutantRows(rows);
    setScores({
      byExamples: killedByEx,
      byProperties: killedByProp,
      activeCount: active.length,
      cases,
      seed,
      total: broken.length,
    });
  }

  function resetProperties() {
    setEnabled(Object.fromEntries(properties.map((p) => [p.id, p.defaultOn])));
    clearResults();
    setSummary(
      <>
        Back to the default suite. Press <strong>Run properties</strong>.
      </>,
    );
  }

  /** Step 06 runs on its own fixed seed, so the demo is the same every visit. */
  const shrinkDemo = useMemo(() => {
    const m2 = choices.find((c) => c.id === "M2")!;
    const p4 = properties.find((p) => p.id === "P4")!;
    const failure = firstFailure(m2.fn, p4, endpoints, 3, 400);
    if (!failure) return null;
    const sh = shrink(m2.fn, p4, endpoints, failure.input);
    let actual: Interval[] = [];
    try {
      actual = m2.fn(sh.input.map(([a, b]): Interval => [a, b]));
    } catch {
      actual = [];
    }
    return { failure, sh, actual };
  }, [endpoints]);

  return (
    <div className="wrap">
      <header>
        <p className="eyebrow">Property-based testing &amp; mutation scoring</p>
        <h1>Spec Lab</h1>
        <p className="lede">
          A test suite that passes tells you nothing by itself. This page builds
          a specification for one small function, then deliberately breaks the
          function to find out whether the tests notice.
        </p>
      </header>

      {/* ── 01 ───────────────────────────────────────────────────────── */}
      <section className="step">
        <div className="step-head">
          <span className="num">01</span>
          <h2>The function</h2>
        </div>
        <p className="note">
          <code>mergeIntervals</code> takes a list of time ranges — shifts,
          meetings, machine bookings — and merges the ones that touch or
          overlap. Integer endpoints, <code>start ≤ end</code>.
        </p>
        <pre>
          <code>{`function mergeIntervals(input) {
  const sorted = [...input].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [start, end] of sorted) {
    const last = out[out.length - 1];
    if (last && start <= last[1]) {        // touches or overlaps
      last[1] = Math.max(last[1], end);    // keep the later end
    } else {
      out.push([start, end]);              // a new block
    }
  }
  return out;
}`}</code>
        </pre>
      </section>

      {/* ── 02 ───────────────────────────────────────────────────────── */}
      <section className="step">
        <div className="step-head">
          <span className="num">02</span>
          <h2>{examples.length} example tests</h2>
        </div>
        <p className="note">
          The normal way to test this: pick a few inputs, write down the answers
          you expect.
        </p>
        <div className="tscroll">
          <table>
            <thead>
              <tr>
                <th>Input</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {exampleRows.map((r) => (
                <tr key={r.name}>
                  <td className="mono">{fmt(r.input)}</td>
                  <td className="mono">{fmt(r.expected)}</td>
                  <td className="mono">{fmt(r.actual)}</td>
                  <td>
                    <span className={`verdict ${r.ok ? "v-pass" : "v-fail"}`}>
                      {r.ok ? "pass" : "fail"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          All {examples.length} pass. The catch: they only check cases I thought
          of while writing them — and they were written before anyone knew what
          would break, which is the only honest way to write them.
        </p>
      </section>

      {/* ── 03 ───────────────────────────────────────────────────────── */}
      <section className="step">
        <div className="step-head">
          <span className="num">03</span>
          <h2>Properties instead of examples</h2>
        </div>
        <p className="note">
          A property is a rule that must hold for <em>every</em> input, so a
          generator can hunt for violations instead of me guessing. Switch the
          implementation to a broken one and watch which rules catch it.
        </p>

        <div className="controls">
          <label className="field">
            Interval endpoints
            <select
              value={endpoints}
              onChange={(e) => changeEndpoints(e.target.value as Endpoints)}
            >
              <option value="closed">end included — [a,b]</option>
              <option value="half-open">end excluded — [a,b)</option>
            </select>
          </label>
          <label className="field">
            Implementation
            <select value={implId} onChange={(e) => setImplId(e.target.value)}>
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Seed
            <input
              type="number"
              min={1}
              max={99999}
              style={{ width: 92 }}
              value={seed}
              onChange={(e) => setSeed(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <label className="field">
            Random cases
            <input
              type="number"
              min={10}
              max={5000}
              step={10}
              style={{ width: 92 }}
              value={cases}
              onChange={(e) =>
                setCases(Math.min(5000, Math.max(10, Number(e.target.value) || 300)))
              }
            />
          </label>
          <button type="button" onClick={runProperties}>
            Run properties
          </button>
        </div>

        <div className="cols">
          <div className="col">
            <h3>The specification</h3>
            <div className="props">
              {properties.map((p) => (
                <div className="prop" key={p.id}>
                  <input
                    type="checkbox"
                    id={`chk-${p.id}`}
                    checked={enabled[p.id] ?? false}
                    onChange={(e) =>
                      setEnabled({ ...enabled, [p.id]: e.target.checked })
                    }
                  />
                  <div>
                    <label className="prop-name" htmlFor={`chk-${p.id}`}>
                      {p.name}
                    </label>
                    <div className="prop-desc">{p.describe(endpoints)}</div>
                  </div>
                  <span className={`verdict v-${verdicts[p.id] ?? "idle"}`}>
                    {verdictText(verdicts[p.id])}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="col">
            <h3>What the run found</h3>
            <p className="note">{summary}</p>
            {counter && (
              <div className="counter">
                <div>
                  <span className="k">why</span>
                  <div>{counter.why}</div>
                </div>
                <div>
                  <span className="k">raw counterexample</span>
                  <div className="mono">{fmt(counter.raw)}</div>
                </div>
                <div>
                  <span className="k">
                    shrunk in {counter.steps} step{counter.steps === 1 ? "" : "s"}
                  </span>
                  <div className="mono">{fmt(counter.shrunk)}</div>
                </div>
                <div>
                  <span className="k">this version returns</span>
                  <div className="mono">{fmt(counter.actual)}</div>
                </div>
                <div>
                  <span className="k">the working version returns</span>
                  <div className="mono">{fmt(counter.correct)}</div>
                </div>
                <Ruler input={counter.shrunk} output={counter.actual} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 04 ───────────────────────────────────────────────────────── */}
      <section className="step">
        <div className="step-head">
          <span className="num">04</span>
          <h2>Scoring the suites</h2>
        </div>
        <p className="note">
          Mutation testing asks the question the other way round. Make five
          small edits to the working code — each one a plausible slip — then run
          each suite against each broken version. A mutant the suite notices is{" "}
          <em>killed</em>. One it misses <em>survived</em>, and every survivor
          is a gap in the specification.
        </p>
        <div className="controls">
          <button type="button" onClick={scoreBothSuites}>
            Score both suites
          </button>
          <button type="button" className="ghost" onClick={resetProperties}>
            Reset properties
          </button>
        </div>

        {scores && (
          <div className="scores">
            <div className="score">
              <div className="big">{pct(scores.byExamples, scores.total)}</div>
              <div className="cap">
                {examples.length} example tests · {scores.byExamples} of{" "}
                {scores.total} mutants killed
              </div>
            </div>
            <div className="score">
              <div className="big">{pct(scores.byProperties, scores.total)}</div>
              <div className="cap">
                {scores.activeCount} active{" "}
                {scores.activeCount === 1 ? "property" : "properties"} ·{" "}
                {scores.byProperties} of {scores.total} killed
              </div>
            </div>
            <div className="score">
              <div className="big">{scores.cases}</div>
              <div className="cap">
                generated inputs per property, seed {scores.seed}
              </div>
            </div>
          </div>
        )}

        {mutantRows && (
          <div className="tscroll">
            <table>
              <thead>
                <tr>
                  <th>Mutant</th>
                  <th>The edit</th>
                  <th>{examples.length} examples</th>
                  <th>Properties</th>
                </tr>
              </thead>
              <tbody>
                {mutantRows.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td className="mono">{r.edit}</td>
                    <td>
                      <Pill killed={r.killedByExamples} />
                    </td>
                    <td>
                      <Pill
                        killed={r.killedByProperty !== null}
                        label={
                          r.killedByProperty
                            ? `killed by ${r.killedByProperty}`
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 05 ───────────────────────────────────────────────────────── */}
      <section className="step">
        <div className="step-head">
          <span className="num">05</span>
          <h2>What counts as an overlap?</h2>
        </div>
        <p className="note">
          Do <code>[1,3]</code> and <code>[3,5]</code> overlap? It depends on
          something the code never writes down: whether a block owns its end.
        </p>
        <p className="note">
          <strong>
            End included, <code>[a,b]</code>.
          </strong>{" "}
          The moment 3 belongs to both blocks, so they really do overlap — and
          "no shared moments" has to be tested as{" "}
          <code>next.start &gt; last.end</code>. <code>M1</code> is then caught
          by <code>P1</code> on its own, and <code>P3</code> adds nothing.
        </p>
        <p className="note">
          <strong>
            End excluded, <code>[a,b)</code>.
          </strong>{" "}
          The moment 3 belongs only to the second block. The blocks share
          nothing; they merely meet. So <code>P1</code> holds, <code>M1</code>{" "}
          survives it, and catching <code>M1</code> needs a genuinely different
          requirement — that adjacent blocks be merged into one. That is{" "}
          <code>P3</code>, and only here does it earn its place.
        </p>
        <p className="note">
          One more consequence worth seeing: under <code>[a,b)</code>,{" "}
          <code>M5</code> survives as well — and it deserves to. <code>M5</code>{" "}
          throws away intervals whose start equals their end, and{" "}
          <code>[5,5)</code> covers no moment at all, so discarding it loses
          nothing. The same edit is a bug under one reading and correct under
          the other.
        </p>
        <p className="note">
          The first version of this page got that wrong. The coverage properties
          counted the end as part of the interval while <code>P1</code> counted
          it as outside, so the specification contradicted itself and{" "}
          <code>P1</code> let a real bug through. The function was never at
          fault. Switch the selector in step 03 and score again: the number
          moves because the <em>semantics</em> moved, not the code. A property
          is worth no more than the decision you made before writing it.
        </p>
      </section>

      {/* ── 06 ───────────────────────────────────────────────────────── */}
      <section className="step">
        <div className="step-head">
          <span className="num">06</span>
          <h2>Shrinking a counterexample</h2>
        </div>
        <p className="note">
          A random failure usually arrives with junk attached — fifteen
          intervals where two were enough. After a failure the lab repeatedly
          drops one interval and re-checks; if it still fails, the smaller case
          replaces the bigger one. What survives is the smallest input that
          still breaks the rule, which is the one worth reading.
        </p>
        {shrinkDemo ? (
          <div className="counter">
            <div>
              <span className="k">M2 against P4 · raw</span>
              <div className="mono">{fmt(shrinkDemo.failure.input)}</div>
            </div>
            <div>
              <span className="k">
                after {shrinkDemo.sh.steps} shrink step
                {shrinkDemo.sh.steps === 1 ? "" : "s"}
              </span>
              <div className="mono">
                {fmt(shrinkDemo.sh.input)} → {fmt(shrinkDemo.actual)}
              </div>
            </div>
            <div>{shrinkDemo.failure.why}</div>
            <Ruler input={shrinkDemo.sh.input} output={shrinkDemo.actual} />
          </div>
        ) : (
          <p className="note">No failure found for this demo seed.</p>
        )}
      </section>

      <footer>
        Generated inputs use a seeded pseudo-random generator, so a seed and a
        case count reproduce a run exactly — a failure found once can be found
        again. Coverage properties sample at half-steps, because a gap between
        two integer intervals is precisely where over-merging hides. The same
        specification runs in a terminal: <code>npm test</code> for the suite,{" "}
        <code>npm run mutate</code> for the score.
      </footer>
    </div>
  );
}

function Pill({ killed, label }: { killed: boolean; label?: string }) {
  return (
    <span className={`pill ${killed ? "pill-killed" : "pill-survived"}`}>
      {label ?? (killed ? "killed" : "survived")}
    </span>
  );
}

function verdictText(v: Verdict | undefined): string {
  if (v === "held") return "held";
  if (v === "violated") return "violated";
  if (v === "off") return "off";
  return "—";
}

function pct(n: number, total: number): string {
  return `${Math.round((n / total) * 100)}%`;
}
