/**
 * Five broken versions of `mergeIntervals`.
 *
 * Each one is the working function with a single plausible mistake in it —
 * the kind of mistake that gets typed by accident, not the kind invented to
 * be caught. They exist to ask one question about the test suite: if the
 * implementation were wrong in this way, would anything fail?
 *
 * A mutant that makes a test fail is "killed". One that survives the whole
 * suite is a real hole: it means a broken implementation would ship green.
 */

import type { Interval } from "../src/intervals.js";

export type Implementation = (input: readonly Interval[]) => Interval[];

export interface Mutant {
  readonly id: string;
  readonly label: string;
  /** The single change, as it would appear in a diff. */
  readonly change: string;
  readonly fn: Implementation;
}

/**
 * All five share this shape, so the differences stay visible. `flags` is only
 * a device for writing one body instead of six near-identical ones — the real
 * implementation in `src/intervals.ts` has no flags.
 */
interface Flags {
  /** `start < last.end` instead of `start <= last.end`. */
  strict?: boolean;
  /** Assign the new end instead of taking the larger of the two. */
  noMax?: boolean;
  /** Skip the sort. */
  noSort?: boolean;
  /** Treat blocks within `gap` of each other as touching. */
  gap?: number;
  /** Throw away blocks of zero length. */
  dropEmpty?: boolean;
}

function variant(flags: Flags): Implementation {
  return (input) => {
    let list = input.map((iv): [number, number] => [iv[0], iv[1]]);
    if (flags.dropEmpty) list = list.filter(([s, e]) => e > s);
    if (!flags.noSort) list.sort((a, b) => a[0] - b[0]);

    const out: [number, number][] = [];
    for (const [start, end] of list) {
      const last = out[out.length - 1];
      const joins =
        last !== undefined &&
        (flags.strict ? start < last[1] : start <= last[1] + (flags.gap ?? 0));
      if (last !== undefined && joins) {
        last[1] = flags.noMax ? end : Math.max(last[1], end);
      } else {
        out.push([start, end]);
      }
    }
    return out;
  };
}

/** The working implementation, expressed in the same shape for comparison. */
export const reference: Implementation = variant({});

export const mutants: readonly Mutant[] = [
  {
    id: "M1",
    label: "blocks that only touch are left separate",
    change: "start <= last.end   →   start < last.end",
    fn: variant({ strict: true }),
  },
  {
    id: "M2",
    label: "the merged end overwrites instead of extending",
    change: "last.end = Math.max(last.end, end)   →   last.end = end",
    fn: variant({ noMax: true }),
  },
  {
    id: "M3",
    label: "the sort is missing",
    change: "list.sort(byStart)   →   (removed)",
    fn: variant({ noSort: true }),
  },
  {
    id: "M4",
    label: "off by one, so a one-unit gap is swallowed",
    change: "start <= last.end   →   start <= last.end + 1",
    fn: variant({ gap: 1 }),
  },
  {
    id: "M5",
    label: "zero-length blocks are discarded",
    change: "(nothing)   →   list = list.filter(([s, e]) => e > s)",
    fn: variant({ dropEmpty: true }),
  },
];
