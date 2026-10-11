/**
 * Example tests — the inputs a person thinks of by hand.
 *
 * The list itself lives in `examples.ts` so that `mutation/score.ts` can judge
 * broken implementations against the identical list. These are not the
 * coverage; `intervals.property.test.ts` is.
 */

import { describe, expect, it } from "vitest";
import { mergeIntervals } from "./intervals.js";
import { examples } from "./examples.js";

describe("mergeIntervals — named cases", () => {
  for (const example of examples) {
    it(example.name, () => {
      expect(mergeIntervals(example.input)).toEqual(example.expected);
    });
  }

  it("does not modify the caller's array", () => {
    const input: [number, number][] = [[5, 6], [1, 2]];
    mergeIntervals(input);
    expect(input).toEqual([[5, 6], [1, 2]]);
  });
});
