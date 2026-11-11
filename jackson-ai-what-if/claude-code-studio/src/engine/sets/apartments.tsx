import React from 'react';
import { rnd } from '../anim';
import { NightSky, Stars, Moon, Skyline } from '../kit';
import { Glow } from '../light';

// The apartment block at night, seen straight on from across the street: six columns of windows over five floors, a
// row of shuttered shops, a fire escape, a water tank on the roof, two neighbours, street lamps and a parked car. Every
// window is its own light: `level(c, r)` gives each one's brightness (0..1), so a shot can kill them in a sweep or
// switch on just one. `cold` draws one window in a hard white-blue, so it can't be mistaken for anyone's bedside lamp.

export const BLOCK = { x0: 430, x1: 1490, y0: 170, floorH: 132, floors: 5, cols: 6, street: 950 };
export const AMBER = '#FFB765';
export const COLD = '#CFE9FF';

/** A window's box on the wall: column c (0..5, left to right), floor r (0..4, top to bottom). */
export const winBox = (c: number, r: number) => {
  const pitch = (BLOCK.x1 - BLOCK.x0 - 60) / BLOCK.cols;
  return { x: BLOCK.x0 + 30 + c * pitch + (pitch - 96) / 2, y: BLOCK.y0 + 34 + r * BLOCK.floorH, w: 96, h: 92 };
};

/** Which order the windows die in, 0..1: each shot's sweep reads the same order, so it never reshuffles. */
export const winOrder = (c: number, r: number) => rnd(4, c * 7 + r * 13);

const Pane: React.FC<{ c: number; r: number; lv: number; seed: number; color: string }> = ({ c, r, lv, seed, color }) => {
  const b = winBox(c, r);
  const k = rnd(seed, c * 11 + r * 5);
  const mid = b.x + b.w / 2;
  const content =
    k < 0.26 ? (
      // curtains drawn to each side
      <g fill="#7A4A30">
        <path d={`M ${b.x} ${b.y} L ${b.x + 26} ${b.y} Q ${b.x + 18} ${b.y + 50} ${b.x + 8} ${b.y + b.h} L ${b.x} ${b.y + b.h} Z`} />
        <path d={`M ${b.x + b.w} ${b.y} L ${b.x + b.w - 26} ${b.y} Q ${b.x + b.w - 18} ${b.y + 50} ${b.x + b.w - 8} ${b.y + b.h} L ${b.x + b.w} ${b.y + b.h} Z`} />
      </g>
    ) : k < 0.5 ? (
      // a roller blind, part way down, and a shelf behind it
      <g>
        <rect x={b.x} y={b.y} width={b.w} height={b.h * (0.3 + rnd(seed + 1, c + r) * 0.3)} fill="#C98E52" />
        <rect x={b.x + 8} y={b.y + b.h - 26} width={b.w - 16} height={5} fill="#6A4028" />
      </g>
    ) : k < 0.74 ? (
      // a plant on the sill and a pendant lamp in the room
      <g>
        <path d={`M ${mid} ${b.y} L ${mid} ${b.y + 26}`} stroke="#6A4028" strokeWidth={2} />
        <path d={`M ${mid - 14} ${b.y + 36} L ${mid + 14} ${b.y + 36} L ${mid + 7} ${b.y + 26} L ${mid - 7} ${b.y + 26} Z`} fill="#6A4028" />
        <path d={`M ${b.x + 16} ${b.y + b.h} q -6 -26 -2 -34 q 6 14 8 18 q 2 -14 10 -22 q 0 18 -4 38 Z`} fill="#4E5A30" />
      </g>
    ) : k < 0.9 ? (
      // somebody standing in the room
      <g fill="#6A3E28">
        <circle cx={mid + 12} cy={b.y + 42} r={13} />
        <path d={`M ${mid - 8} ${b.y + b.h} Q ${mid - 4} ${b.y + 58} ${mid + 12} ${b.y + 56} Q ${mid + 30} ${b.y + 58} ${mid + 32} ${b.y + b.h} Z`} />
      </g>
    ) : (
      // a cat on the sill
      <g fill="#6A3E28">
        <ellipse cx={mid - 18} cy={b.y + b.h - 14} rx={20} ry={13} />
        <circle cx={mid - 34} cy={b.y + b.h - 28} r={9} />
        <path d={`M ${mid - 42} ${b.y + b.h - 32} l 2 -11 l 6 7 Z M ${mid - 32} ${b.y + b.h - 34} l 6 -9 l 3 10 Z`} />
      </g>
    );
  return (
    <g>
      {/* the dead pane: dark glass with a smear of moon on it */}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#0E1430" />
      <path d={`M ${b.x + 8} ${b.y + 54} L ${b.x + 48} ${b.y + 8} L ${b.x + 62} ${b.y + 8} L ${b.x + 22} ${b.y + 54} Z`} fill="#9FC0FF" opacity={0.1} />
      {lv > 0.01 ? (
        <g opacity={lv}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={color} />
          <rect x={b.x} y={b.y} width={b.w} height={b.h * 0.42} fill="#FFFFFF" opacity={0.2} />
          {color === COLD ? null : content}
        </g>
      ) : null}
      {/* frame, centre bar and sill */}
      <g fill="#14152A">
        <rect x={b.x - 6} y={b.y - 6} width={b.w + 12} height={6} />
        <rect x={b.x - 6} y={b.y} width={6} height={b.h} />
        <rect x={b.x + b.w} y={b.y} width={6} height={b.h} />
        <rect x={mid - 2.5} y={b.y} width={5} height={b.h} />
      </g>
      <rect x={b.x - 11} y={b.y + b.h} width={b.w + 22} height={9} fill="#3A3B58" />
      {lv > 0.01 ? <rect x={b.x - 11} y={b.y + b.h} width={b.w + 22} height={3} fill={color} opacity={0.65 * lv} /> : null}
    </g>
  );
};

