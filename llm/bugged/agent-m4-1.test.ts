import { describe, it, expect } from "vitest";
import { mergeIntervals, type Interval } from "../../src/intervals";

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
          [2, 4],
          [2, 4],
        ]),
      ).toEqual([[2, 4]]);
    });

    it("merges a chain of overlapping intervals into one", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [2, 5],
          [4, 7],
          [6, 9],
        ]),
      ).toEqual([[1, 9]]);
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

    it("merges a zero-length interval sitting on another's endpoint", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 3],
        ]),
      ).toEqual([[1, 3]]);
    });
  });

  describe("disjoint intervals", () => {
    it("keeps intervals separated by a clear gap", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [10, 12],
        ]),
      ).toEqual([
        [1, 2],
        [10, 12],
      ]);
    });

    it("keeps intervals separated by a fractional gap", () => {
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

    it("merges only the groups that overlap", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [2, 4],
          [10, 12],
          [11, 15],
          [20, 21],
        ]),
      ).toEqual([
        [1, 4],
        [10, 15],
        [20, 21],
      ]);
    });
  });

  describe("ordering", () => {
    it("sorts unsorted input by start", () => {
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
          [6, 9],
          [1, 3],
          [2, 7],
        ]),
      ).toEqual([[1, 9]]);
    });

    it("handles negative numbers", () => {
      expect(
        mergeIntervals([
          [-1, 2],
          [-10, -5],
          [-6, -3],
        ]),
      ).toEqual([
        [-10, -3],
        [-1, 2],
      ]);
    });
  });

  describe("output invariants", () => {
    it("produces sorted output where no two blocks touch or overlap", () => {
      const input: Interval[] = [
        [5, 7],
        [0, 1],
        [1.5, 2],
        [7, 9],
        [3, 4],
        [8, 8],
        [-2, -1],
      ];
      const result = mergeIntervals(input);
      for (let i = 1; i < result.length; i++) {
        expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
      }
      for (const [start, end] of result) {
        expect(start).toBeLessThanOrEqual(end);
      }
    });

    it("covers every input interval with some output interval", () => {
      const input: Interval[] = [
        [4, 6],
        [1, 2],
        [5, 9],
        [12, 13],
      ];
      const result = mergeIntervals(input);
      for (const [start, end] of input) {
        expect(
          result.some(([s, e]) => s <= start && end <= e),
        ).toBe(true);
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

    it("returns intervals that are not the same objects as the input", () => {
      const a: Interval = [1, 2];
      const result = mergeIntervals([a]);
      expect(result[0]).not.toBe(a);
    });
  });
});
