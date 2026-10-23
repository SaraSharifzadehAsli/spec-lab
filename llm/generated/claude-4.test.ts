import { describe, it, expect } from "vitest";
import { mergeIntervals } from "../../src/intervals";

type Interval = readonly [number, number];

function assertNormalized(result: Interval[]): void {
  for (const [start, end] of result) {
    expect(start).toBeLessThanOrEqual(end);
  }
  for (let i = 1; i < result.length; i++) {
    // sorted by start and strictly separated (no overlap, no touching)
    expect(result[i][0]).toBeGreaterThan(result[i - 1][1]);
  }
}

describe("mergeIntervals", () => {
  describe("trivial inputs", () => {
    it("returns an empty array for empty input", () => {
      expect(mergeIntervals([])).toEqual([]);
    });

    it("returns a single interval unchanged", () => {
      expect(mergeIntervals([[1, 5]])).toEqual([[1, 5]]);
    });

    it("handles a single zero-length interval", () => {
      expect(mergeIntervals([[3, 3]])).toEqual([[3, 3]]);
    });
  });

  describe("non-overlapping intervals", () => {
    it("keeps disjoint, already-sorted intervals as they are", () => {
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

    it("sorts disjoint intervals by start", () => {
      expect(
        mergeIntervals([
          [7, 9],
          [1, 2],
          [4, 5],
        ]),
      ).toEqual([
        [1, 2],
        [4, 5],
        [7, 9],
      ]);
    });

    it("does not merge intervals separated by a gap, however small", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [2.0001, 3],
        ]),
      ).toEqual([
        [1, 2],
        [2.0001, 3],
      ]);
      expect(
        mergeIntervals([
          [1, 2],
          [3, 4],
        ]),
      ).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe("overlapping intervals", () => {
    it("merges two overlapping intervals", () => {
      expect(
        mergeIntervals([
          [1, 4],
          [3, 6],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("merges overlapping intervals given out of order", () => {
      expect(
        mergeIntervals([
          [3, 6],
          [1, 4],
        ]),
      ).toEqual([[1, 6]]);
    });

    it("absorbs an interval fully contained in another", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [2, 3],
        ]),
      ).toEqual([[1, 10]]);
      expect(
        mergeIntervals([
          [2, 3],
          [1, 10],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("keeps the larger end when a later interval ends earlier", () => {
      expect(
        mergeIntervals([
          [1, 10],
          [2, 5],
          [6, 8],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("merges a chain of overlapping intervals into one", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [2, 5],
          [4, 8],
          [7, 10],
        ]),
      ).toEqual([[1, 10]]);
    });

    it("merges duplicates", () => {
      expect(
        mergeIntervals([
          [2, 4],
          [2, 4],
          [2, 4],
        ]),
      ).toEqual([[2, 4]]);
    });

    it("merges intervals sharing the same start", () => {
      expect(
        mergeIntervals([
          [1, 5],
          [1, 2],
        ]),
      ).toEqual([[1, 5]]);
      expect(
        mergeIntervals([
          [1, 2],
          [1, 5],
        ]),
      ).toEqual([[1, 5]]);
    });

    it("produces several groups from mixed input", () => {
      expect(
        mergeIntervals([
          [15, 18],
          [1, 3],
          [8, 10],
          [2, 6],
          [9, 12],
        ]),
      ).toEqual([
        [1, 6],
        [8, 12],
        [15, 18],
      ]);
    });
  });

  describe("touching intervals", () => {
    it("merges intervals where one ends exactly where the next starts", () => {
      expect(
        mergeIntervals([
          [1, 2],
          [2, 3],
        ]),
      ).toEqual([[1, 3]]);
    });

    it("merges a chain of touching intervals", () => {
      expect(
        mergeIntervals([
          [3, 4],
          [1, 2],
          [2, 3],
          [4, 5],
        ]),
      ).toEqual([[1, 5]]);
    });

    it("merges a zero-length interval at another interval's boundary", () => {
      expect(
        mergeIntervals([
          [1, 3],
          [3, 3],
        ]),
      ).toEqual([[1, 3]]);
      expect(
        mergeIntervals([
          [3, 3],
          [3, 5],
        ]),
      ).toEqual([[3, 5]]);
    });

    it("merges zero-length intervals at the same point", () => {
      expect(
        mergeIntervals([
          [4, 4],
          [4, 4],
        ]),
      ).toEqual([[4, 4]]);
    });

    it("keeps separate zero-length intervals at different points", () => {
      expect(
        mergeIntervals([
          [5, 5],
          [1, 1],
        ]),
      ).toEqual([
        [1, 1],
        [5, 5],
      ]);
    });
  });

  describe("numeric edge cases", () => {
    it("handles negative numbers", () => {
      expect(
        mergeIntervals([
          [-5, -2],
          [-10, -6],
          [-3, 1],
        ]),
      ).toEqual([
        [-10, -6],
        [-5, 1],
      ]);
    });

    it("handles intervals spanning zero", () => {
      expect(
        mergeIntervals([
          [0, 2],
          [-2, 0],
        ]),
      ).toEqual([[-2, 2]]);
    });

    it("handles fractional values", () => {
      expect(
        mergeIntervals([
          [0.5, 1.5],
          [1.5, 2.25],
          [3.75, 4],
        ]),
      ).toEqual([
        [0.5, 2.25],
        [3.75, 4],
      ]);
    });

    it("handles very large values", () => {
      const big = Number.MAX_SAFE_INTEGER;
      expect(
        mergeIntervals([
          [big - 10, big],
          [big - 20, big - 5],
        ]),
      ).toEqual([[big - 20, big]]);
    });
  });

  describe("immutability", () => {
    it("does not mutate the input array or its intervals", () => {
      const a: [number, number] = [5, 8];
      const b: [number, number] = [1, 6];
      const c: [number, number] = [10, 12];
      const input: Interval[] = [a, b, c];

      mergeIntervals(input);

      expect(input).toEqual([
        [5, 8],
        [1, 6],
        [10, 12],
      ]);
      expect(input[0]).toBe(a);
      expect(input[1]).toBe(b);
      expect(input[2]).toBe(c);
    });

    it("returns a new array, not the input", () => {
      const input: Interval[] = [[1, 2]];
      const result = mergeIntervals(input);
      expect(result).not.toBe(input);
    });

    it("returns intervals that are not the input interval objects", () => {
      const iv: [number, number] = [1, 2];
      const result = mergeIntervals([iv]);
      expect(result[0]).not.toBe(iv);
      expect(result[0]).toEqual([1, 2]);
    });

    it("leaves input untouched when merging extends an interval", () => {
      const first: [number, number] = [1, 3];
      const second: [number, number] = [2, 7];
      mergeIntervals([first, second]);
      expect(first).toEqual([1, 3]);
      expect(second).toEqual([2, 7]);
    });

    it("works with frozen input", () => {
      const input = Object.freeze([
        Object.freeze([4, 6] as const),
        Object.freeze([1, 5] as const),
      ]);
      expect(mergeIntervals(input)).toEqual([[1, 6]]);
    });
  });

  describe("output invariants", () => {
    it("is idempotent", () => {
      const input: Interval[] = [
        [8, 10],
        [1, 3],
        [2, 6],
        [10, 11],
        [15, 18],
      ];
      const once = mergeIntervals(input);
      const twice = mergeIntervals(once);
      expect(twice).toEqual(once);
    });

    it("does not depend on input order", () => {
      const input: Interval[] = [
        [1, 3],
        [2, 6],
        [8, 10],
        [10, 11],
        [15, 18],
        [0, 0],
      ];
      const expected = mergeIntervals(input);
      const reversed = mergeIntervals([...input].reverse());
      const rotated = mergeIntervals([...input.slice(3), ...input.slice(0, 3)]);
      expect(reversed).toEqual(expected);
      expect(rotated).toEqual(expected);
    });

    it("produces sorted, strictly separated intervals covering every input point", () => {
      // deterministic pseudo-random generator
      let seed = 12345;
      const rand = (): number => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };

      for (let trial = 0; trial < 200; trial++) {
        const count = Math.floor(rand() * 12);
        const input: Interval[] = [];
        for (let i = 0; i < count; i++) {
          const start = Math.floor(rand() * 50) - 10;
          const length = Math.floor(rand() * 8);
          input.push([start, start + length]);
        }

        const result = mergeIntervals(input);
        assertNormalized(result);

        // every input interval is fully inside exactly one output interval
        for (const [s, e] of input) {
          const containing = result.filter(([rs, re]) => rs <= s && e <= re);
          expect(containing).toHaveLength(1);
        }

        // every output start and end comes from some input interval
        for (const [rs, re] of result) {
          expect(input.some(([s]) => s === rs)).toBe(true);
          expect(input.some(([, e]) => e === re)).toBe(true);
        }

        if (input.length === 0) {
          expect(result).toEqual([]);
        } else {
          expect(result.length).toBeGreaterThan(0);
          expect(result.length).toBeLessThanOrEqual(input.length);
        }
      }
    });
  });
});