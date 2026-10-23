import { describe, it, expect } from "vitest";
import { mergeIntervals, type Interval } from "../../src/intervals";

describe("mergeIntervals", () => {
  it("returns an empty array for empty input", () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it("returns a single interval unchanged", () => {
    expect(mergeIntervals([[1, 3]])).toEqual([[1, 3]]);
  });

  it("keeps disjoint intervals separate and sorts them by start", () => {
    expect(
      mergeIntervals([
        [8, 10],
        [1, 2],
        [4, 6],
      ]),
    ).toEqual([
      [1, 2],
      [4, 6],
      [8, 10],
    ]);
  });

  it("merges overlapping intervals", () => {
    expect(
      mergeIntervals([
        [1, 4],
        [3, 6],
      ]),
    ).toEqual([[1, 6]]);
  });

  it("merges a chain of overlapping intervals into one", () => {
    expect(
      mergeIntervals([
        [5, 8],
        [1, 3],
        [2, 6],
        [7, 9],
      ]),
    ).toEqual([[1, 9]]);
  });

  it("absorbs an interval fully contained in another", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 3],
        [4, 5],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("merges intervals sharing the same start regardless of order", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [1, 5],
      ]),
    ).toEqual([[1, 5]]);
    expect(
      mergeIntervals([
        [1, 5],
        [1, 2],
      ]),
    ).toEqual([[1, 5]]);
  });

  // The doc comment says blocks that *touch* are merged. The current
  // implementation compares with `start < last[1]` rather than `<=`,
  // so these two tests are expected to fail until that is fixed.
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
        [3, 3],
        [1, 3],
      ]),
    ).toEqual([[1, 3]]);
    expect(
      mergeIntervals([
        [1, 1],
        [1, 4],
      ]),
    ).toEqual([[1, 4]]);
  });

  it("handles negative numbers", () => {
    expect(
      mergeIntervals([
        [-5, -2],
        [-3, 0],
        [2, 4],
      ]),
    ).toEqual([
      [-5, 0],
      [2, 4],
    ]);
  });

  it("does not mutate the input array or its intervals", () => {
    const a: Interval = [4, 6];
    const b: Interval = [1, 5];
    const input: Interval[] = [a, b];

    mergeIntervals(input);

    expect(input).toEqual([
      [4, 6],
      [1, 5],
    ]);
    expect(input[0]).toBe(a);
    expect(input[1]).toBe(b);
  });

  it("returns new interval objects rather than input references", () => {
    const iv: Interval = [1, 2];
    const result = mergeIntervals([iv]);
    expect(result[0]).toEqual([1, 2]);
    expect(result[0]).not.toBe(iv);
  });

  it("produces sorted output with no touching or overlapping blocks", () => {
    const input: Interval[] = [
      [10, 12],
      [0, 1],
      [2, 4],
      [4, 7],
      [11, 15],
      [20, 20],
      [6, 8],
      [16, 18],
    ];
    const result = mergeIntervals(input);

    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
    for (const [start, end] of result) {
      expect(start).toBeLessThanOrEqual(end);
    }
    // Every input interval is covered by some output interval.
    for (const [s, e] of input) {
      expect(result.some(([rs, re]) => rs <= s && e <= re)).toBe(true);
    }
  });
});
