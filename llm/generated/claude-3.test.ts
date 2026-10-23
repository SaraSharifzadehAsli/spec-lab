import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";
import type { Interval } from "../../src/intervals";

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

  describe("merging", () => {
    it("merges two overlapping intervals", () => {
      expect(
        mergeIntervals([
          [1, 4],
          [3, 6],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("merges intervals that touch at an endpoint", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 5],
        ]),
      ).toEqual([[1, 5]]);
    });

    it("merges a zero-length interval touching another interval", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 3],
        ]),
      ).toEqual([[1, 3]]);
      expect(
        mergeIntervals([
          [5, 5],
          [5, 8],
        ]),
      ).toEqual([[5, 8]]);
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
          [4, 7],
          [7, 9],
        ]),
      ).toEqual([[1, 9]]);
    });

    it("merges identical intervals", () => {
      expect(
        mergeIntervals([
          [2, 4],
          [2, 4],
          [2, 4],
        ]),
      ).toEqual([[2, 4]]);
    });

    it("merges intervals sharing the same start regardless of order", () => {
      expect(
        mergeIntervals([
          [1, 5],
          [1, 2],
        ]),
      ).toEqual([[1, 5]]);
      expect(
        mergeIntervals([
          [1, 2],
          [1, 5],
        ]),
      ).toEqual([[1, 5]]);
    });
  });

  describe("non-merging", () => {
    it("keeps intervals separated by a gap", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [3, 4],
        ]),
      ).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it("keeps intervals separated by a tiny fractional gap", () => {
      expect(
        mergeIntervals([
          [0, 1],
          [1.5, 2],
        ]),
      ).toEqual([
        [0, 1],
        [1.5, 2],
      ]);
    });

    it("keeps separate zero-length intervals at different points", () => {
      expect(
        mergeIntervals([
          [1, 1],
          [2, 2],
        ]),
      ).toEqual([
        [1, 1],
        [2, 2],
      ]);
    });
  });

  describe("ordering", () => {
    it("sorts unsorted input by start", () => {
      expect(
        mergeIntervals([
          [8, 10],
          [1, 2],
          [4, 5],
        ]),
      ).toEqual([
        [1, 2],
        [4, 5],
        [8, 10],
      ]);
    });

    it("merges overlapping intervals that are given out of order", () => {
      expect(
        mergeIntervals([
          [6, 8],
          [1, 3],
          [2, 4],
          [7, 9],
        ]),
      ).toEqual([
        [1, 4],
        [6, 9],
      ]);
    });

    it("handles intervals given in reverse order", () => {
      expect(
        mergeIntervals([
          [9, 10],
          [5, 9],
          [1, 5],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("handles negative numbers", () => {
      expect(
        mergeIntervals([
          [-1, 2],
          [-10, -5],
          [-5, -3],
        ]),
      ).toEqual([
        [-10, -3],
        [-1, 2],
      ]);
    });
  });

  describe("purity", () => {
    it("does not mutate the input array or its intervals", () => {
      const input: Interval[] = [
        [5, 7],
        [1, 3],
        [2, 6],
      ];
      const snapshot = input.map((iv) => [iv[0], iv[1]]);

      mergeIntervals(input);

      expect(input).toEqual(snapshot);
    });

    it("works with deeply frozen input", () => {
      const input = Object.freeze([
        Object.freeze([3, 4] as const),
        Object.freeze([1, 3] as const),
      ]);

      expect(() => mergeIntervals(input)).not.toThrow();
      expect(mergeIntervals(input)).toEqual([[1, 4]]);
    });

    it("returns new interval objects, not references to the input", () => {
      const a: Interval = [1, 2];
      const b: Interval = [5, 6];
      const result = mergeIntervals([a, b]);

      expect(result).toEqual([a, b]);
      expect(result[0]).not.toBe(a);
      expect(result[1]).not.toBe(b);
    });

    it("returns a new array even for a single interval", () => {
      const input: Interval[] = [[1, 2]];
      const result = mergeIntervals(input);

      expect(result).not.toBe(input);
      expect(result[0]).not.toBe(input[0]);
    });
  });

  describe("invariants on generated inputs", () => {
    function makeRng(seed: number): () => number {
      let s = seed >>> 0;
      return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 0x100000000;
      };
    }

    function randomIntervals(rng: () => number): Interval[] {
      const count = Math.floor(rng() * 12);
      const out: Interval[] = [];
      for (let i = 0; i < count; i++) {
        const start = Math.floor(rng() * 40) - 10;
        const length = Math.floor(rng() * 6);
        out.push([start, start + length]);
      }
      return out;
    }

    function covers(intervals: readonly Interval[], x: number): boolean {
      return intervals.some(([s, e]) => s <= x && x <= e);
    }

    it("produces sorted, non-touching output covering exactly the same points", () => {
      const rng = makeRng(12345);

      for (let trial = 0; trial < 500; trial++) {
        const input = randomIntervals(rng);
        const result = mergeIntervals(input);

        // Every output interval is well-formed.
        for (const [s, e] of result) {
          expect(s).toBeLessThanOrEqual(e);
        }

        // Sorted by start, and no two blocks touch or overlap.
        for (let i = 1; i < result.length; i++) {
          expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
        }

        // Every input interval lies inside some output interval.
        for (const [s, e] of input) {
          expect(result.some(([rs, re]) => rs <= s && e <= re)).toBe(true);
        }

        // Output endpoints come from the input.
        for (const [s, e] of result) {
          expect(input.some((iv) => iv[0] === s)).toBe(true);
          expect(input.some((iv) => iv[1] === e)).toBe(true);
        }

        // Same coverage at every integer and half-integer point in range.
        for (let x = -12; x <= 50; x += 0.5) {
          expect(covers(result, x)).toBe(covers(input, x));
        }

        // Output count never exceeds input count.
        expect(result.length).toBeLessThanOrEqual(input.length);
      }
    });

    it("is idempotent", () => {
      const rng = makeRng(987654321);

      for (let trial = 0; trial < 200; trial++) {
        const once = mergeIntervals(randomIntervals(rng));
        expect(mergeIntervals(once)).toEqual(once);
      }
    });

    it("does not depend on input order", () => {
      const rng = makeRng(42);

      for (let trial = 0; trial < 200; trial++) {
        const input = randomIntervals(rng);
        const reversed = [...input].reverse();
        expect(mergeIntervals(reversed)).toEqual(mergeIntervals(input));
      }
    });
  });
});