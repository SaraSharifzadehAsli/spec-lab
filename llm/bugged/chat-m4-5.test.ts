import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";
import type { Interval } from "../../src/intervals";

describe("mergeIntervals", () => {
  describe("trivial inputs", () => {
    it("returns an empty array for empty input", () => {
      expect(mergeIntervals([])).toEqual([]);
    });

    it("returns a single interval unchanged", () => {
      expect(mergeIntervals([[3, 7]])).toEqual([[3, 7]]);
    });

    it("handles a zero-length interval", () => {
      expect(mergeIntervals([[5, 5]])).toEqual([[5, 5]]);
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

    it("keeps the larger end when a later-starting interval is contained", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [2, 3],
          [4, 12],
        ]),
      ).toEqual([[1, 12]]);
    });

    it("merges identical intervals", () => {
      expect(
        mergeIntervals([
          [2, 6],
          [2, 6],
          [2, 6],
        ]),
      ).toEqual([[2, 6]]);
    });

    it("merges intervals sharing the same start", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [1, 7],
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
  });

  describe("touching intervals", () => {
    it("merges intervals that share an endpoint", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 6],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("merges intervals on adjacent integers", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [4, 6],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("merges a zero-length interval adjacent to another", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [4, 4],
        ]),
      ).toEqual([[1, 4]]);
    });

    it("does not merge intervals separated by a gap of at least one integer", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [5, 6],
        ]),
      ).toEqual([
        [1, 3],
        [5, 6],
      ]);
    });
  });

  describe("ordering", () => {
    it("sorts disjoint intervals by start", () => {
      expect(
        mergeIntervals([
          [20, 25],
          [1, 2],
          [10, 12],
        ]),
      ).toEqual([
        [1, 2],
        [10, 12],
        [20, 25],
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

    it("merges when the overlapping interval appears first in input", () => {
      expect(
        mergeIntervals([
          [4, 9],
          [1, 5],
        ]),
      ).toEqual([[1, 9]]);
    });
  });

  describe("negative numbers", () => {
    it("handles negative intervals", () => {
      expect(
        mergeIntervals([
          [-10, -5],
          [-6, -1],
          [3, 4],
        ]),
      ).toEqual([
        [-10, -1],
        [3, 4],
      ]);
    });

    it("merges adjacent intervals across zero", () => {
      expect(
        mergeIntervals([
          [0, 2],
          [-3, -1],
        ]),
      ).toEqual([[-3, 2]]);
    });
  });

  describe("result invariants", () => {
    it("produces sorted output with no touching or overlapping blocks", () => {
      const input: Interval[] = [
        [30, 31],
        [5, 9],
        [1, 2],
        [10, 11],
        [14, 20],
        [15, 16],
        [25, 25],
        [3, 3],
      ];
      const result = mergeIntervals(input);

      expect(result).toEqual([
        [1, 11],
        [14, 20],
        [25, 25],
        [30, 31],
      ]);

      for (let i = 1; i < result.length; i++) {
        expect(result[i][0]).toBeGreaterThan(result[i - 1][1] + 1);
      }
      for (const [start, end] of result) {
        expect(start).toBeLessThanOrEqual(end);
      }
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

    it("returns new interval objects rather than input references", () => {
      const a: Interval = [1, 2];
      const b: Interval = [10, 12];
      const result = mergeIntervals([a, b]);

      expect(result).toEqual([
        [1, 2],
        [10, 12],
      ]);
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
});
