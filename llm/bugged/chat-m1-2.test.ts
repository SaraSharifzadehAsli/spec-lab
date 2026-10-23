import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";

describe("mergeIntervals", () => {
  it("returns an empty array for empty input", () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it("returns a single interval unchanged", () => {
    expect(mergeIntervals([[1, 3]])).toEqual([[1, 3]]);
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

  it("merges overlapping intervals", () => {
    expect(
      mergeIntervals([
        [1, 4],
        [2, 6],
      ]),
    ).toEqual([[1, 6]]);
  });

  // NOTE: the docs say touching blocks merge, but the implementation uses
  // `start < last[1]` instead of `start <= last[1]`, so the touching cases
  // below fail against the current code.
  it("merges intervals that touch at an endpoint", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [3, 5],
      ]),
    ).toEqual([[1, 5]]);
  });

  it("merges a zero-length interval touching the end of another", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [3, 3],
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

  it("absorbs intervals fully contained in another", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 3],
        [4, 5],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("does not shrink the end when a later interval ends earlier", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 4],
        [9, 12],
      ]),
    ).toEqual([[1, 12]]);
  });

  it("sorts unsorted input before merging", () => {
    expect(
      mergeIntervals([
        [8, 10],
        [1, 3],
        [2, 4],
        [15, 18],
      ]),
    ).toEqual([
      [1, 4],
      [8, 10],
      [15, 18],
    ]);
  });

  it("merges intervals that share a start", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [1, 5],
      ]),
    ).toEqual([[1, 5]]);
  });

  it("merges an interval that bridges two earlier gaps", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [5, 6],
        [1.5, 5.5],
      ]),
    ).toEqual([[1, 6]]);
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

  it("handles zero-length intervals that do not touch anything", () => {
    expect(
      mergeIntervals([
        [5, 5],
        [1, 1],
      ]),
    ).toEqual([
      [1, 1],
      [5, 5],
    ]);
  });

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
    const result = mergeIntervals([a]);

    expect(result[0]).not.toBe(a);
  });

  it("produces sorted output with no touching or overlapping blocks", () => {
    const result = mergeIntervals([
      [20, 25],
      [3, 7],
      [1, 3],
      [10, 12],
      [6, 9],
      [12, 14],
      [30, 30],
    ]);

    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
    for (const [start, end] of result) {
      expect(start).toBeLessThanOrEqual(end);
    }
  });
});
