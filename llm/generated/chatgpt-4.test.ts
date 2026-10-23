import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";

describe("mergeIntervals", () => {
  it("returns an empty array for empty input", () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it("returns a single interval unchanged", () => {
    expect(mergeIntervals([[2, 5]])).toEqual([[2, 5]]);
  });

  it("sorts non-overlapping intervals by start", () => {
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
        [5, 8],
      ]),
    ).toEqual([[1, 8]]);
  });

  it("preserves intervals separated by gaps", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [4, 6],
        [8, 10],
      ]),
    ).toEqual([
      [1, 2],
      [4, 6],
      [8, 10],
    ]);
  });

  it("merges nested intervals", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [3, 5],
        [4, 8],
        [2, 9],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("merges duplicate intervals", () => {
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

  it("handles zero-length intervals", () => {
    expect(
      mergeIntervals([
        [2, 2],
        [1, 1],
        [3, 3],
      ]),
    ).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it("merges zero-length intervals that lie within or touch other intervals", () => {
    expect(
      mergeIntervals([
        [2, 2],
        [1, 3],
        [3, 3],
        [4, 4],
      ]),
    ).toEqual([[1, 3], [4, 4]]);
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

  it("handles intervals spanning negative and positive values", () => {
    expect(
      mergeIntervals([
        [5, 10],
        [-3, 2],
        [1, 6],
      ]),
    ).toEqual([
      [-3, 10],
    ]);
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
    const input = [[1, 3], [5, 7]] as const;

    const result = mergeIntervals(input);

    expect(result).toEqual([
      [1, 3],
      [5, 7],
    ]);
    expect(result[0]).not.toBe(input[0]);
    expect(result[1]).not.toBe(input[1]);
  });

  it("handles a chain of overlapping intervals in unsorted order", () => {
    expect(
      mergeIntervals([
        [10, 12],
        [2, 4],
        [6, 8],
        [3, 7],
        [8, 10],
      ]),
    ).toEqual([[2, 12]]);
  });

  it("keeps distinct intervals when their endpoints have a positive gap", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [4, 6],
      ]),
    ).toEqual([
      [1, 3],
      [4, 6],
    ]);
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