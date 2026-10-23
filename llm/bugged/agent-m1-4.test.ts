import { describe, it, expect } from "vitest";
import { mergeIntervals, type Interval } from "../../src/intervals";

describe("mergeIntervals", () => {
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

  it("merges overlapping intervals", () => {
    expect(
      mergeIntervals([
        [1, 4],
        [3, 6],
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
        [1, 2],
        [2, 3],
        [3, 4],
      ]),
    ).toEqual([[1, 4]]);
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
        [5, 6],
      ]),
    ).toEqual([
      [1, 3],
      [5, 6],
      [8, 10],
    ]);
  });

  it("merges overlaps in unsorted input", () => {
    expect(
      mergeIntervals([
        [15, 18],
        [2, 6],
        [8, 10],
        [1, 3],
      ]),
    ).toEqual([
      [1, 6],
      [8, 10],
      [15, 18],
    ]);
  });

  it("merges duplicate intervals", () => {
    expect(
      mergeIntervals([
        [2, 5],
        [2, 5],
      ]),
    ).toEqual([[2, 5]]);
  });

  it("handles zero-length intervals", () => {
    expect(mergeIntervals([[3, 3]])).toEqual([[3, 3]]);
    expect(
      mergeIntervals([
        [1, 3],
        [3, 3],
      ]),
    ).toEqual([[1, 3]]);
  });

  it("handles negative numbers", () => {
    expect(
      mergeIntervals([
        [-5, -2],
        [-3, 1],
        [4, 6],
      ]),
    ).toEqual([
      [-5, 1],
      [4, 6],
    ]);
  });

  it("does not mutate the input", () => {
    const input: Interval[] = [
      [5, 8],
      [1, 6],
    ];
    const snapshot = input.map((iv) => [...iv]);
    mergeIntervals(input);
    expect(input).toEqual(snapshot);
  });

  it("returns interval arrays that are not the input's arrays", () => {
    const a: Interval = [1, 2];
    const result = mergeIntervals([a]);
    expect(result[0]).not.toBe(a);
  });

  it("produces output where no two intervals touch or overlap", () => {
    const result = mergeIntervals([
      [10, 12],
      [1, 3],
      [3, 5],
      [6, 7],
      [7, 9],
      [11, 15],
      [20, 20],
    ]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
  });
});
