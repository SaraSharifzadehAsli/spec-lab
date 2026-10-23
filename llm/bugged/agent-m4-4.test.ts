import { describe, it, expect } from "vitest";
import { mergeIntervals, type Interval } from "../../src/intervals";

describe("mergeIntervals", () => {
  it("returns an empty array for empty input", () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it("returns a single interval unchanged", () => {
    expect(mergeIntervals([[1, 5]])).toEqual([[1, 5]]);
  });

  it("handles zero-length intervals", () => {
    expect(mergeIntervals([[3, 3]])).toEqual([[3, 3]]);
  });

  it("leaves well-separated intervals alone", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [10, 12],
        [20, 25],
      ]),
    ).toEqual([
      [1, 2],
      [10, 12],
      [20, 25],
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

  it("merges intervals that touch at an endpoint", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [3, 6],
      ]),
    ).toEqual([[1, 6]]);
  });

  it("absorbs an interval fully contained in another", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 4],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("keeps the larger end when a later-starting interval ends earlier", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 4],
        [5, 7],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("merges duplicate intervals", () => {
    expect(
      mergeIntervals([
        [2, 4],
        [2, 4],
      ]),
    ).toEqual([[2, 4]]);
  });

  it("chains merges across several intervals", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [2, 6],
        [5, 9],
        [8, 12],
      ]),
    ).toEqual([[1, 12]]);
  });

  it("sorts unsorted input by start before merging", () => {
    expect(
      mergeIntervals([
        [15, 18],
        [8, 10],
        [1, 3],
        [2, 6],
      ]),
    ).toEqual([
      [1, 6],
      [8, 10],
      [15, 18],
    ]);
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

  it("does not mutate the input array or its intervals", () => {
    const input: [number, number][] = [
      [5, 8],
      [1, 6],
    ];
    const snapshot = input.map((iv) => [...iv]);
    mergeIntervals(input);
    expect(input).toEqual(snapshot);
  });

  it("returns intervals that are not the same objects as the input", () => {
    const iv: Interval = [1, 2];
    const result = mergeIntervals([iv]);
    expect(result[0]).toEqual(iv);
    expect(result[0]).not.toBe(iv);
  });

  it("produces sorted, non-overlapping, non-touching output", () => {
    const input: Interval[] = [
      [30, 35],
      [0, 4],
      [12, 14],
      [4, 7],
      [20, 22],
      [13, 18],
      [40, 40],
      [31, 33],
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
