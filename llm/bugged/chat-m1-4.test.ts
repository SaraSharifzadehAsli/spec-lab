import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";
import type { Interval } from "../../src/intervals";

// NOTE: The "touching" tests below follow the documented contract ("overlaps or
// touches"). With the current implementation they FAIL, because the merge check
// uses `start < last[1]` instead of `start <= last[1]`, so blocks like [1, 3]
// and [3, 5] are left separate.

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

  describe("disjoint intervals", () => {
    it("keeps non-overlapping, non-touching intervals separate", () => {
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
  });

  describe("overlapping intervals", () => {
    it("merges two partially overlapping intervals", () => {
      expect(
        mergeIntervals([
          [1, 4],
          [3, 6],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("merges an interval fully contained in another", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [3, 5],
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

    it("merges identical intervals", () => {
      expect(
        mergeIntervals([
          [2, 5],
          [2, 5],
        ]),
      ).toEqual([[2, 5]]);
    });

    it("merges intervals sharing a start", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [1, 7],
        ]),
      ).toEqual([[1, 7]]);
    });

    it("merges a chain of overlapping intervals", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [2, 5],
          [4, 8],
          [7, 10],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("merges unsorted overlapping intervals", () => {
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
          [-5, -1],
          [-3, 2],
          [10, 12],
        ]),
      ).toEqual([
        [-5, 2],
        [10, 12],
      ]);
    });
  });

  describe("touching intervals", () => {
    it("merges two intervals where one ends exactly where the next starts", () => {
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
          [1, 2],
          [2, 3],
          [3, 4],
        ]),
      ).toEqual([[1, 4]]);
    });

    it("merges unsorted touching intervals", () => {
      expect(
        mergeIntervals([
          [5, 8],
          [1, 5],
        ]),
      ).toEqual([[1, 8]]);
    });

    it("merges a zero-length interval touching the end of another", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 3],
        ]),
      ).toEqual([[1, 3]]);
    });

    it("merges identical zero-length intervals", () => {
      expect(
        mergeIntervals([
          [2, 2],
          [2, 2],
        ]),
      ).toEqual([[2, 2]]);
    });
  });

  describe("output invariants", () => {
    const cases: Interval[][] = [
      [
        [5, 6],
        [1, 2],
        [3, 4],
      ],
      [
        [1, 3],
        [3, 5],
        [6, 8],
        [8, 8],
        [10, 12],
      ],
      [
        [9, 12],
        [-4, 0],
        [0, 1],
        [2, 9],
        [20, 21],
      ],
    ];

    it.each(cases)("result is sorted with no touching or overlapping blocks (%#)", (...input) => {
      const result = mergeIntervals(input);
      for (let i = 1; i < result.length; i++) {
        expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
      }
      for (const [start, end] of result) {
        expect(start).toBeLessThanOrEqual(end);
      }
    });

    it.each(cases)("every input interval is covered by some output interval (%#)", (...input) => {
      const result = mergeIntervals(input);
      for (const [s, e] of input) {
        expect(result.some(([rs, re]) => rs <= s && e <= re)).toBe(true);
      }
    });
  });

  describe("immutability", () => {
    it("does not mutate the input array or its intervals", () => {
      const input: [number, number][] = [
        [5, 8],
        [1, 4],
        [2, 6],
      ];
      const snapshot = input.map((iv) => [...iv]);
      mergeIntervals(input);
      expect(input).toEqual(snapshot);
    });

    it("returns new interval objects rather than input references", () => {
      const a: [number, number] = [1, 2];
      const b: [number, number] = [5, 6];
      const result = mergeIntervals([a, b]);
      expect(result[0]).not.toBe(a);
      expect(result[1]).not.toBe(b);
    });

    it("returns a new array even for empty input", () => {
      const input: Interval[] = [];
      expect(mergeIntervals(input)).not.toBe(input);
    });
  });
});
