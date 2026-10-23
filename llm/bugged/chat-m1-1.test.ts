import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";

// NOTE: The doc comment says blocks that "touch" must be merged, and that no two
// blocks in the result may touch. The implementation uses `start < last[1]`,
// which leaves touching blocks such as [1, 2] and [2, 3] separate. The
// "touching" tests below follow the documented contract and are expected to
// fail until the comparison is changed to `start <= last[1]`.

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

  describe("overlapping intervals", () => {
    it("merges two overlapping intervals", () => {
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
          [7, 10],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("merges identical intervals", () => {
      expect(
        mergeIntervals([
          [2, 5],
          [2, 5],
        ]),
      ).toEqual([[2, 5]]);
    });

    it("merges intervals that share a start", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [1, 7],
        ]),
      ).toEqual([[1, 7]]);
    });

    it("merges some groups and leaves others separate", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [2, 4],
          [6, 8],
          [7, 9],
          [12, 13],
        ]),
      ).toEqual([
        [1, 4],
        [6, 9],
        [12, 13],
      ]);
    });
  });

  describe("touching intervals", () => {
    it("merges two intervals that touch at an endpoint", () => {
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
        ]),
      ).toEqual([[0, 3]]);
    });

    it("merges a zero-length interval touching the end of another", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [2, 2],
        ]),
      ).toEqual([[1, 2]]);
    });

    it("never returns two blocks where one ends where the next starts", () => {
      const result = mergeIntervals([
        [5, 6],
        [1, 2],
        [2, 4],
        [6, 8],
        [10, 11],
      ]);
      for (let i = 1; i < result.length; i++) {
        expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
      }
    });
  });

  describe("ordering", () => {
    it("sorts unsorted input by start", () => {
      expect(
        mergeIntervals([
          [8, 9],
          [1, 2],
          [4, 5],
        ]),
      ).toEqual([
        [1, 2],
        [4, 5],
        [8, 9],
      ]);
    });

    it("merges overlapping intervals given out of order", () => {
      expect(
        mergeIntervals([
          [5, 8],
          [1, 3],
          [2, 6],
        ]),
      ).toEqual([[1, 8]]);
    });

    it("handles negative numbers", () => {
      expect(
        mergeIntervals([
          [-1, 2],
          [-5, -3],
          [-4, -2],
        ]),
      ).toEqual([
        [-5, -2],
        [-1, 2],
      ]);
    });
  });

  describe("zero-length intervals", () => {
    it("keeps an isolated zero-length interval", () => {
      expect(mergeIntervals([[3, 3]])).toEqual([[3, 3]]);
    });

    it("absorbs a zero-length interval inside another", () => {
      expect(
        mergeIntervals([
          [1, 5],
          [3, 3],
        ]),
      ).toEqual([[1, 5]]);
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
      const a: [number, number] = [1, 2];
      const result = mergeIntervals([a]);
      expect(result[0]).toEqual(a);
      expect(result[0]).not.toBe(a);
    });
  });
});
