import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";

type Iv = [number, number];

/** Small deterministic PRNG so randomized tests are reproducible. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomIntervals(rng: () => number, count: number, range: number): Iv[] {
  const out: Iv[] = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(rng() * range) - Math.floor(range / 2);
    const len = Math.floor(rng() * (range / 5));
    out.push([a, a + len]);
  }
  return out;
}

describe("mergeIntervals", () => {
  describe("trivial inputs", () => {
    it("returns an empty array for empty input", () => {
      expect(mergeIntervals([])).toEqual([]);
    });

    it("returns a single interval unchanged", () => {
      expect(mergeIntervals([[1, 3]])).toEqual([[1, 3]]);
    });

    it("handles a single zero-length interval", () => {
      expect(mergeIntervals([[5, 5]])).toEqual([[5, 5]]);
    });
  });

  describe("non-overlapping intervals", () => {
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

    it("sorts disjoint intervals by start", () => {
      expect(
        mergeIntervals([
          [7, 9],
          [1, 2],
          [4, 5],
        ]),
      ).toEqual([
        [1, 2],
        [4, 5],
        [7, 9],
      ]);
    });

    it("does not merge intervals separated by a gap, however small", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [3, 4],
        ]),
      ).toEqual([
        [1, 2],
        [3, 4],
      ]);
      expect(
        mergeIntervals([
          [0, 1],
          [1.0001, 2],
        ]),
      ).toEqual([
        [0, 1],
        [1.0001, 2],
      ]);
    });
  });

  describe("overlapping intervals", () => {
    it("merges two overlapping intervals", () => {
      expect(
        mergeIntervals([
          [1, 4],
          [3, 6],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("merges overlapping intervals given out of order", () => {
      expect(
        mergeIntervals([
          [3, 6],
          [1, 4],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("absorbs an interval fully contained in another", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [2, 3],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("keeps the larger end when a later interval is contained", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [2, 3],
          [4, 5],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("merges a chain of overlapping intervals into one", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [2, 5],
          [4, 8],
          [7, 10],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("merges intervals that share a start", () => {
      expect(
        mergeIntervals([
          [1, 5],
          [1, 3],
        ]),
      ).toEqual([[1, 5]]);
      expect(
        mergeIntervals([
          [1, 3],
          [1, 5],
        ]),
      ).toEqual([[1, 5]]);
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

    it("produces several groups when only some intervals overlap", () => {
      expect(
        mergeIntervals([
          [8, 10],
          [1, 3],
          [15, 18],
          [2, 6],
          [9, 12],
        ]),
      ).toEqual([
        [1, 6],
        [8, 12],
        [15, 18],
      ]);
    });
  });

  describe("touching intervals", () => {
    it("merges intervals that touch at an endpoint", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [2, 3],
        ]),
      ).toEqual([[1, 3]]);
    });

    it("merges touching intervals given out of order", () => {
      expect(
        mergeIntervals([
          [2, 3],
          [1, 2],
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

    it("merges a zero-length interval sitting on another's endpoint", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 3],
        ]),
      ).toEqual([[1, 3]]);
      expect(
        mergeIntervals([
          [3, 3],
          [3, 5],
        ]),
      ).toEqual([[3, 5]]);
    });

    it("merges a zero-length interval inside another", () => {
      expect(
        mergeIntervals([
          [1, 5],
          [3, 3],
        ]),
      ).toEqual([[1, 5]]);
    });

    it("keeps separate zero-length intervals at different points", () => {
      expect(
        mergeIntervals([
          [4, 4],
          [1, 1],
        ]),
      ).toEqual([
        [1, 1],
        [4, 4],
      ]);
    });
  });

  describe("number handling", () => {
    it("works with negative numbers", () => {
      expect(
        mergeIntervals([
          [-5, -3],
          [-10, -6],
          [-4, 0],
        ]),
      ).toEqual([
        [-10, -6],
        [-5, 0],
      ]);
    });

    it("works across zero", () => {
      expect(
        mergeIntervals([
          [-2, 0],
          [0, 2],
        ]),
      ).toEqual([[-2, 2]]);
    });

    it("works with fractional values", () => {
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

    it("works with very large values", () => {
      const big = Number.MAX_SAFE_INTEGER;
      expect(
        mergeIntervals([
          [big - 10, big],
          [big - 20, big - 10],
        ]),
      ).toEqual([[big - 20, big]]);
    });

    it("works with infinite bounds", () => {
      expect(
        mergeIntervals([
          [5, Infinity],
          [-Infinity, 0],
          [0, 3],
        ]),
      ).toEqual([
        [-Infinity, 3],
        [5, Infinity],
      ]);
    });
  });

  describe("immutability", () => {
    it("does not mutate the input array or its intervals", () => {
      const input: Iv[] = [
        [5, 8],
        [1, 3],
        [2, 6],
      ];
      const snapshot = input.map((iv) => [...iv]);

      mergeIntervals(input);

      expect(input).toEqual(snapshot);
    });

    it("accepts frozen input without throwing", () => {
      const input = Object.freeze([
        Object.freeze([3, 4] as const),
        Object.freeze([1, 3] as const),
      ]);

      expect(() => mergeIntervals(input)).not.toThrow();
      expect(mergeIntervals(input)).toEqual([[1, 4]]);
    });

    it("returns a new array, not the input", () => {
      const input: Iv[] = [[1, 2]];
      const result = mergeIntervals(input);

      expect(result).not.toBe(input);
    });

    it("returns new interval objects, not references to the input's", () => {
      const a: Iv = [1, 2];
      const b: Iv = [5, 6];
      const result = mergeIntervals([a, b]);

      expect(result[0]).not.toBe(a);
      expect(result[1]).not.toBe(b);
    });

    it("does not let later edits to the output affect the input", () => {
      const input: Iv[] = [[1, 2]];
      const result = mergeIntervals(input) as Iv[];
      result[0][1] = 99;

      expect(input).toEqual([[1, 2]]);
    });

    it("gives independent results on repeated calls", () => {
      const input: Iv[] = [
        [1, 3],
        [2, 4],
      ];
      const first = mergeIntervals(input);
      const second = mergeIntervals(input);

      expect(first).toEqual(second);
      expect(first).not.toBe(second);
    });
  });

  describe("invariants on randomized input", () => {
    const seeds = [1, 2, 3, 42, 1234, 99999];

    for (const seed of seeds) {
      it(`holds for random input (seed ${seed})`, () => {
        const rng = makeRng(seed);
        const input = randomIntervals(rng, 40, 200);
        const result = mergeIntervals(input);

        // Each output interval is well-formed.
        for (const [s, e] of result) {
          expect(s).toBeLessThanOrEqual(e);
        }

        // Sorted by start, and no two blocks touch or overlap.
        for (let i = 1; i < result.length; i++) {
          expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
        }

        // Every input interval is fully covered by exactly one output interval.
        for (const [s, e] of input) {
          const covering = result.filter(([rs, re]) => rs <= s && e <= re);
          expect(covering).toHaveLength(1);
        }

        // Every output start and end is an actual input start and end,
        // so the result covers nothing beyond the input.
        const starts = new Set(input.map(([s]) => s));
        const ends = new Set(input.map(([, e]) => e));
        for (const [s, e] of result) {
          expect(starts.has(s)).toBe(true);
          expect(ends.has(e)).toBe(true);
        }

        // Every output interval contains at least one input interval.
        for (const [rs, re] of result) {
          expect(input.some(([s, e]) => rs <= s && e <= re)).toBe(true);
        }
      });
    }

    it("is idempotent", () => {
      const rng = makeRng(7);
      const input = randomIntervals(rng, 50, 300);
      const once = mergeIntervals(input);
      const twice = mergeIntervals(once);

      expect(twice).toEqual(once);
    });

    it("does not depend on input order", () => {
      const rng = makeRng(2024);
      const input = randomIntervals(rng, 30, 150);
      const reversed = [...input].reverse();

      const shuffled = [...input];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const expected = mergeIntervals(input);
      expect(mergeIntervals(reversed)).toEqual(expected);
      expect(mergeIntervals(shuffled)).toEqual(expected);
    });

    it("never returns more intervals than it was given", () => {
      const rng = makeRng(555);
      for (let n = 0; n < 20; n++) {
        const input = randomIntervals(rng, n, 100);
        expect(mergeIntervals(input).length).toBeLessThanOrEqual(input.length);
      }
    });
  });
});