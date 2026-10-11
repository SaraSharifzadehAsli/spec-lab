/**
 * A counterexample, drawn: input blocks above the axis, output blocks below.
 *
 * Small on purpose. It sits inside a counterexample box, where its job is to
 * make "the output swallowed the gap" something you see rather than parse.
 */

import type { Interval } from "../src/intervals.js";
import { HI, LO } from "./lab.js";

const W = 460;
const PAD_L = 26;
const PAD_R = 14;
const ROW_H = 16;
const TOP = 22;

export function Ruler({
  input,
  output,
}: {
  input: readonly Interval[];
  output: readonly Interval[] | null;
}) {
  const x = (v: number) => PAD_L + ((v - LO) / (HI - LO)) * (W - PAD_L - PAD_R);
  const out = output ?? [];

  const outTop = TOP + input.length * ROW_H + 8;
  const height = Math.max(outTop + out.length * ROW_H + 20, 90);

  const ticks: number[] = [];
  for (let v = LO; v <= HI; v += 5) ticks.push(v);

  const bar = (iv: Interval, y: number, kind: string, key: string) => (
    <rect
      key={key}
      className={`bar bar--${kind}`}
      x={x(iv[0])}
      y={y}
      width={Math.max(x(iv[1]) - x(iv[0]), 2.5)}
      height="10"
      rx="2"
    />
  );

  return (
    <svg
      className="ruler"
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label="input intervals above, output intervals below"
    >
      <text className="ruler-label" x="2" y={TOP + 9}>
        in
      </text>
      <text className="ruler-label" x="2" y={outTop + 9}>
        out
      </text>

      <line className="ruler-axis" x1={PAD_L} y1={height - 16} x2={W - PAD_R} y2={height - 16} />
      {ticks.map((v) => (
        <g key={`t${v}`}>
          <line className="ruler-axis" x1={x(v)} y1={height - 16} x2={x(v)} y2={height - 11} />
          <text className="ruler-tick" x={x(v)} y={height - 1} textAnchor="middle">
            {v}
          </text>
        </g>
      ))}

      {input.map((iv, i) => bar(iv, TOP + i * ROW_H, "in", `i${i}`))}
      {out.map((iv, i) => bar(iv, outTop + i * ROW_H, "out", `o${i}`))}
    </svg>
  );
}
