import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";
import type { Interval } from "../../src/intervals";

/** Deterministic PRNG (mulberry32) so randomized checks are reproducible. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomIntervals(next: () => number, count: number, range: number): Interval[] {
  const out: Interval[] = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor(next() * range) - Math.floor(range / 2);
    const len = Math.floor(next() * (range / 4));
    out.push([start, start + len]);
  }
  return out;
}

function covers(intervals: readonly Interval[], x: number): boolean {
  return intervals.some(([s, e]) => s <= x && x <= e);
}

describe("mergeIntervals", () => {
  describe("basic cases", () => {
    it("returns an empty array for empty input", () => {
      expect(mergeIntervals([])).toEqual([]);
    });

    it("returns a single interval unchanged", () => {
      expect(mergeIntervals([[1, 3]])).toEqual([[1, 3]]);
    });

    it("keeps disjoint, already-sorted intervals as they are", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [4, 5],
          [7, 9],
        ]),
      ).toEqual([
        [1, 2],
        [4, 5],
        [7, 9],
      ]);
    });

    it("merges two overlapping intervals", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [2, 6],
        ]),
      ).toEqual([[1, 6]]);
    });
  });

  describe("touching intervals", () => {
    it("merges intervals that share an endpoint", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [2, 3],
        ]),
      ).toEqual([[1, 3]]);
    });

    it("merges a chain of touching intervals", () => {
      expect(
        mergeIntervals([
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
        ]),
      ).toEqual([[0, 4]]);
    });

    it("does not merge intervals separated by a gap", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [2.5, 3],
        ]),
      ).toEqual([
        [1, 2],
        [2.5, 3],
      ]);
    });
  });

  describe("ordering", () => {
    it("sorts unsorted input by start", () => {
      expect(
        mergeIntervals([
          [8, 10],
          [1, 3],
          [15, 18],
          [2, 6],
        ]),
      ).toEqual([
        [1, 6],
        [8, 10],
        [15, 18],
      ]);
    });

    it("handles reverse-ordered input", () => {
      expect(
        mergeIntervals([
          [9, 10],
          [5, 6],
          [1, 2],
        ]),
      ).toEqual([
        [1, 2],
        [5, 6],
        [9, 10],
      ]);
    });

    it("merges when a later-sorted interval starts at the same point with a smaller end", () => {
      expect(
        mergeIntervals([
          [1, 4],
          [0, 4],
        ]),
      ).toEqual([[0, 4]]);
    });
  });

  describe("containment and duplicates", () => {
    it("absorbs intervals fully contained in another", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [2, 3],
          [4, 5],
          [6, 9],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("keeps the larger end when a contained interval comes after the container", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [2, 5],
          [11, 12],
        ]),
      ).toEqual([
        [1, 10],
        [11, 12],
      ]);
    });

    it("collapses duplicate intervals", () => {
      expect(
        mergeIntervals([
          [2, 4],
          [2, 4],
          [2, 4],
        ]),
      ).toEqual([[2, 4]]);
    });

    it("handles intervals with the same start but different ends", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [1, 7],
          [1, 3],
        ]),
      ).toEqual([[1, 7]]);
    });
  });

  describe("zero-length intervals", () => {
    it("keeps a single point interval", () => {
      expect(mergeIntervals([[5, 5]])).toEqual([[5, 5]]);
    });

    it("keeps separate point intervals apart", () => {
      expect(
        mergeIntervals([
          [3, 3],
          [1, 1],
        ]),
      ).toEqual([
        [1, 1],
        [3, 3],
      ]);
    });

    it("merges duplicate point intervals", () => {
      expect(
        mergeIntervals([
          [5, 5],
          [5, 5],
        ]),
      ).toEqual([[5, 5]]);
    });

    it("absorbs a point that touches an interval's end", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 3],
        ]),
      ).toEqual([[1, 3]]);
    });

    it("absorbs a point that touches an interval's start", () => {
      expect(
        mergeIntervals([
          [3, 6],
          [3, 3],
        ]),
      ).toEqual([[3, 6]]);
    });
  });

  describe("numeric edge cases", () => {
    it("handles negative numbers", () => {
      expect(
        mergeIntervals([
          [-5, -1],
          [-2, 2],
          [4, 6],
        ]),
      ).toEqual([
        [-5, 2],
        [4, 6],
      ]);
    });

    it("handles fractional values", () => {
      expect(
        mergeIntervals([
          [0.5, 1.5],
          [1.25, 2.75],
          [3.1, 3.2],
        ]),
      ).toEqual([
        [0.5, 2.75],
        [3.1, 3.2],
      ]);
    });

    it("handles very large values", () => {
      const big = Number.MAX_SAFE_INTEGER;
      expect(
        mergeIntervals([
          [big - 10, big],
          [big - 20, big - 10],
        ]),
      ).toEqual([[big - 20, big]]);
    });
  });

  describe("immutability", () => {
    it("does not mutate the input array or its intervals", () => {
      const input: Interval[] = [
        [8, 10],
        [1, 3],
        [2, 6],
      ];
      const snapshot = input.map((iv) => [iv[0], iv[1]]);
      mergeIntervals(input);
      expect(input).toEqual(snapshot);
    });

    it("works with frozen input", () => {
      const input = Object.freeze([
        Object.freeze([3, 4] as const),
        Object.freeze([1, 3] as const),
      ]) as readonly Interval[];
      expect(() => mergeIntervals(input)).not.toThrow();
      expect(mergeIntervals(input)).toEqual([[1, 4]]);
    });

    it("returns new interval arrays rather than input references", () => {
      const a: Interval = [1, 2];
      const b: Interval = [5, 6];
      const result = mergeIntervals([a, b]);
      expect(result[0]).not.toBe(a);
      expect(result[1]).not.toBe(b);
    });

    it("returns a new array on each call", () => {
      const input: Interval[] = [[1, 2]];
      const r1 = mergeIntervals(input);
      const r2 = mergeIntervals(input);
      expect(r1).not.toBe(r2);
      expect(r1).not.toBe(input);
    });

    it("is idempotent", () => {
      const once = mergeIntervals([
        [5, 7],
        [1, 2],
        [2, 4],
        [6, 9],
      ]);
      expect(mergeIntervals(once)).toEqual(once);
    });
  });

  describe("invariants on randomized input", () => {
    const next = rng(12345);

    for (let trial = 0; trial < 200; trial++) {
      const count = Math.floor(next() * 12);
      const input = randomIntervals(next, count, 40);

      it(`trial ${trial}: output is sorted, separated, and covers the same points`, () => {
        const result = mergeIntervals(input);

        // Every output interval is well-formed.
        for (const [s, e] of result) {
          expect(s).toBeLessThanOrEqual(e);
        }

        // Sorted by start, and no two blocks touch or overlap.
        for (let i = 1; i < result.length; i++) {
          expect(result[i - 1][1]).toBeLessThan(result[i][0]);
        }

        // Output is no longer than input.
        expect(result.length).toBeLessThanOrEqual(input.length);

        // Same union: probe every integer and half-integer in range.
        for (let x = -30; x <= 40; x += 0.5) {
          expect(covers(result, x)).toBe(covers(input, x));
        }

        // Endpoints of the output come from the input.
        const starts = new Set(input.map((iv) => iv[0]));
        const ends = new Set(input.map((iv) => iv[1]));
        for (const [s, e] of result) {
          expect(starts.has(s)).toBe(true);
          expect(ends.has(e)).toBe(true);
        }
      });
    }
  });
});