const Neighbour: React.FC<{ x0: number; x1: number; top: number; seed: number; others: number; color?: string }> = ({ x0, x1, top, seed, others, color = '#191A30' }) => {
  const rows = Math.floor((BLOCK.street - top - 20) / 70);
  const cols = Math.floor((x1 - x0 - 30) / 72);
  return (
    <g>
      <rect x={x0} y={top} width={x1 - x0} height={BLOCK.street + 60 - top} fill={color} />
      <rect x={x0} y={top} width={x1 - x0} height={10} fill="#262745" />
      {Array.from({ length: cols * rows }).map((_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const lit = rnd(seed, i) < 0.6;
        const dead = rnd(seed + 2, i) < others;
        return <rect key={i} x={x0 + 24 + c * 72} y={top + 28 + r * 70} width={40} height={44} fill={lit && !dead ? AMBER : '#0E1430'} opacity={lit && !dead ? 0.8 : 1} />;
      })}
    </g>
  );
};

const StreetLamp: React.FC<{ x: number; flip?: 1 | -1 }> = ({ x, flip = 1 }) => (
  <g>
    <rect x={x - 5} y={560} width={10} height={420} fill="#12131F" />
    <path d={`M ${x} 562 Q ${x} 520 ${x + flip * 70} 524`} stroke="#12131F" strokeWidth={9} fill="none" />
    <path d={`M ${x + flip * 48} 524 L ${x + flip * 98} 524 L ${x + flip * 90} 538 L ${x + flip * 56} 538 Z`} fill="#12131F" />
    <ellipse cx={x + flip * 73} cy={540} rx={18} ry={4} fill="#FFE2B0" />
    <path d={`M ${x + flip * 56} 540 L ${x + flip * 90} 540 L ${x + flip * 220} 985 L ${x - flip * 80} 985 Z`} fill="url(#g3cone)" opacity={0.2} style={{ mixBlendMode: 'screen' }} />
    <Glow x={x + flip * 73} y={546} r={190} o={0.55} />
    <ellipse cx={x + flip * 73} cy={990} rx={200} ry={28} fill="#FFC98A" opacity={0.12} />
  </g>
);

