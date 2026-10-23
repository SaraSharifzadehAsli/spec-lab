import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";
import type { Interval } from "../../src/intervals";

// NOTE: the doc comment says blocks that *touch* (e.g. [1, 3] and [3, 5]) must
// be merged, but the implementation uses `start < last[1]`. The "touching"
// tests below are expected to fail until that comparison becomes `<=`.

describe("mergeIntervals", () => {
  describe("basic cases", () => {
    it("returns an empty array for empty input", () => {
      expect(mergeIntervals([])).toEqual([]);
    });

    it("returns a single interval unchanged", () => {
      expect(mergeIntervals([[1, 5]])).toEqual([[1, 5]]);
    });

    it("keeps disjoint intervals separate", () => {
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
  });

  describe("overlapping", () => {
    it("merges two overlapping intervals", () => {
      expect(
        mergeIntervals([
          [1, 4],
          [2, 6],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("merges an interval fully contained in another", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [3, 4],
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

    it("merges intervals sharing the same start", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [1, 7],
          [1, 2],
        ]),
      ).toEqual([[1, 7]]);
    });
  });

  describe("touching", () => {
    it("merges two intervals that touch at an endpoint", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 5],
        ]),
      ).toEqual([[1, 5]]);
    });

    it("merges a chain of touching intervals", () => {
      expect(
        mergeIntervals([
          [0, 1],
          [1, 2],
          [2, 3],
        ]),
      ).toEqual([[0, 3]]);
    });

    it("merges a zero-length interval sitting on another's end", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 3],
        ]),
      ).toEqual([[1, 3]]);
    });

    it("merges a zero-length interval sitting on another's start", () => {
      expect(
        mergeIntervals([
          [3, 3],
          [3, 6],
        ]),
      ).toEqual([[3, 6]]);
    });

    it("merges touching intervals given out of order", () => {
      expect(
        mergeIntervals([
          [5, 8],
          [1, 5],
        ]),
      ).toEqual([[1, 8]]);
    });
  });

  describe("ordering", () => {
    it("sorts unsorted disjoint intervals by start", () => {
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

    it("merges overlapping intervals given out of order", () => {
      expect(
        mergeIntervals([
          [8, 10],
          [1, 3],
          [2, 6],
          [15, 18],
        ]),
      ).toEqual([
        [1, 6],
        [8, 10],
        [15, 18],
      ]);
    });

    it("handles negative numbers", () => {
      expect(
        mergeIntervals([
          [-5, -2],
          [-10, -6],
          [-3, 1],
        ]),
      ).toEqual([
        [-10, -6],
        [-5, 1],
      ]);
    });

    it("handles non-integer values", () => {
      expect(
        mergeIntervals([
          [0.5, 1.5],
          [1.25, 2.75],
        ]),
      ).toEqual([[0.5, 2.75]]);
    });
  });

  describe("result invariants", () => {
    const input: Interval[] = [
      [10, 12],
      [1, 3],
      [2, 4],
      [6, 6],
      [4, 5],
      [20, 25],
      [11, 15],
      [-3, -1],
    ];

    it("returns intervals sorted by start", () => {
      const result = mergeIntervals(input);
      for (let i = 1; i < result.length; i++) {
        expect(result[i][0]).toBeGreaterThanOrEqual(result[i - 1][0]);
      }
    });

    it("returns intervals that neither touch nor overlap", () => {
      const result = mergeIntervals(input);
      for (let i = 1; i < result.length; i++) {
        expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
      }
    });

    it("returns intervals with start <= end", () => {
      for (const [start, end] of mergeIntervals(input)) {
        expect(start).toBeLessThanOrEqual(end);
      }
    });

    it("covers every input interval", () => {
      const result = mergeIntervals(input);
      for (const [start, end] of input) {
        const covered = result.some(([s, e]) => s <= start && end <= e);
        expect(covered).toBe(true);
      }
    });

    it("is idempotent", () => {
      const once = mergeIntervals(input);
      expect(mergeIntervals(once)).toEqual(once);
    });
  });

  describe("immutability", () => {
    it("does not mutate the input array or its intervals", () => {
      const input: Interval[] = [
        [5, 8],
        [1, 3],
        [2, 6],
      ];
      const snapshot = input.map((iv) => [...iv]);

      mergeIntervals(input);

      expect(input).toEqual(snapshot);
    });

    it("does not return interval objects shared with the input", () => {
      const a: Interval = [1, 2];
      const input: Interval[] = [a];

      const result = mergeIntervals(input);

      expect(result[0]).toEqual([1, 2]);
      expect(result[0]).not.toBe(a);
    });

    it("returns a new array", () => {
      const input: Interval[] = [[1, 2]];
      expect(mergeIntervals(input)).not.toBe(input);
    });
  });
});
