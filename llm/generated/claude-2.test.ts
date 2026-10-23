import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";
import type { Interval } from "../../src/intervals";

function checkInvariants(result: Interval[]): void {
  for (const [start, end] of result) {
    expect(start).toBeLessThanOrEqual(end);
  }
  for (let i = 1; i < result.length; i++) {
    // sorted by start, and strictly separated (no overlap, no touching)
    expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
  }
}

function covers(intervals: readonly Interval[], x: number): boolean {
  return intervals.some(([s, e]) => s <= x && x <= e);
}

describe("mergeIntervals", () => {
  describe("trivial inputs", () => {
    it("returns an empty array for empty input", () => {
      expect(mergeIntervals([])).toEqual([]);
    });

    it("returns a single interval unchanged", () => {
      expect(mergeIntervals([[1, 5]])).toEqual([[1, 5]]);
    });

    it("keeps a zero-length interval", () => {
      expect(mergeIntervals([[3, 3]])).toEqual([[3, 3]]);
    });
  });

  describe("non-overlapping intervals", () => {
    it("keeps separate intervals separate", () => {
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

    it("sorts unsorted, non-overlapping input by start", () => {
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

    it("does not merge intervals separated by a small gap", () => {
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

    it("keeps the larger end when a later-starting interval ends earlier", () => {
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

    it("merges duplicate intervals", () => {
      expect(
        mergeIntervals([
          [2, 4],
          [2, 4],
          [2, 4],
        ]),
      ).toEqual([[2, 4]]);
    });

    it("merges intervals with the same start", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [1, 7],
          [1, 4],
        ]),
      ).toEqual([[1, 7]]);
    });

    it("handles a mix of merged and separate groups", () => {
      expect(
        mergeIntervals([
          [15, 18],
          [1, 3],
          [8, 10],
          [2, 6],
        ]),
      ).toEqual([
        [1, 6],
        [8, 10],
        [15, 18],
      ]);
    });
  });

  describe("touching intervals", () => {
    it("merges intervals where one ends exactly where the next starts", () => {
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
          [3, 4],
          [1, 2],
          [2, 3],
        ]),
      ).toEqual([[1, 4]]);
    });

    it("merges a zero-length interval touching another", () => {
      expect(
        mergeIntervals([
          [3, 5],
          [5, 5],
        ]),
      ).toEqual([[3, 5]]);
      expect(
        mergeIntervals([
          [3, 3],
          [3, 5],
        ]),
      ).toEqual([[3, 5]]);
    });

    it("merges coincident zero-length intervals", () => {
      expect(
        mergeIntervals([
          [4, 4],
          [4, 4],
        ]),
      ).toEqual([[4, 4]]);
    });
  });

  describe("number ranges", () => {
    it("handles negative numbers", () => {
      expect(
        mergeIntervals([
          [-5, -2],
          [-3, 0],
          [-10, -8],
        ]),
      ).toEqual([
        [-10, -8],
        [-5, 0],
      ]);
    });

    it("handles fractional values", () => {
      expect(
        mergeIntervals([
          [0.5, 1.5],
          [1.5, 2.25],
          [3.1, 3.2],
        ]),
      ).toEqual([
        [0.5, 2.25],
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

  describe("purity", () => {
    it("does not mutate the input array or its intervals", () => {
      const a: Interval = Object.freeze([3, 6]) as Interval;
      const b: Interval = Object.freeze([1, 4]) as Interval;
      const input = Object.freeze([a, b]) as readonly Interval[];

      const result = mergeIntervals(input);

      expect(result).toEqual([[1, 6]]);
      expect(input).toEqual([
        [3, 6],
        [1, 4],
      ]);
      expect(input[0]).toBe(a);
      expect(input[1]).toBe(b);
    });

    it("returns new interval objects, not references to the input", () => {
      const a: Interval = [1, 2];
      const b: Interval = [5, 6];
      const result = mergeIntervals([a, b]);

      expect(result).toEqual([
        [1, 2],
        [5, 6],
      ]);
      expect(result[0]).not.toBe(a);
      expect(result[1]).not.toBe(b);
    });

    it("returns a new array even for empty input", () => {
      const input: Interval[] = [];
      const result = mergeIntervals(input);
      expect(result).not.toBe(input);
    });

    it("gives the same result when called twice on the same input", () => {
      const input: Interval[] = [
        [5, 7],
        [1, 3],
        [2, 4],
      ];
      expect(mergeIntervals(input)).toEqual(mergeIntervals(input));
    });
  });

  describe("idempotence and order independence", () => {
    it("is idempotent", () => {
      const input: Interval[] = [
        [8, 9],
        [1, 3],
        [2, 5],
        [5, 6],
        [10, 12],
      ];
      const once = mergeIntervals(input);
      expect(mergeIntervals(once)).toEqual(once);
    });

    it("produces the same result for any permutation of the input", () => {
      const input: Interval[] = [
        [1, 3],
        [2, 5],
        [7, 8],
        [8, 9],
      ];
      const expected: Interval[] = [
        [1, 5],
        [7, 9],
      ];
      const permutations: Interval[][] = [
        [input[0], input[1], input[2], input[3]],
        [input[3], input[2], input[1], input[0]],
        [input[2], input[0], input[3], input[1]],
        [input[1], input[3], input[0], input[2]],
      ];
      for (const p of permutations) {
        expect(mergeIntervals(p)).toEqual(expected);
      }
    });
  });

  describe("randomized invariants", () => {
    // Small deterministic PRNG so the test is reproducible.
    function makeRng(seed: number): () => number {
      let s = seed >>> 0;
      return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 2 ** 32;
      };
    }

    it("preserves coverage and satisfies output invariants", () => {
      const rng = makeRng(12345);

      for (let trial = 0; trial < 200; trial++) {
        const count = Math.floor(rng() * 12);
        const input: Interval[] = [];
        for (let i = 0; i < count; i++) {
          const start = Math.floor(rng() * 50) - 10;
          const length = Math.floor(rng() * 8);
          input.push([start, start + length]);
        }

        const result = mergeIntervals(input);

        checkInvariants(result);
        expect(result.length).toBeLessThanOrEqual(input.length);

        // Every point covered by the input is covered by the output and
        // vice versa (checked on a half-step grid to catch gaps).
        for (let x = -12; x <= 52; x += 0.5) {
          expect(covers(result, x)).toBe(covers(input, x));
        }

        // Every output endpoint comes from some input endpoint.
        for (const [s, e] of result) {
          expect(input.some(([is]) => is === s)).toBe(true);
          expect(input.some(([, ie]) => ie === e)).toBe(true);
        }
      }
    });
  });
});