export const Apartments: React.FC<{ t: number; id?: string; level?: (c: number, r: number) => number; cold?: [number, number]; seed?: number; others?: number; moon?: boolean; wall?: string }> = ({
  t, id = 'apt', level = () => 1, cold, seed = 9, others = 0, moon = true, wall = '#2A2B46',
}) => {
  const B = BLOCK;
  const w = B.x1 - B.x0;
  const h = B.floors * B.floorH;
  const lit: { c: number; r: number; lv: number; cold: boolean }[] = [];
  for (let r = 0; r < B.floors; r++) for (let c = 0; c < B.cols; c++) {
    const isCold = !!cold && cold[0] === c && cold[1] === r;
    lit.push({ c, r, lv: level(c, r), cold: isCold });
  }
  return (
    <g>
      <NightSky id={`${id}sky`} horizonY={900} />
      <Stars seed={seed} x0={-400} y0={-400} w={2720} h={1000} t={t} n={150} />
      {moon ? <Moon x={1850} y={30} r={62} /> : null}
      <Skyline y={960} seed={seed + 2} color="#121430" h={420} />
      <Neighbour x0={-420} x1={430} top={300} seed={seed + 3} others={others} />
      <Neighbour x0={1490} x1={2340} top={240} seed={seed + 4} others={others} color="#1C1D34" />

      {/* the roof: a tank on legs, an air handler, an aerial with a slow red light */}
      <g>
        <rect x={B.x0 + 760} y={36} width={150} height={100} rx={6} fill="#1A1B2E" />
        <path d={`M ${B.x0 + 752} 36 Q ${B.x0 + 835} -16 ${B.x0 + 918} 36 Z`} fill="#15162A" />
        {[0.18, 0.5, 0.82].map((k, i) => (
          <rect key={i} x={B.x0 + 760 + 150 * k - 3} y={136} width={6} height={36} fill="#12131F" />
        ))}
        <rect x={B.x0 + 170} y={118} width={120} height={54} fill="#1E1F34" />
        <circle cx={B.x0 + 230} cy={146} r={18} fill="#14152A" />
        <path d={`M ${B.x0 + 420} 172 L ${B.x0 + 420} 56 M ${B.x0 + 392} 86 L ${B.x0 + 448} 86 M ${B.x0 + 400} 104 L ${B.x0 + 440} 104`} stroke="#14152A" strokeWidth={5} />
        <circle cx={B.x0 + 420} cy={54} r={6} fill="#FF4A4A" opacity={Math.floor(t / 22) % 2 ? 1 : 0.2} />
        <Glow x={B.x0 + 420} y={54} r={46} kind="red" o={Math.floor(t / 22) % 2 ? 0.7 : 0} />
      </g>

      {/* the wall: brick, a cornice at every floor, the parapet */}
      <defs>
        <pattern id={`${id}brick`} width={44} height={22} patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 44 0 M 0 11 L 44 11 M 11 0 L 11 11 M 33 11 L 33 22" stroke="#1F2038" strokeWidth={1.6} fill="none" />
        </pattern>
        <linearGradient id={`${id}fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.42} />
        </linearGradient>
      </defs>
      <rect x={B.x0} y={B.y0} width={w} height={h + 130} fill={wall} />
      <rect x={B.x0} y={B.y0} width={w} height={h + 130} fill={`url(#${id}brick)`} />
      <rect x={B.x0} y={B.y0} width={w} height={h + 130} fill={`url(#${id}fade)`} />
      <rect x={B.x0 - 14} y={B.y0 - 14} width={w + 28} height={26} fill="#34355A" />
      <rect x={B.x0 - 14} y={B.y0 - 14} width={w + 28} height={3} fill="#9FC0FF" opacity={0.4} />
      {Array.from({ length: B.floors }).map((_, r) => (
        <rect key={r} x={B.x0} y={B.y0 + (r + 1) * B.floorH - 2} width={w} height={6} fill="#22233C" />
      ))}

      {/* the light each window throws on the bricks, then the windows */}
      {lit.map(({ c, r, lv, cold: isC }) => {
        const b = winBox(c, r);
        return lv > 0.02 ? <Glow key={`g${c}-${r}`} x={b.x + b.w / 2} y={b.y + b.h / 2} r={isC ? 210 : 120} kind={isC ? 'cool' : 'warm'} o={(isC ? 0.5 : 0.28) * lv} /> : null;
      })}
      {lit.map(({ c, r, lv, cold: isC }) => (
        <Pane key={`w${c}-${r}`} c={c} r={r} lv={lv} seed={seed} color={isC ? COLD : AMBER} />
      ))}

      {/* the fire escape down the right of the block */}
      <g stroke="#0D0E1A" strokeWidth={5} fill="none">
        {Array.from({ length: 4 }).map((_, i) => {
          const y = B.y0 + (i + 1) * B.floorH + 6;
          const x0 = B.x1 - 216;
          const x1 = B.x1 - 18;
          return (
            <g key={i}>
              <path d={`M ${x0} ${y} L ${x1} ${y}`} strokeWidth={9} />
              <path d={`M ${x0} ${y - 40} L ${x1} ${y - 40} M ${x0} ${y - 40} L ${x0} ${y} M ${x1} ${y - 40} L ${x1} ${y}`} />
              {i < 3 ? <path d={i % 2 ? `M ${x0 + 30} ${y} L ${x1 - 30} ${y + B.floorH}` : `M ${x1 - 30} ${y} L ${x0 + 30} ${y + B.floorH}`} strokeWidth={7} /> : null}
            </g>
          );
        })}
      </g>
      {/* a drainpipe */}
      <rect x={B.x0 + 8} y={B.y0} width={10} height={h + 130} fill="#1A1B30" />

      {/* the shops at street level: shutters, an awning, a lit doorway */}
      {(() => {
        const y0 = B.y0 + h + 6;
        const hh = B.street - y0;
        return (
          <g>
            {[0, 1, 2].map((i) => {
              const x = B.x0 + 40 + i * 340;
              return (
                <g key={i}>
                  <rect x={x} y={y0 + 22} width={300} height={hh - 22} fill={i === 1 ? '#121326' : '#1B1C31'} />
                  {i !== 1
                    ? Array.from({ length: 11 }).map((_, k) => <rect key={k} x={x} y={y0 + 24 + k * 9} width={300} height={2} fill="#101124" />)
                    : null}
                  <path d={`M ${x - 10} ${y0 + 22} L ${x + 310} ${y0 + 22} L ${x + 290} ${y0 - 2} L ${x + 10} ${y0 - 2} Z`} fill={['#4A2A3A', '#2C3A4A', '#3A4030'][i]} />
                </g>
              );
            })}
            {/* the doorway to the stairs, a small bulb over it */}
            <rect x={B.x0 + 500} y={y0 + 34} width={100} height={hh - 34} fill="#3A2A22" />
            <rect x={B.x0 + 512} y={y0 + 46} width={76} height={hh - 46} fill="#FFB46A" opacity={0.35} />
            <Glow x={B.x0 + 550} y={y0 + 30} r={110} o={0.5} />
          </g>
        );
      })()}

      {/* the pavement and the road */}
      <rect x={-420} y={B.street} width={2760} height={40} fill="#26273E" />
      <rect x={-420} y={B.street + 40} width={2760} height={8} fill="#3A3B58" />
      <rect x={-420} y={B.street + 48} width={2760} height={300} fill="#14152A" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={-300 + i * 240} y={1090} width={120} height={8} fill="#3A3B58" opacity={0.6} />
      ))}
      <StreetLamp x={280} />
      <StreetLamp x={1650} flip={-1} />
      {/* a parked car, dark, with the lamp along its roof */}
      <g transform="translate(1180 1018)">
        <ellipse cx={0} cy={38} rx={210} ry={12} fill="#000" opacity={0.5} />
        <path d="M -196 26 Q -200 -6 -150 -12 L -92 -18 Q -50 -62 20 -62 Q 84 -62 114 -18 L 170 -10 Q 200 -4 198 26 Z" fill="#0D0E1A" />
        <path d="M -78 -18 Q -44 -52 16 -52 L 16 -18 Z M 28 -52 Q 74 -52 98 -18 L 28 -18 Z" fill="#20233C" />
        <path d="M -92 -18 Q -50 -62 20 -62 Q 84 -62 114 -18" stroke="#FFC98A" strokeWidth={2.5} fill="none" opacity={0.6} />
        <circle cx={-118} cy={28} r={28} fill="#08090F" />
        <circle cx={118} cy={28} r={28} fill="#08090F" />
      </g>
    </g>
  );
};
