import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";

describe("mergeIntervals", () => {
  it("returns an empty array for empty input", () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it("returns a single interval unchanged", () => {
    expect(mergeIntervals([[1, 5]])).toEqual([[1, 5]]);
  });

  it("sorts non-overlapping intervals by start", () => {
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

  it("merges overlapping intervals", () => {
    expect(
      mergeIntervals([
        [1, 5],
        [3, 7],
        [6, 9],
      ]),
    ).toEqual([[1, 9]]);
  });

  it("merges intervals that touch at their endpoints", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [3, 5],
        [5, 8],
      ]),
    ).toEqual([[1, 8]]);
  });

  it("merges nested intervals", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [3, 7],
        [4, 6],
        [2, 9],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("preserves separated intervals", () => {
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

  it("merges intervals regardless of input order", () => {
    expect(
      mergeIntervals([
        [10, 12],
        [2, 4],
        [3, 6],
        [8, 11],
        [1, 2],
      ]),
    ).toEqual([
      [1, 6],
      [8, 12],
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

  it("handles intervals with identical start points", () => {
    expect(
      mergeIntervals([
        [3, 5],
        [3, 8],
        [3, 4],
      ]),
    ).toEqual([[3, 8]]);
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

  it("handles zero-length intervals", () => {
    expect(
      mergeIntervals([
        [2, 2],
        [2, 2],
        [3, 3],
      ]),
    ).toEqual([
      [2, 2],
      [3, 3],
    ]);
  });

  it("merges zero-length intervals that lie within or touch other intervals", () => {
    expect(
      mergeIntervals([
        [1, 5],
        [3, 3],
        [5, 5],
      ]),
    ).toEqual([[1, 5]]);
  });

  it("handles negative endpoints", () => {
    expect(
      mergeIntervals([
        [-10, -5],
        [-7, -2],
        [0, 3],
        [-2, 0],
      ]),
    ).toEqual([
      [-10, -2],
      [-2, 3],
    ]);
  });

  it("handles intervals spanning negative and positive values", () => {
    expect(
      mergeIntervals([
        [-5, 5],
        [-10, -6],
        [4, 10],
      ]),
    ).toEqual([[-10, 10]]);
  });

  it("does not mutate the input array or its intervals", () => {
    const first = [5, 8] as const;
    const second = [1, 4] as const;
    const third = [3, 6] as const;
    const input = [first, second, third] as const;

    const result = mergeIntervals(input);

    expect(result).toEqual([
      [1, 8],
    ]);
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
    const interval = [1, 3] as const;
    const result = mergeIntervals([interval]);

    expect(result).toEqual([[1, 3]]);
    expect(result[0]).not.toBe(interval);
  });

  it("returns sorted intervals with no overlaps or touching endpoints", () => {
    const result = mergeIntervals([
      [10, 12],
      [1, 4],
      [3, 6],
      [8, 9],
      [6, 8],
      [15, 15],
    ]);

    expect(result).toEqual([
      [1, 9],
      [10, 12],
      [15, 15],
    ]);

    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
  });
});