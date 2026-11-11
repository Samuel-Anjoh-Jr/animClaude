import React from 'react';
import { defineEpisode, Timeline, LookDef, FONT, UI, lerp, easeOut } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16 } from './shots';

// The power's look: everything has gone cold, and a chip counts the hours Pip has been up. Three runs, three leaps:
// a couple of days, a couple of months, and 8,760 hours, which is one year to the hour, on the night he stands in the
// doorway.
const HOURS: [number, number][] = [[17, 41], [1120, 1438], [8504, 8760]];

const AwakeChip: React.FC<{ value: number; f: number }> = ({ value, f }) => {
  const txt = value.toLocaleString('en-US');
  const w = 260 + txt.length * 28;
  return (
    <g transform="translate(70 66)">
      <rect x={0} y={0} width={w} height={84} rx={42} fill={UI.pill} opacity={0.62} />
      <g transform="translate(52 42)">
        <path d="M -26 0 Q 0 -24 26 0 Q 0 24 -26 0 Z" fill="none" stroke="#FFB54A" strokeWidth={4.5} />
        <circle r={9 + Math.sin(f / 4) * 1} fill="#FFB54A" />
      </g>
      <text x={96} y={56} fontFamily={FONT.ui} fontSize={38} fill={UI.text} letterSpacing={4}>
        AWAKE
      </text>
      <text x={246} y={56} fontFamily={FONT.ui} fontSize={38} fill="#FFB54A">
        {`${txt}H`}
      </text>
    </g>
  );
};

const awake: LookDef = {
  grade: (lv) => `saturate(${1 - 0.06 * lv}) brightness(${1 + 0.02 * lv})`,
  Overlay: ({ f, p, n }) => {
    const [a, b] = HOURS[Math.min(n, HOURS.length - 1)];
    return <AwakeChip f={f} value={Math.round(lerp(a, b, easeOut(p)))} />;
  },
};

export const lightsOut = defineEpisode('LightsOut', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16 },
  looks: { awake },
  bg: '#000000',
});
