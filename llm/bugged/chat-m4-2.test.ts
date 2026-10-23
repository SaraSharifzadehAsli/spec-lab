import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";

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

  it("merges intervals that share an endpoint", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [3, 5],
      ]),
    ).toEqual([[1, 5]]);
  });

  it("merges adjacent integer intervals with no gap between them", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([[1, 4]]);
  });

  it("does not merge intervals separated by a gap of at least one integer", () => {
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

  it("absorbs an interval fully contained in another", () => {
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

  it("sorts unsorted input by start", () => {
    expect(
      mergeIntervals([
        [10, 12],
        [1, 2],
        [5, 6],
      ]),
    ).toEqual([
      [1, 2],
      [5, 6],
      [10, 12],
    ]);
  });

  it("merges overlapping intervals given out of order", () => {
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

  it("chains merges across many intervals", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [2, 4],
        [5, 7],
        [6, 9],
      ]),
    ).toEqual([[1, 9]]);
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

  it("handles zero-length intervals", () => {
    expect(mergeIntervals([[5, 5]])).toEqual([[5, 5]]);
    expect(
      mergeIntervals([
        [5, 5],
        [5, 5],
      ]),
    ).toEqual([[5, 5]]);
    expect(
      mergeIntervals([
        [5, 5],
        [6, 6],
      ]),
    ).toEqual([[5, 6]]);
    expect(
      mergeIntervals([
        [5, 5],
        [7, 7],
      ]),
    ).toEqual([
      [5, 5],
      [7, 7],
    ]);
  });

  it("handles negative numbers", () => {
    expect(
      mergeIntervals([
        [-5, -3],
        [-2, 0],
        [2, 4],
      ]),
    ).toEqual([
      [-5, 0],
      [2, 4],
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

  it("returns new interval arrays rather than references to the input", () => {
    const a: [number, number] = [1, 2];
    const result = mergeIntervals([a]);

    expect(result[0]).toEqual([1, 2]);
    expect(result[0]).not.toBe(a);
  });

  it("produces sorted output where no two blocks touch or overlap", () => {
    const result = mergeIntervals([
      [20, 25],
      [3, 4],
      [11, 13],
      [1, 2],
      [14, 14],
      [7, 9],
      [24, 30],
    ]);

    expect(result).toEqual([
      [1, 4],
      [7, 9],
      [11, 14],
      [20, 30],
    ]);

    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1] + 1);
    }
  });
});
