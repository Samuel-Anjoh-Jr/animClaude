import React from 'react';
import { makeRoom, Box, S3 } from '../room';
import { Glow, LightVeil, Dust } from '../light';
import { RoomShell, BackWindow, WallFrame, WallClock, FloorPlant, FloorShadow } from '../furnish';
import { Cat } from '../props';

// The flat's lounge after dark, built with the room kit: a big moonlit window in the back wall, a bookcase in the left
// corner, a sofa down the right wall with the cat asleep on it, a TV on the left wall, a dead floor lamp, a rug, a low
// table with a mug and the game pad. The moon and the TV are the only lights: everything else has been switched off.
export const LOUNGE = makeRoom({ x: 960, y: 500 }, { x0: 470, x1: 1450, y0: 320, y1: 745 }, 3.4);
export const LOUNGE_WIN = { x0: 760, x1: 1180, y0: 372, y1: 610, moon: { x: 1046, y: 438 } };

const NITE = { wall: '#2B3A4C', side: '#223040', floor: '#2A2530', ceiling: '#141A26', lines: '#1C1822' };
const BOOKS = ['#7A4A4A', '#4A6A7A', '#8A7A4A', '#5A4A7A', '#4A7A5A', '#9A5A3A'];

export const Lounge: React.FC<{ t: number; id?: string; veil?: number; tv?: number }> = ({ t, id = 'lng', veil = 0.4, tv = 0.7 }) => {
  const r = LOUNGE;
  const { P, Q } = r;
  const tvC = P(0, 0.45, 0.42);
  const lampB = P(0.1, 1, 0.42);
  const lampTop = P(0.1, 0.32, 0.42);
  const flick = 0.75 + 0.25 * Math.sin(t / 3.1) * Math.sin(t / 7.3);
  return (
    <g>
      <RoomShell r={r} id={id} wall={NITE.wall} side={NITE.side} floorC={NITE.floor} ceiling={NITE.ceiling} lines={NITE.lines} />
      <BackWindow r={r} id={`${id}w`} t={t} x0={LOUNGE_WIN.x0} x1={LOUNGE_WIN.x1} y0={LOUNGE_WIN.y0} y1={LOUNGE_WIN.y1} sun={LOUNGE_WIN.moon} cols={3} night />
      <WallFrame x={1248} y={402} w={92} h={118} art={1} />
      <WallFrame x={1358} y={426} w={66} h={84} art={2} />
      <WallClock x={1294} y={566} r={26} t={190} />

      {/* the bookcase in the left corner, full */}
      <FloorShadow r={r} u={[0.02, 0.24]} w={[0, 0.1]} />
      <Box r={r} u={[0.02, 0.24]} v={[0.06, 1]} w={[0, 0.1]} front="#35292C" side="#2A2024" top="#44363A" rim />
      {[0.16, 0.34, 0.52, 0.7, 0.88].map((v, i) => (
        <g key={i}>
          <polygon points={Q([[0.035, v - 0.14, 0.1], [0.225, v - 0.14, 0.1], [0.225, v, 0.1], [0.035, v, 0.1]])} fill="#1C1518" />
          {Array.from({ length: 11 }).map((_, k) => {
            const u0 = 0.04 + k * 0.0165;
            const top = v - 0.11 + ((k * 7 + i * 3) % 5) * 0.007;
            return <polygon key={k} points={Q([[u0, top, 0.1], [u0 + 0.014, top, 0.1], [u0 + 0.014, v, 0.1], [u0, v, 0.1]])} fill={BOOKS[(k + i * 2) % 6]} />;
          })}
        </g>
      ))}

      {/* the TV on the left wall, a low unit under it */}
      <polygon points={Q([[0, 0.28, 0.3], [0, 0.28, 0.56], [0, 0.66, 0.56], [0, 0.66, 0.3]])} fill="#0C0E18" />
      <polygon points={Q([[0, 0.3, 0.31], [0, 0.3, 0.55], [0, 0.64, 0.55], [0, 0.64, 0.31]])} fill="#6FA8FF" opacity={tv * flick} />
      <Box r={r} u={[0, 0.07]} v={[0.8, 1]} w={[0.28, 0.58]} front="#2E2428" side="#241C20" top="#3A2E32" />
      <polygon points={Q([[0.0, 1, 0.3], [0.34, 1, 0.34], [0.34, 1, 0.6], [0.0, 1, 0.56]])} fill="#6FA8FF" opacity={0.1 * tv * flick} style={{ mixBlendMode: 'screen' }} />

      {/* the dead floor lamp */}
      <path d={`M ${lampB.x} ${lampB.y} L ${lampTop.x} ${lampTop.y}`} stroke="#14121C" strokeWidth={7} />
      <ellipse cx={lampB.x} cy={lampB.y} rx={36} ry={9} fill="#14121C" />
      <path d={`M ${lampTop.x - 34} ${lampTop.y - 44} L ${lampTop.x + 34} ${lampTop.y - 44} L ${lampTop.x + 54} ${lampTop.y + 8} L ${lampTop.x - 54} ${lampTop.y + 8} Z`} fill="#4A3F3C" />

      {/* the rug, the low table with a mug and a stack of cases */}
      <polygon points={Q([[0.22, 1, 0.32], [0.76, 1, 0.32], [0.76, 1, 0.78], [0.22, 1, 0.78]])} fill="#3C2F4A" />
      <polygon points={Q([[0.25, 1, 0.35], [0.73, 1, 0.35], [0.73, 1, 0.75], [0.25, 1, 0.75]])} fill="none" stroke="#54426A" strokeWidth={5} />

      {/* the sofa down the right wall, with the cat */}
      <FloorShadow r={r} u={[0.76, 1]} w={[0.2, 0.72]} o={0.45} />
      <Box r={r} u={[0.8, 1]} v={[0.68, 1]} w={[0.2, 0.72]} front="#34464A" side="#2A3A3E" top="#40565A" />
      <Box r={r} u={[0.92, 1]} v={[0.42, 0.72]} w={[0.2, 0.72]} front="#2E3E42" side="#3A4E52" top="#40565A" />
      <Box r={r} u={[0.8, 1]} v={[0.5, 1]} w={[0.66, 0.74]} front="#3A4E52" side="#2E3E42" top="#465E62" />
      {(() => {
        const c = P(0.87, 0.68, 0.44);
        return <Cat x={c.x} y={c.y + 6} mood="sleep" f={t} />;
      })()}

      <FloorPlant r={r} u={0.68} w={0.05} size={0.9} />

      {/* the contrast pass: only the moon and the TV punch through */}
      <LightVeil id={`${id}veil`} lights={[[960, 500, 470], [960, 860, 420], [tvC.x + 90, tvC.y, 340 * Math.max(0.3, tv)]]} o={veil} />
      <circle cx={LOUNGE_WIN.moon.x} cy={LOUNGE_WIN.moon.y} r={420} fill="url(#kitMoonBloom)" opacity={0.3} />
      <Glow x={tvC.x + 40} y={tvC.y} r={420} kind="cool" o={0.32 * tv * flick} />
      <polygon points={Q([[0.32, 1, 0.08], [0.68, 1, 0.08], [0.8, 1, 0.7], [0.2, 1, 0.7]])} fill="#9FC0FF" opacity={0.07} style={{ mixBlendMode: 'screen' }} />
      <Dust t={t} seed={23} x0={LOUNGE_WIN.x0} y0={LOUNGE_WIN.y1 - 60} w={LOUNGE_WIN.x1 - LOUNGE_WIN.x0} h={320} n={22} o={0.35} />
      <rect x={0} y={0} width={0} height={0} fill={S3.warm} />
    </g>
  );
};
