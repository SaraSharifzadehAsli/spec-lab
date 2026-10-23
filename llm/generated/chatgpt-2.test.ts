import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";

describe("mergeIntervals", () => {
  it("returns an empty array for empty input", () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it("returns a single interval unchanged", () => {
    expect(mergeIntervals([[1, 5]])).toEqual([[1, 5]]);
  });

  it("returns non-overlapping intervals sorted by start", () => {
    expect(
      mergeIntervals([
        [8, 10],
        [1, 3],
        [5, 7],
      ]),
    ).toEqual([
      [1, 3],
      [5, 7],
      [8, 10],
    ]);
  });

  it("merges overlapping intervals", () => {
    expect(
      mergeIntervals([
        [1, 5],
        [3, 8],
      ]),
    ).toEqual([[1, 8]]);
  });

  it("merges intervals that touch at their endpoints", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [3, 5],
        [5, 7],
      ]),
    ).toEqual([[1, 7]]);
  });

  it("merges intervals contained within another interval", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [3, 5],
        [4, 8],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("merges multiple overlapping intervals into one", () => {
    expect(
      mergeIntervals([
        [1, 4],
        [2, 6],
        [5, 8],
        [7, 10],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("preserves disjoint intervals separated by gaps", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [4, 5],
        [7, 8],
      ]),
    ).toEqual([
      [1, 2],
      [4, 5],
      [7, 8],
    ]);
  });

  it("merges overlapping intervals while preserving separate groups", () => {
    expect(
      mergeIntervals([
        [10, 12],
        [1, 4],
        [3, 6],
        [8, 9],
        [5, 7],
      ]),
    ).toEqual([
      [1, 7],
      [8, 9],
      [10, 12],
    ]);
  });

  it("handles duplicate intervals", () => {
    expect(
      mergeIntervals([
        [2, 5],
        [2, 5],
        [2, 5],
      ]),
    ).toEqual([[2, 5]]);
  });

  it("handles zero-length intervals", () => {
    expect(
      mergeIntervals([
        [2, 2],
        [2, 4],
        [6, 6],
      ]),
    ).toEqual([
      [2, 4],
      [6, 6],
    ]);
  });

  it("handles negative endpoints", () => {
    expect(
      mergeIntervals([
        [-5, -2],
        [-3, 1],
        [2, 4],
        [-10, -6],
      ]),
    ).toEqual([
      [-10, -6],
      [-5, 1],
      [2, 4],
    ]);
  });

  it("handles intervals with identical start points", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [1, 5],
        [1, 2],
      ]),
    ).toEqual([[1, 5]]);
  });

  it("handles intervals with identical end points", () => {
    expect(
      mergeIntervals([
        [1, 5],
        [2, 5],
        [3, 5],
      ]),
    ).toEqual([[1, 5]]);
  });

  it("does not mutate the input array or its intervals", () => {
    const first = [5, 8] as const;
    const second = [1, 4] as const;
    const third = [3, 6] as const;
    const input = [first, second, third] as const;

    mergeIntervals(input);

    expect(input).toEqual([
      [5, 8],
      [1, 4],
      [3, 6],
    ]);
    expect(input[0]).toBe(first);
    expect(input[1]).toBe(second);
    expect(input[2]).toBe(third);
  });

  it("returns new interval arrays rather than reusing input intervals", () => {
    const input = [
      [1, 3],
      [5, 7],
    ] as const;

    const result = mergeIntervals(input);

    expect(result).toEqual([
      [1, 3],
      [5, 7],
    ]);
    expect(result[0]).not.toBe(input[0]);
    expect(result[1]).not.toBe(input[1]);
  });
});