import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";

describe("mergeIntervals", () => {
  it("returns an empty array for empty input", () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it("returns a single interval unchanged", () => {
    expect(mergeIntervals([[1, 3]])).toEqual([[1, 3]]);
  });

  it("handles zero-length intervals", () => {
    expect(mergeIntervals([[5, 5]])).toEqual([[5, 5]]);
  });

  it("merges overlapping intervals", () => {
    expect(
      mergeIntervals([
        [1, 3],
        [2, 6],
        [8, 10],
        [15, 18],
      ]),
    ).toEqual([
      [1, 6],
      [8, 10],
      [15, 18],
    ]);
  });

  it("merges intervals that share an endpoint", () => {
    expect(
      mergeIntervals([
        [1, 4],
        [4, 5],
      ]),
    ).toEqual([[1, 5]]);
  });

  // "Touching" is integer adjacency: [1, 2] and [3, 4] leave no gap between them.
  it("merges intervals that are adjacent integers", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([[1, 4]]);
  });

  it("does not merge intervals separated by a gap", () => {
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

  it("merges an interval fully contained in another", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 3],
      ]),
    ).toEqual([[1, 10]]);
  });

  it("keeps the larger end when a contained interval comes later", () => {
    expect(
      mergeIntervals([
        [1, 10],
        [2, 3],
        [4, 12],
      ]),
    ).toEqual([[1, 12]]);
  });

  it("merges a chain of touching intervals into one", () => {
    expect(
      mergeIntervals([
        [1, 2],
        [3, 4],
        [5, 6],
      ]),
    ).toEqual([[1, 6]]);
  });

  it("sorts unsorted input by start", () => {
    expect(
      mergeIntervals([
        [8, 10],
        [1, 3],
        [2, 6],
        [20, 25],
      ]),
    ).toEqual([
      [1, 6],
      [8, 10],
      [20, 25],
    ]);
  });

  it("handles intervals with equal starts in either order", () => {
    expect(
      mergeIntervals([
        [1, 4],
        [1, 2],
      ]),
    ).toEqual([[1, 4]]);
    expect(
      mergeIntervals([
        [1, 2],
        [1, 4],
      ]),
    ).toEqual([[1, 4]]);
  });

  it("collapses duplicate intervals", () => {
    expect(
      mergeIntervals([
        [2, 5],
        [2, 5],
        [2, 5],
      ]),
    ).toEqual([[2, 5]]);
  });

  it("handles negative numbers", () => {
    expect(
      mergeIntervals([
        [-5, -3],
        [-2, 0],
        [3, 4],
      ]),
    ).toEqual([
      [-5, 0],
      [3, 4],
    ]);
  });

  it("does not mutate the input array or its intervals", () => {
    const input: [number, number][] = [
      [5, 7],
      [1, 3],
      [2, 6],
    ];
    const snapshot = input.map((iv) => [...iv]);

    mergeIntervals(input);

    expect(input).toEqual(snapshot);
  });

  it("returns new interval objects rather than aliasing the input", () => {
    const input: [number, number][] = [[1, 3]];
    const result = mergeIntervals(input);

    expect(result[0]).toEqual([1, 3]);
    expect(result[0]).not.toBe(input[0]);
  });

  it("produces sorted, non-touching output that covers every input point", () => {
    // Deterministic pseudo-random generator so the test is reproducible.
    let seed = 12345;
    const rand = (max: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % max;
    };

    for (let trial = 0; trial < 200; trial++) {
      const count = rand(10);
      const input: [number, number][] = [];
      for (let i = 0; i < count; i++) {
        const start = rand(50) - 10;
        input.push([start, start + rand(8)]);
      }

      const result = mergeIntervals(input);

      for (const [start, end] of result) {
        expect(start).toBeLessThanOrEqual(end);
      }

      for (let i = 1; i < result.length; i++) {
        expect(result[i][0]).toBeGreaterThan(result[i - 1][1] + 1);
      }

      const covered = (x: number) =>
        result.some(([start, end]) => start <= x && x <= end);
      for (const [start, end] of input) {
        for (let x = start; x <= end; x++) {
          expect(covered(x)).toBe(true);
        }
      }

      const inInput = (x: number) =>
        input.some(([start, end]) => start <= x && x <= end);
      for (const [start, end] of result) {
        for (let x = start; x <= end; x++) {
          expect(inInput(x)).toBe(true);
        }
      }
    }
  });
});
