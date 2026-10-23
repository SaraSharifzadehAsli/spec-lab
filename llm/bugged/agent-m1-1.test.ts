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
        [1, 3],
        [2, 6],
        [8, 10],
      ]),
    ).toEqual([
      [1, 6],
      [8, 10],
    ]);
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
        [2, 3],
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

  it("merges duplicate intervals", () => {
    expect(
      mergeIntervals([
        [1, 4],
        [1, 4],
      ]),
    ).toEqual([[1, 4]]);
  });

  it("handles zero-length intervals", () => {
    expect(
      mergeIntervals([
        [3, 3],
        [5, 5],
      ]),
    ).toEqual([
      [3, 3],
      [5, 5],
    ]);
  });

  it("merges a zero-length interval touching another", () => {
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
        [-3, 0],
        [2, 4],
      ]),
    ).toEqual([
      [-5, 0],
      [2, 4],
    ]);
  });

  it("does not mutate the input", () => {
    const input: Interval[] = [
      [5, 6],
      [1, 3],
      [2, 4],
    ];
    const snapshot = input.map((iv) => [...iv]);
    mergeIntervals(input);
    expect(input).toEqual(snapshot);
  });

  it("returns new interval objects, not references to the input", () => {
    const a: Interval = [1, 2];
    const result = mergeIntervals([a]);
    expect(result[0]).not.toBe(a);
  });

  it("produces output where no two intervals touch or overlap", () => {
    const result = mergeIntervals([
      [10, 12],
      [1, 2],
      [2, 5],
      [12, 14],
      [6, 7],
      [4, 6],
    ]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
  });
});
