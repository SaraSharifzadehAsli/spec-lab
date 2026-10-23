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

  it("leaves well-separated intervals alone", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [5, 6],
        [10, 12],
      ]),
    ).toEqual([
      [1, 2],
      [5, 6],
      [10, 12],
    ]);
  });

  it("merges overlapping intervals", () => {
    expect(
      mergeIntervals([
        [1, 4],
        [3, 7],
      ]),
    ).toEqual([[1, 7]]);
  });

  it("merges intervals that touch at a shared endpoint", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [3, 5],
      ]),
    ).toEqual([[1, 5]]);
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
        [4, 12],
      ]),
    ).toEqual([[1, 12]]);
  });

  it("merges a chain of overlapping intervals into one", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [2, 5],
        [4, 8],
        [7, 9],
      ]),
    ).toEqual([[1, 9]]);
  });

  it("sorts unsorted input by start", () => {
    expect(
      mergeIntervals([
        [8, 10],
        [1, 3],
        [15, 18],
        [2, 6],
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
        [2, 4],
        [2, 4],
      ]),
    ).toEqual([[2, 4]]);
  });

  it("handles intervals with the same start but different ends", () => {
    expect(
      mergeIntervals([
        [1, 5],
        [1, 2],
      ]),
    ).toEqual([[1, 5]]);
  });

  it("handles negative numbers", () => {
    expect(
      mergeIntervals([
        [-5, -2],
        [-3, 0],
        [10, 20],
      ]),
    ).toEqual([
      [-5, 0],
      [10, 20],
    ]);
  });

  it("does not mutate the input array or its intervals", () => {
    const input: Interval[] = [
      [5, 8],
      [1, 6],
    ];
    const snapshot = input.map((iv) => [...iv]);
    mergeIntervals(input);
    expect(input).toEqual(snapshot);
  });

  it("returns new interval objects, not references to the input", () => {
    const a: Interval = [1, 2];
    const result = mergeIntervals([a]);
    expect(result[0]).toEqual(a);
    expect(result[0]).not.toBe(a);
  });

  it("produces sorted output with no touching or overlapping blocks", () => {
    const input: Interval[] = [
      [20, 25],
      [0, 1],
      [3, 9],
      [8, 12],
      [30, 30],
      [24, 26],
      [-4, -1],
    ];
    const result = mergeIntervals(input);
    for (let i = 1; i < result.length; i++) {
      expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
    }
    // Every input interval is covered by some output interval.
    for (const [s, e] of input) {
      expect(result.some(([rs, re]) => rs <= s && e <= re)).toBe(true);
    }
  });
});
