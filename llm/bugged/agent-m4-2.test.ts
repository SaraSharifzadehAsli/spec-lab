import { describe, it, expect } from "vitest";
import { mergeIntervals, type Interval } from "../../src/intervals";

describe("mergeIntervals", () => {
  it("returns an empty array for empty input", () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it("returns a single interval unchanged", () => {
    expect(mergeIntervals([[1, 5]])).toEqual([[1, 5]]);
  });

  it("keeps a zero-length interval", () => {
    expect(mergeIntervals([[3, 3]])).toEqual([[3, 3]]);
  });

  it("merges two overlapping intervals", () => {
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

  it("keeps intervals separated by a clear gap apart", () => {
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

  it("absorbs an interval fully contained in another", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [3, 4],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("keeps the larger end when a contained interval comes after", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 3],
        [4, 12],
      ]),
    ).toEqual([[1, 12]]);
  });

  it("sorts unsorted input by start", () => {
    expect(
      mergeIntervals([
        [20, 25],
        [1, 3],
        [10, 12],
      ]),
    ).toEqual([
      [1, 3],
      [10, 12],
      [20, 25],
    ]);
  });

  it("merges a chain of overlapping intervals given out of order", () => {
    expect(
      mergeIntervals([
        [8, 10],
        [1, 4],
        [3, 6],
        [5, 9],
        [15, 18],
      ]),
    ).toEqual([
      [1, 10],
      [15, 18],
    ]);
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

  it("handles negative numbers", () => {
    expect(
      mergeIntervals([
        [-10, -5],
        [-6, 0],
        [-20, -15],
      ]),
    ).toEqual([
      [-20, -15],
      [-10, 0],
    ]);
  });

  it("does not mutate the input array or its intervals", () => {
    const input: [number, number][] = [
      [5, 8],
      [1, 6],
    ];
    const snapshot = input.map((iv) => [...iv]);
    mergeIntervals(input);
    expect(input).toEqual(snapshot);
  });

  it("returns intervals that are new objects, not input references", () => {
    const a: Interval = [1, 2];
    const result = mergeIntervals([a]);
    expect(result[0]).toEqual(a);
    expect(result[0]).not.toBe(a);
  });

  it("produces sorted output with no overlapping intervals", () => {
    const input: Interval[] = [
      [30, 40],
      [5, 7],
      [100, 101],
      [6, 20],
      [35, 50],
      [0, 1],
      [60, 60],
    ];
    const result = mergeIntervals(input);
    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
    for (const [start, end] of result) {
      expect(start).toBeLessThanOrEqual(end);
    }
  });
});
