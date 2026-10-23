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
      expect(mergeIntervals([[3, 3]])).toEqual([[3, 3]]);
    });
  });

  describe("non-overlapping intervals", () => {
    it("keeps intervals separated by a gap", () => {
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

    it("merges intervals that share an endpoint", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 6],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("absorbs an interval fully contained in another", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [3, 4],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("keeps the larger end when a contained interval comes later", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [2, 3],
          [4, 5],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("merges duplicate intervals", () => {
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

    it("merges overlapping intervals given in unsorted order", () => {
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

    it("handles intervals with the same start", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [1, 7],
          [1, 4],
        ]),
      ).toEqual([[1, 7]]);
    });
  });

  describe("touching (adjacent) intervals", () => {
    it("merges intervals where one starts right after the other ends", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [3, 4],
        ]),
      ).toEqual([[1, 4]]);
    });

    it("merges a run of adjacent single-point intervals", () => {
      expect(
        mergeIntervals([
          [3, 3],
          [1, 1],
          [2, 2],
        ]),
      ).toEqual([[1, 3]]);
    });

    it("does not merge intervals separated by a gap of one", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [4, 5],
        ]),
      ).toEqual([
        [1, 2],
        [4, 5],
      ]);
    });
  });

  describe("negative numbers", () => {
    it("merges and sorts intervals with negative bounds", () => {
      expect(
        mergeIntervals([
          [0, 2],
          [-5, -3],
          [-2, -1],
          [-10, -8],
        ]),
      ).toEqual([
        [-10, -8],
        [-5, 2],
      ]);
    });
  });

  describe("result invariants", () => {
    it("produces output sorted by start with no touching or overlapping blocks", () => {
      const input: Interval[] = [
        [20, 25],
        [1, 4],
        [6, 8],
        [3, 5],
        [12, 14],
        [9, 10],
        [30, 30],
        [15, 18],
      ];
      const result = mergeIntervals(input);

      for (let i = 1; i < result.length; i++) {
        const prev = result[i - 1]!;
        const curr = result[i]!;
        expect(curr[0]).toBeGreaterThan(prev[0]);
        expect(curr[0]).toBeGreaterThan(prev[1] + 1);
      }
      for (const [start, end] of result) {
        expect(start).toBeLessThanOrEqual(end);
      }
    });

    it("covers exactly the same integer points as the input", () => {
      const input: Interval[] = [
        [5, 7],
        [1, 2],
        [10, 11],
        [3, 3],
        [6, 9],
      ];
      const result = mergeIntervals(input);

      const points = (ivs: readonly Interval[]): Set<number> => {
        const s = new Set<number>();
        for (const [a, b] of ivs) {
          for (let x = a; x <= b; x++) s.add(x);
        }
        return s;
      };

      expect([...points(result)].sort((a, b) => a - b)).toEqual(
        [...points(input)].sort((a, b) => a - b),
      );
    });
  });

  describe("immutability", () => {
    it("does not mutate the input array or its intervals", () => {
      const input: [number, number][] = [
        [5, 8],
        [1, 3],
        [2, 6],
      ];
      const snapshot = input.map((iv) => [...iv]);

      mergeIntervals(input);

      expect(input).toEqual(snapshot);
    });

    it("returns intervals that are not the same objects as the input", () => {
      const a: [number, number] = [1, 3];
      const input: Interval[] = [a];
      const result = mergeIntervals(input);

      expect(result[0]).toEqual([1, 3]);
      expect(result[0]).not.toBe(a);
      expect(result).not.toBe(input);
    });
  });
});
