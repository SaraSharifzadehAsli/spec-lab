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

  it("merges overlapping intervals", () => {
    expect(
      mergeIntervals([
        [1, 5],
        [3, 8],
      ]),
    ).toEqual([[1, 8]]);
  });

  it("merges intervals that touch at an endpoint", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [3, 6],
      ]),
    ).toEqual([[1, 6]]);
  });

  it("merges an interval fully contained in another", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 4],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("merges identical intervals", () => {
    expect(
      mergeIntervals([
        [2, 4],
        [2, 4],
      ]),
    ).toEqual([[2, 4]]);
  });

  it("keeps clearly separate intervals apart", () => {
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

  it("merges a chain of overlaps given in any order", () => {
    expect(
      mergeIntervals([
        [8, 12],
        [1, 4],
        [3, 9],
        [20, 22],
      ]),
    ).toEqual([
      [1, 12],
      [20, 22],
    ]);
  });

  it("does not shrink the end when a later interval ends earlier", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 3],
        [4, 5],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("handles negative numbers", () => {
    expect(
      mergeIntervals([
        [-5, -2],
        [-3, 0],
        [10, 11],
      ]),
    ).toEqual([
      [-5, 0],
      [10, 11],
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

  it("returns new interval objects, not the input ones", () => {
    const a: Interval = [1, 2];
    const result = mergeIntervals([a]);
    expect(result[0]).not.toBe(a);
  });

  it("produces output where no two blocks touch or overlap", () => {
    const result = mergeIntervals([
      [15, 18],
      [1, 3],
      [2, 6],
      [8, 10],
      [10, 11],
      [30, 31],
    ]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
    expect(result).toEqual([
      [1, 6],
      [8, 11],
      [15, 18],
      [30, 31],
    ]);
  });
});
