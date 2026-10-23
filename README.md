**[Live page →](https://sarasharifzadehasli.github.io/spec-lab/)**

# spec-lab

One small function (merging overlapping time blocks) with a specification
written as properties, and a mutation score that measures whether the tests
would actually notice if the function were wrong.

```ts
mergeIntervals([
  [1, 3],
  [2, 6],
  [8, 10],
]); //  [[1, 6], [8, 10]]
```

The function is deliberately small. It is the thing being tested, not the
point of the repository.

There are two ways to read the results. `npm test` and `npm run mutate` print
them in a terminal. `npm run dev` opens a page that walks the same material in
six steps and lets you drive it: pick a broken version, pick an endpoint
convention, set the seed and the number of random cases, and watch which rules
fire. Both read the same `src/spec.ts` and `mutation/mutants.ts`, so neither
can drift away from the other.

---

## Why not just write example tests

An example test checks one input. You pick it, so it only covers the mistakes
you already thought of.

`src/examples.ts` holds three of them (an obvious overlap, an out-of-order
pair, the empty list), and they are deliberately _not_ aimed at the five broken
versions in `mutation/`. An earlier draft had seven examples, one per mistake,
written after the mistakes were known. That scores beautifully and measures
nothing: real examples are written before anyone knows what will break, and
finding out what such a suite misses is the entire exercise.

Under closed endpoints those three examples kill 1 of the 5 broken versions.
The properties kill 5.

A property works the other way round. Instead of naming an input, you state a
rule the answer must obey for _every_ input, and a generator hunts for an input
that breaks it. When it finds one it **shrinks** it: drop one block, re-check,
and if it still fails keep the smaller input. What survives is the smallest
input that still breaks the rule, which is the one worth reading.

## The specification

Five rules, in [`src/spec.ts`](src/spec.ts):

|        | rule                                      | what it catches                |
| ------ | ----------------------------------------- | ------------------------------ |
| **P1** | no moment belongs to two blocks           | the merge test failing to fire |
| **P2** | the output is sorted by start             | **nothing (see below)**        |
| **P3** | blocks that meet at a point are one block | M1, but only under `[a, b)`    |
| **P4** | the output loses no covered time          | a block dropped or shortened   |
| **P5** | the output invents no time                | a real gap bridged             |

P4 and P5 are mirrors of each other and together they pin the answer down: one
says nothing may be lost, the other says nothing may be added. Each walks a
grid of moments and asks which side covers it.

The grid step is `0.5`, and that is not arbitrary: the generator produces
integer endpoints, so a gap the output wrongly swallows is at least `1` wide,
and a `0.5` step cannot step over it. The half-step is precisely where
over-merging hides.

P3 starts switched off. Under closed endpoints it says nothing P1 does not
already say. It earns its place only under the other convention, which is the
next section.

## The bug in the specification

Writing these rules down turned up something I did not expect: **the first
version of the specification contradicted itself**, and the contradiction let a
broken implementation pass.

The question is whether a block's end moment belongs to it.

- `[a, b]`: **closed.** The end belongs to the block. `[1, 3]` and `[3, 5]`
  both own the moment `3`, so they really do overlap and must merge. "No shared
  moments" has to be tested as `next.start > prev.end`.
- `[a, b)`: **half-open.** The end belongs to nobody. The moment `3` belongs
  only to the second block, so the two share nothing; they merely meet. P1
  holds, and catching M1 needs a different rule: that adjacent blocks be
  merged. That is P3.

My P1 was written for half-open while P4 and P5 sampled as though endpoints
were closed. The suite demanded two incompatible things, and the result was
worse than either rule alone: M1 satisfied P1 because P1 permitted it, and
satisfied P4 and P5 because under closed sampling no moment is lost or invented
either way. It passed everything while being wrong.

The fix was not to pick a convention quietly. It became a parameter of the
specification, and the suite runs under both. Note which file changed:
`spec.ts` takes the convention, `intervals.ts` does not. Under both readings
`[1, 3]` and `[3, 5]` come back merged, so the function never needed to know.

A second consequence falls out of the same switch: under `[a, b)`, **M5
survives, and deserves to.** M5 discards blocks whose start equals their end,
and `[5, 5)` covers no moment at all, so discarding it loses nothing. The same
edit is a bug under one reading and correct under the other.

## Mutation scoring

A green test suite proves the tests ran. It does not prove they would catch
anything. So: take the working function, introduce one plausible mistake, and
ask whether any test fails. A broken version that makes a test fail is
**killed**; one that passes the whole suite **survived**, and every survivor is
a gap in the specification.

Five mutants, in [`mutation/mutants.ts`](mutation/mutants.ts), each a single
change of the kind that gets typed by accident:

```
M1  start <= last.end              →  start < last.end
M2  last.end = Math.max(…)         →  last.end = end
M3  list.sort(byStart)             →  (removed)
M4  start <= last.end              →  start <= last.end + 1
M5  (nothing)                      →  list = list.filter(([s, e]) => e > s)
```

```
npm run mutate
```

| convention         | 3 examples | P1, P2, P4, P5 | with P3 on            |
| ------------------ | ---------- | -------------- | --------------------- |
| `[a, b]` closed    | 1/5        | **5/5**        | 5/5 (P3 adds nothing) |
| `[a, b)` half-open | 1/5        | 3/5            | 4/5 (P3 kills M1)     |

The score is the least interesting line. These are the rest:

**P2 never kills anything, and cannot.** A block is only pushed when
`start > last.end >= last.start`, so every new start is strictly greater than
the one before. Sortedness comes from the push condition, not from the sort.
800,000 random inputs did not falsify it and none will. It stays in the
repository, labelled, as the worked example of a test that passes for free.

**The number moves when the convention moves, and the code never changes.**
That is the point of the table above. A property is worth no more than the
decision you made before writing it.

## What this does not prove

- **Equivalent mutants.** A mutant can survive because the change never alters
  behaviour at all. No test can kill those, and deciding in general whether a
  given mutant is equivalent is undecidable, so 100% is not always the target,
  and a score quoted without looking at the survivors means little.
- **Properties are not proofs.** P4 and P5 hold for every input tried, not for
  every input. Proving a property for all inputs is a different activity with
  different tools.

[Stryker](https://stryker-mutator.io/) is the production tool for mutation
testing in TypeScript: it rewrites the real source rather than keeping
hand-written variants. The script here is short on purpose, because the
mechanism was the thing worth understanding. Stryker is used in the next
section.

## LLM-written tests

The same function, with tests written by ChatGPT and Claude instead of by me.
One fixed prompt ([`llm/prompt.md`](llm/prompt.md)) gave each model the
function's code and asked for a Vitest test file. Five runs per model, each in
a new chat with memory off ([`llm/runs.md`](llm/runs.md)). Every suite was then
scored on the five hand-written mutants and on 21 mutants generated by Stryker.

| tests           | pass on the working function | M1 to M5 caught    | Stryker mutants caught |
| --------------- | ---------------------------- | ------------------ | ---------------------- |
| my 3 examples   | yes                          | 1 of 5             | 20 of 21               |
| my 5 properties | yes                          | 5 of 5             | 20 of 21               |
| Claude, 5 runs  | 5 of 5 runs                  | 5 of 5, every run  | 21 of 21, every run    |
| ChatGPT, 5 runs | 3 of 5 runs                  | 5 of 5, in those 3 | 21 of 21, in those 3   |

What I take from it:

- When a generated suite was right, it caught every mutant here. Weak tests
  were not the problem.
- Wrong expectations were. Two of the five ChatGPT suites expect a wrong answer
  somewhere, so they fail on the working function. The same wrong test (same
  input, same answer) appeared in both. One of them also expects `[-10, 10]`
  for `[-5, 5] [-10, -6] [4, 10]`, which is exactly what M4 returns. A
  developer who trusted that test and "fixed" the function would have
  introduced M4.
- My own two suites miss different Stryker mutants. The examples miss `<=`
  changed to `<` (M1 again). The properties miss a junk element added to the
  output, because no rule checks that every element of the output is an
  interval.

Limits: one small function, 26 mutants, five runs per model, a free model
(ChatGPT, default) against a paid one (Claude Opus 5.5), and both models saw
the source code.

## Layout

```
src/intervals.ts                  the function, and coversPoint
src/spec.ts                       the five properties, parameterised by convention
src/examples.ts                   the three examples, as data
src/analysis.ts                   the default suite, and judging one implementation
src/intervals.test.ts             the examples, run by vitest
src/intervals.property.test.ts    the properties, run by fast-check under both conventions
mutation/mutants.ts               the five broken versions
mutation/score.ts                 the terminal report
llm/prompt.md                     the prompt the models got, and the run settings
llm/runs.md                       model, settings and date of every run
llm/generated/                    the ten generated test files
llm/score.ts                      the hand-written mutants against every suite
llm/stryker.ts                    Stryker's mutants against every suite
web/lab.ts                        the page's own generator and shrinker
web/App.tsx                       the six steps
web/Ruler.tsx                     a counterexample, drawn
```

Two deliberate choices about what is shared and what is not.

The examples live in `examples.ts` as data rather than inside `expect()` calls,
and the judging lives in `analysis.ts`, so the test runner, the scorer and the
page all work from the same definitions.

The generator and the shrinker, though, exist twice. The test suite uses
**fast-check**, which generates and shrinks automatically and does both better.
`web/lab.ts` has a hand-written seeded generator and a hand-written shrinking
loop, because step 06 of the page shows the shrink happening: raw
counterexample, number of steps, result. A shrinker you can watch count its
steps teaches more than one that silently hands you the answer.

## Running it

```
npm install
npm test        # vitest: 3 examples + 5 properties × 2 conventions
npm run mutate  # the mutation report
npm run llm:score    # the five hand-written mutants against every suite
npm run llm:stryker  # Stryker's mutants against every suite
npm run dev     # the page, at localhost:5173
npm run build   # a static build in dist/
npm run typecheck
```

`seed` fixes where the generator starts, so a failure found today reproduces
exactly tomorrow. That is the difference between a bug report and a rumour. On the
page the seed and the case count are inputs; change either and the run changes
with them.

`.github/workflows/pages.yml` runs the typecheck and the suite on every push to
`main` and publishes `dist/` to GitHub Pages if they pass. Turn it on under
Settings → Pages → Source → GitHub Actions.

### A note on `npm audit`

Installing prints a handful of advisories. They are all in build-time tooling
(Vitest's bundled esbuild and its worker pool), and `npm audit --omit=dev`
reports none, because the published page has no runtime dependencies at all.
The advisories matter to a dev server exposed to a hostile network, not to a
local build or to the page once it is deployed.

`npm audit fix --force` is the wrong answer here. It resolves them by
installing major versions outside the stated ranges, trading a warning that
does not apply for a build that may not work.

Built with [fast-check](https://fast-check.dev/), [Vitest](https://vitest.dev/)
and [Vite](https://vite.dev/).
