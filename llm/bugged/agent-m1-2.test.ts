import { describe, it, expect } from "vitest";
import { mergeIntervals, type Interval } from "../../src/intervals";

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
      ]),
    ).toEqual([
      [1, 2],
      [4, 5],
    ]);
  });

  it("merges overlapping intervals", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [2, 6],
      ]),
    ).toEqual([[1, 6]]);
  });

  it("merges intervals that touch at an endpoint", () => {
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

  it("merges an interval fully contained in another", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [3, 4],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("sorts unsorted input by start", () => {
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

  it("handles zero-length intervals", () => {
    expect(
      mergeIntervals([
        [5, 5],
        [1, 2],
      ]),
    ).toEqual([
      [1, 2],
      [5, 5],
    ]);
  });

  it("merges a zero-length interval touching another", () => {
    expect(
      mergeIntervals([
        [2, 2],
        [1, 2],
      ]),
    ).toEqual([[1, 2]]);
  });

  it("merges duplicate intervals", () => {
    expect(
      mergeIntervals([
        [1, 4],
        [1, 4],
      ]),
    ).toEqual([[1, 4]]);
  });

  it("handles negative numbers", () => {
    expect(
      mergeIntervals([
        [-5, -2],
        [-3, 1],
        [3, 4],
      ]),
    ).toEqual([
      [-5, 1],
      [3, 4],
    ]);
  });

  it("does not mutate the input", () => {
    const input: Interval[] = [
      [3, 5],
      [1, 4],
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

  it("produces sorted output with no touching or overlapping blocks", () => {
    const input: Interval[] = [
      [10, 12],
      [0, 1],
      [5, 7],
      [1, 3],
      [7, 8],
      [11, 15],
      [20, 20],
    ];
    const result = mergeIntervals(input);
    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
    expect(result).toEqual([
      [0, 3],
      [5, 8],
      [10, 15],
      [20, 20],
    ]);
  });
});
