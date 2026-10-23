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

    it("handles a zero-length interval", () => {
      expect(mergeIntervals([[4, 4]])).toEqual([[4, 4]]);
    });
  });

  describe("non-overlapping intervals", () => {
    it("keeps intervals separated by a gap", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [5, 6],
        ]),
      ).toEqual([
        [1, 2],
        [5, 6],
      ]);
    });

    it("keeps intervals separated by exactly one missing integer", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [5, 7],
        ]),
      ).toEqual([
        [1, 3],
        [5, 7],
      ]);
    });

    it("sorts unsorted non-overlapping intervals by start", () => {
      expect(
        mergeIntervals([
          [10, 12],
          [1, 2],
          [5, 6],
        ]),
      ).toEqual([
        [1, 2],
        [5, 6],
        [10, 12],
      ]);
    });
  });

  describe("overlapping intervals", () => {
    it("merges two partially overlapping intervals", () => {
      expect(
        mergeIntervals([
          [1, 5],
          [3, 8],
        ]),
      ).toEqual([[1, 8]]);
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
          [4, 12],
        ]),
      ).toEqual([[1, 12]]);
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

    it("merges intervals with the same start but different ends", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [1, 7],
          [1, 2],
        ]),
      ).toEqual([[1, 7]]);
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

    it("merges a zero-length interval inside another", () => {
      expect(
        mergeIntervals([
          [1, 5],
          [3, 3],
        ]),
      ).toEqual([[1, 5]]);
    });
  });

  describe("touching intervals", () => {
    it("merges intervals sharing an endpoint", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 5],
        ]),
      ).toEqual([[1, 5]]);
    });

    it("merges adjacent intervals (end + 1 === next start)", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [4, 6],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("merges a chain of adjacent intervals", () => {
      expect(
        mergeIntervals([
          [5, 5],
          [1, 2],
          [3, 4],
          [6, 9],
        ]),
      ).toEqual([[1, 9]]);
    });
  });

  describe("negative and zero values", () => {
    it("handles negative intervals", () => {
      expect(
        mergeIntervals([
          [-5, -3],
          [-10, -6],
          [0, 2],
        ]),
      ).toEqual([
        [-10, -3],
        [0, 2],
      ]);
    });

    it("merges across zero", () => {
      expect(
        mergeIntervals([
          [-3, -1],
          [0, 4],
        ]),
      ).toEqual([[-3, 4]]);
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

    it("returns new interval arrays, not references to the input", () => {
      const a: Interval = [1, 2];
      const result = mergeIntervals([a]);

      expect(result[0]).toEqual([1, 2]);
      expect(result[0]).not.toBe(a);
    });

    it("works with frozen input", () => {
      const input = Object.freeze([
        Object.freeze([3, 4] as const),
        Object.freeze([1, 2] as const),
      ]);

      expect(mergeIntervals(input)).toEqual([[1, 4]]);
    });
  });

  describe("output invariants", () => {
    it("produces sorted output with no touching or overlapping blocks", () => {
      const input: Interval[] = [
        [20, 25],
        [1, 4],
        [30, 30],
        [6, 9],
        [3, 5],
        [12, 14],
        [26, 28],
        [10, 10],
      ];

      const result = mergeIntervals(input);

      for (const [start, end] of result) {
        expect(start).toBeLessThanOrEqual(end);
      }
      for (let i = 1; i < result.length; i++) {
        expect(result[i][0]).toBeGreaterThan(result[i - 1][1] + 1);
      }
      expect(result).toEqual([
        [1, 10],
        [12, 14],
        [20, 28],
        [30, 30],
      ]);
    });
  });
});
