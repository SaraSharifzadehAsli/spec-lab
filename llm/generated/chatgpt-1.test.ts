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
        [3, 7],
        [6, 9],
      ]),
    ).toEqual([[1, 9]]);
  });

  it("merges intervals that touch at endpoints", () => {
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

  it("preserves separate intervals with gaps between them", () => {
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

  it("merges multiple overlapping groups independently", () => {
    expect(
      mergeIntervals([
        [10, 12],
        [1, 4],
        [3, 6],
        [8, 9],
        [11, 15],
        [20, 22],
        [21, 25],
      ]),
    ).toEqual([
      [1, 6],
      [8, 9],
      [10, 15],
      [20, 25],
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
        [1, 1],
        [2, 2],
        [3, 3],
      ]),
    ).toEqual([[1, 1], [2, 2], [3, 3]]);
  });

  it("merges zero-length intervals touching other intervals", () => {
    expect(
      mergeIntervals([
        [3, 3],
        [1, 4],
        [4, 4],
      ]),
    ).toEqual([[1, 4]]);
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
        [1, 7],
        [1, 5],
      ]),
    ).toEqual([[1, 7]]);
  });

  it("handles intervals with identical end points", () => {
    expect(
      mergeIntervals([
        [1, 5],
        [3, 5],
        [2, 5],
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

  it("returns new interval tuples rather than reusing input tuples", () => {
    const interval = [1, 5] as const;
    const result = mergeIntervals([interval]);

    expect(result).toEqual([[1, 5]]);
    expect(result[0]).not.toBe(interval);
  });

  it("handles intervals in reverse order", () => {
    expect(
      mergeIntervals([
        [9, 12],
        [6, 9],
        [3, 6],
        [0, 3],
      ]),
    ).toEqual([[0, 12]]);
  });

  it("handles large endpoint values", () => {
    expect(
      mergeIntervals([
        [1_000_000_000, 2_000_000_000],
        [1, 999_999_999],
        [999_999_999, 1_000_000_000],
      ]),
    ).toEqual([[1, 2_000_000_000]]);
  });
});