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

  it("merges a chain of touching intervals into one", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [2, 3],
        [3, 4],
      ]),
    ).toEqual([[1, 4]]);
  });

  it("absorbs an interval fully contained in another", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [3, 4],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("does not shrink the end when a later interval ends earlier", () => {
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

  it("merges overlapping intervals given out of order", () => {
    expect(
      mergeIntervals([
        [5, 8],
        [1, 3],
        [2, 6],
      ]),
    ).toEqual([[1, 8]]);
  });

  it("handles zero-length intervals", () => {
    expect(
      mergeIntervals([
        [3, 3],
        [1, 2],
      ]),
    ).toEqual([
      [1, 2],
      [3, 3],
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

  it("merges duplicate intervals", () => {
    expect(
      mergeIntervals([
        [2, 4],
        [2, 4],
      ]),
    ).toEqual([[2, 4]]);
  });

  it("handles negative numbers", () => {
    expect(
      mergeIntervals([
        [-5, -1],
        [-3, 2],
        [4, 6],
      ]),
    ).toEqual([
      [-5, 2],
      [4, 6],
    ]);
  });

  it("does not mutate the input array or its intervals", () => {
    const a: [number, number] = [3, 6];
    const b: [number, number] = [1, 4];
    const input: Interval[] = [a, b];

    mergeIntervals(input);

    expect(input).toEqual([
      [3, 6],
      [1, 4],
    ]);
    expect(input[0]).toBe(a);
    expect(input[1]).toBe(b);
  });

  it("returns intervals that are not the same objects as the input", () => {
    const iv: Interval = [1, 2];
    const result = mergeIntervals([iv]);
    expect(result[0]).not.toBe(iv);
  });

  it("produces sorted output where no two intervals touch or overlap", () => {
    const result = mergeIntervals([
      [10, 12],
      [0, 1],
      [5, 7],
      [1, 2],
      [6, 9],
      [12, 15],
      [20, 20],
    ]);

    expect(result).toEqual([
      [0, 2],
      [5, 9],
      [10, 15],
      [20, 20],
    ]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
  });
});
