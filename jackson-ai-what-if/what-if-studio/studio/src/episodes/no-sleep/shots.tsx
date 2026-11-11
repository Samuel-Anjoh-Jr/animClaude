import React from 'react';
import {
  Hero, Pose, basePose, poseAt, faceAt, kf, clamp, easeOut, easeIn, rnd, settle, camT, LOOKS, LEG_LEN, HEAD, joints, toWorld,
  Bedroom, BEDROOM, WINDOW, bedSit, AlarmClock, Cat, Paper, PaperStack, PaperBall, Phone,
  Study, Desk, Rooftop, Schematic, SCH, DrawOn, Arrow, SchLabel, CountUp,
  Tabletop, Foreground, HudChip, Dial, Gauge, FloatLabel, FocusRings, TitleCard, Glow, LightVeil, Dust, Bokeh, ShotProps,
} from '../../engine';

// "What if you never needed to sleep?" Fourteen shots: three night demos in the bedroom and the study, the title over
// the city at first light, the turn on the rooftop (the flush, then the reaction-time dial), and a wide sunrise as the
// question. Pip's eyes glint cyan and the night's clock jumps hour to hour; the alarm clock and the calendar stay on
// night one everywhere. Each shot is a pure function of its own clock t.

const PIP = LOOKS.pipHood;
const CYAN = '#7FD4FF';

/** Pip's handheld console: a rounded body, a lit screen, a d-pad and two buttons. Draws ON the surface, centred on x y. */
const Handheld: React.FC<{ x: number; y: number; s?: number; rot?: number; lit?: number; dark?: boolean }> = ({ x, y, s = 1, rot = 0, lit = 1, dark = false }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={34} rx={86} ry={16} fill="#000" opacity={0.3} />
    <rect x={-88} y={-46} width={176} height={92} rx={26} fill={dark ? '#221E32' : '#2A2438'} stroke="#16121F" strokeWidth={5} />
    <rect x={-88} y={-46} width={176} height={92} rx={26} fill="none" stroke="#FFC98A" strokeWidth={3} opacity={0.35} />
    <rect x={-64} y={-34} width={128} height={68} rx={8} fill={dark ? '#141824' : '#10141E'} />
    <rect x={-58} y={-28} width={116} height={56} rx={6} fill={dark ? '#1B2030' : `rgba(127,203,255,${0.25 + 0.45 * lit})`} />
    {dark ? null : (
      <g opacity={lit}>
        {[0, 1, 2].map((r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <rect key={`px${r}-${c}`} x={-50 + c * 19} y={-22 + r * 17} width={12} height={12} rx={2} fill={rnd(9, r * 6 + c) > 0.45 ? '#9ADCFF' : 'rgba(127,203,255,0.25)'} />
          )),
        )}
      </g>
    )}
    <circle cx={54} cy={22} r={9} fill={dark ? '#2E2940' : '#8A4A5A'} />
    <circle cx={78} cy={6} r={9} fill={dark ? '#2E2940' : '#5A7A9A'} />
    <path d="M -74 12 L -64 12 M -69 7 L -69 17" stroke="#443E54" strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** A dark city of blocks with a few lit windows, for the "everyone's asleep" insert (the Rooftop city is dusk-lit). */
const DarkCity: React.FC<{ t: number; die?: number; seed?: number }> = ({ t, die = 0, seed = 4 }) => {
  const blocks = Array.from({ length: 26 }).map((_, i) => {
    const bw = 90 + rnd(seed, i) * 150;
    return { x: -140 + i * 86 + rnd(seed + 1, i) * 30, w: bw, h: 180 + rnd(seed + 2, i) * 320 };
  });
  const wins: { x: number; y: number; q: number; b: number }[] = [];
  blocks.forEach((b, i) => {
    const rows = Math.floor(b.h / 46);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < Math.floor((b.w - 20) / 34); c++) {
        const q = rnd(seed + 3, i * 53 + r * 7 + c);
        if (q > 0.94) wins.push({ x: b.x + 12 + c * 34, y: 1010 - b.h + 20 + r * 46, q, b: i });
      }
    }
  });
  return (
    <g>
      {/* the streets in front of the blocks */}
      {blocks.map((b, i) => (
        <rect key={`b${i}`} x={b.x} y={1010 - b.h} width={b.w} height={b.h + 200} fill="#131020" />
      ))}
      {/* a faint moonlit edge on each roof */}
      {blocks.map((b, i) => (
        <rect key={`r${i}`} x={b.x} y={1010 - b.h} width={b.w} height={5} fill="#3A3558" opacity={0.85} />
      ))}
      {/* street lamps, a few */}
      {blocks.slice(0, 8).map((b, i) => (i % 2 ? (
        <g key={`l${i}`}>
          <path d={`M ${b.x + b.w / 2} 1010 L ${b.x + b.w / 2} 940`} stroke="#0E0B18" strokeWidth={6} />
          <circle cx={b.x + b.w / 2} cy={934} r={7} fill="#FFC98A" opacity={0.9} />
          <Glow x={b.x + b.w / 2} y={934} r={60} o={0.55} />
        </g>
      ) : null))}
      {/* the lit windows: all stay, one goes out; one still shows a blue TV, the last of it */}
      {wins.map((w, i) => {
        const dying = i === 2;
        const o = dying ? Math.max(0, 1 - clamp(die / 1.4)) : 1;
        const tv = i === 5 ? 0.5 + 0.5 * (Math.floor(t / 3) % 2) : 0;
        return (
          <g key={`w${i}`}>
            <rect x={w.x} y={w.y} width={16} height={20} fill={tv ? '#9FC0FF' : w.q > 0.985 ? '#9FC0FF' : '#FFC98A'} opacity={(tv ? 0.55 + 0.25 * tv : 0.5 + w.q * 0.5) * (dying ? 1 : 1)} style={dying && o < 1 ? { opacity: o * (0.5 + w.q * 0.5) } : undefined} />
            {tv > 0 ? <Glow x={w.x + 8} y={w.y + 10} r={70} kind="cool" o={0.3 + 0.25 * tv} /> : null}
            {dying && o < 0.55 ? <Glow x={w.x + 8} y={w.y + 10} r={40} o={0.4 * o} /> : null}
          </g>
        );
      })}
      {/* stars, and the moon on the glass */}
      {Array.from({ length: 30 }).map((_, i) => (
        <circle key={`s${i}`} cx={rnd(seed + 7, i) * 2100 - 100} cy={rnd(seed + 8, i) * 320} r={1.5 + rnd(seed + 9, i) * 2} fill="#C9D6FF" opacity={0.5 + 0.5 * Math.sin(t / 9 + i)} />
      ))}
      <circle cx={1560} cy={210} r={64} fill="#E8EDFF" />
      <circle cx={1544} cy={196} r={13} fill="#B9C2E0" opacity={0.8} />
      <circle cx={1568} cy={226} r={9} fill="#B9C2E0" opacity={0.8} />
      <Glow x={1560} y={210} r={240} kind="cool" o={0.35} />
    </g>
  );
};

/** Pip's arm entering an insert from off-frame: a sleeve stroke and the big mitten, ending on (x, y). The sleeve gets
 *  a lamp-lit fill and a warm edge, or it vanishes on a dark tabletop. */
const InsertArm: React.FC<{ x: number; y: number; from: [number, number]; s?: number; rot?: number }> = ({ x, y, from, s = 5, rot = 0 }) => (
  <g filter="url(#rimR)">
    <path d={`M ${from[0]} ${from[1]} L ${x} ${y}`} stroke={PIP.line} strokeWidth={126 * (s / 5)} fill="none" strokeLinecap="round" />
    <path d={`M ${from[0]} ${from[1]} L ${x} ${y}`} stroke="#4E4868" strokeWidth={106 * (s / 5)} fill="none" strokeLinecap="round" />
    <path d={`M ${from[0] + 40 * (s / 5)} ${from[1] - 20} L ${x + 24 * (s / 5)} ${y - 24 * (s / 5)}`} stroke="#FFC98A" strokeWidth={5 * (s / 5)} fill="none" strokeLinecap="round" opacity={0.55} />
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      <path d="M -12 2 Q -13 -8 -5 -8 L 6 -8 Q 13 -6 12 3 Q 11 12 3 14 Q -8 15 -12 8 Z" fill={PIP.hand} stroke={PIP.line} strokeWidth={2.6} strokeLinejoin="round" />
      <ellipse cx={-11} cy={2} rx={4.2} ry={6.4} fill={PIP.hand} stroke={PIP.line} strokeWidth={2.2} />
    </g>
  </g>
);

// ---------- S1: medium wide, the bedroom at midnight: Pip sits on the bed's edge with the handheld, the cat asleep on the duvet ----------
const S1_CAT = BEDROOM.P(0.09, 0.76, 0.2);
export const S1: React.FC<ShotProps> = ({ t, len }) => {
  const hip = BEDROOM.P(0.27, 0.775, 0.36); // on the duvet, near the bed's front edge
  const sc = (0.62 * 422 * BEDROOM.s(0.36)) / 378; // the room's scale, like bedSit uses
  const pose = poseAt(t, [
    { f: 0, p: { x: hip.x, y: hip.y, scale: sc, yaw: 0.45, facing: 1, look: 0.7, tilt: 6, headTilt: -2, legL: { a: 78, b: -88 }, legR: { a: 66, b: -80 }, armL: { a: 50, b: -88 }, armR: { a: 34, b: -84 } } },
    { f: 12, p: { headTilt: -5, tilt: 8 } },
  ]);
  const j = joints(pose);
  const a = toWorld(pose, j.armL.end);
  const b = toWorld(pose, j.armR.end);
  const hx = (a.x + b.x) / 2 + 12;
  const hy = (a.y + b.y) / 2 - 6;
  return (
    <g transform={camT(kf(t, [[0, 800], [len, 812]]), kf(t, [[0, 500], [len, 510]]), kf(t, [[0, 1.5], [len, 1.58]]))}>
      <Bedroom t={t + 40} id="nsbd1" clock="00:00" crossed={0} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'happy'], [14, 'cool']]), glint: 1, sway: 2 }} rimId="rimR" shadow={0} />
      <Handheld x={hx} y={hy} s={0.52 * sc} lit={1} />
      <Glow x={hx} y={hy} r={150 * sc} kind="cool" o={0.45} />
      <Cat x={S1_CAT.x} y={S1_CAT.y - 2} mood="sleep" f={t + 30} />
      <HudChip f={t} label="AWAKE" icon="dot" />
      <Foreground blur={10}>
        <path d="M -60 1080 L 300 700 L 520 1080 Z" fill="#100D1C" />
      </Foreground>
    </g>
  );
};

// ---------- S2: macro insert, high angle over the nightstand: the clock says 00:00, the mitten takes the handheld ----------
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  return (
    <g transform={camT(960, kf(t, [[0, 500], [len, 520]]), kf(t, [[0, 1.0], [len, 1.05]]))}>
      <Tabletop edge={950} wood="#4E3E48" grain="#42333C" lip="#3A2E36" kind="wood" floor="#241C2A" floorLines="#1D1722" />
      <LightVeil id="s2veil" lights={[[930, 420, 780]]} o={0.5} />
      <Glow x={930} y={380} r={620} o={0.4} />
      <Dust t={t} seed={5} x0={500} y0={300} w={900} h={500} n={14} o={0.4} />
      {/* the alarm clock, red digits, on its little stand */}
      <AlarmClock x={700} y={460} s={4.4} text="00:00" />
      {/* the handheld, lying on the wood yet to be picked up */}
      <Handheld x={1255} y={566} s={1.0} rot={-8} lit={0.9} />
      <Glow x={1255} y={600} r={180} kind="cool" o={0.35} />
      {/* the mitten comes in from the bottom left and grips the console's edge */}
      <InsertArm
        x={kf(t, [[0, 1120], [5, 1156], [8, 1168], [12, 1168]])}
        y={kf(t, [[0, 1300], [5, 594], [8, 548], [12, 550]])}
        from={[910, 1520]}
        rot={-72}
      />
    </g>
  );
};

// ---------- S3: close-up: the handheld lights his face from below; the eyes glint; LEVEL CLEAR ----------
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 3.7 * (1 + 0.03 * clamp(t / len));
  const head = { x: 920, y: 590 };
  const pose: Pose = { ...basePose, x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0.28, look: -0.55, tilt: 5, headTilt: kf(t, [[0, 10], [14, -3]]), armL: { a: 44, b: -84 }, armR: { a: 30, b: -80 }, ...faceAt(t, [[0, 'happy'], [12, 'cool']]) };
  const j = joints(pose);
  const a = toWorld(pose, j.armL.end);
  const b = toWorld(pose, j.armR.end);
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-880 -1060) scale(2.2)">
          <Bedroom t={t + 90} id="nsbd3" clock="01:07" crossed={0} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#0A0818" opacity={0.45} />
      <Hero look={PIP} pose={{ ...pose, glint: t > 8 ? 1 : 0.6 }} rimId="rimBlue" shadow={0} />
      {/* level-clear flash and the label over the screen */}
      {t > 16 ? <FloatLabel x={1250} y={420} t={t - 16} text="+3" size={92} /> : null}
      {t > 20 ? <HudChip f={t} label="AWAKE" icon="dot" /> : null}
      {/* the console up out of frame, its screen throwing cool light on him */}
      <g transform={`translate(${(a.x + b.x) / 2 + 40} ${Math.min(a.y, b.y) + 300}) scale(3.4)`}>
        <Handheld x={0} y={0} s={0.55} lit={1} />
      </g>
      <Glow x={820} y={1010} r={720} kind="cool" o={0.65} />
      <Dust t={t} seed={11} x0={400} y0={300} w={1100} h={600} n={16} o={0.25} />
    </g>
  );
};

// ---------- S4: top-down over the desk: the finished sheet lands; the phone sleeps face-down ----------
export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const drop = easeOut(clamp((t - 8) / 6));
  return (
    <g transform={`translate(960 540) rotate(${-1.5 + t * 0.03}) scale(${1 + t * 0.0015}) translate(-960 -540)`}>
      <Tabletop edge={1120} wood="#4A3C44" grain="#3E3138" lip="#362B32" kind="wood" floor="#221B26" floorLines="#1B161F" />
      <LightVeil id="s4veil" lights={[[1040, 380, 820]]} o={0.55} />
      <Glow x={1040} y={330} r={680} o={0.35} />
      {/* pencil, shavings, a crumpled first try, the phone face-down */}
      <rect x={1420} y={840} width={330} height={15} rx={7} fill="#E9C46A" transform="rotate(-24 1585 848)" />
      <ellipse cx={180} cy={880} rx={26} ry={12} fill="#C9B26A" opacity={0.7} />
      <ellipse cx={208} cy={896} rx={20} ry={9} fill="#C9B26A" opacity={0.6} />
      <PaperBall x={420} y={300} r={64} rot={12} />
      <Phone x={1560} y={300} w={300} rot={10} buzz={0} f={t} />
      <Paper x={680} y={580} w={330} rot={-5} done grade="A+" />
      {/* the sheet Pip just finished, landing */}
      <g opacity={0.85 + 0.15 * drop}><Paper x={1180} y={520 + 44 * drop} w={330} rot={6} done grade="B+" /></g>
      <InsertArm x={kf(t, [[0, 1290], [4, 1215], [7, 1198], [16, 1198], [24, 1214]])} y={kf(t, [[0, -140], [4, 320], [7, 336], [16, 336], [24, 252], [28, 200]])} from={[1560, -420]} />
    </g>
  );
};

// ---------- S5: medium, the study at night: the stack is done, Pip shoves back and stretches, smug ----------
export const S5: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 880, y: 712, yaw: 0.35, look: 0.6, armL: { a: 16, b: -8 }, armR: { a: 44, b: 34 } } },
    { f: 20, p: {} },
    { f: 30, p: { tilt: -12, headTilt: -5, armL: { a: 156, b: 8 }, armR: { a: 156, b: 8 }, look: 0.1 }, ease: easeOut },
    { f: 38, p: { tilt: -9 } },
  ]);
  const face = faceAt(t, [[0, 'happy'], [24, 'smug'], [46, 'happy']]);
  return (
    <g transform={camT(kf(t, [[0, 970], [len, 950]]), 590, kf(t, [[0, 1.72], [len, 1.84]]))}>
      <Study t={t + 130} id="nsst5" night veil={0.4} />
      <Hero look={PIP} pose={{ ...pose, ...face, blink: t > 40 && t < 44 ? 1 : 0 }} rimId="rimR" shadow={0} />
      <Desk x0={520} x1={1340} y={700} laptop={false} />
      <PaperStack x={1120} y={694} n={6} w={190} />
      <FloatLabel x={1180} y={520} t={t - 22} text="DONE" size={64} />
      <HudChip f={t} label="AWAKE" icon="dot" />
      <Foreground blur={10}>
        <path d="M 1520 1080 Q 1400 840 1460 640 Q 1500 860 1620 1080 Z" fill="#120E1C" />
      </Foreground>
    </g>
  );
};

// ---------- S6: wide: Pip at the window, the city black outside, four a.m. ----------
const S6_STAND = (() => {
  const p = BEDROOM.P(0.575, 1, 0.32);
  return { x: p.x, y: p.y - LEG_LEN * 0.95, scale: 0.95 };
})();
export const S6: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: S6_STAND.x, y: S6_STAND.y, scale: S6_STAND.scale, yaw: -0.45, look: -0.85, armL: { a: 24, b: -30 }, armR: { a: 10, b: -6 } } },
    { f: 16, p: { armL: { a: 30, b: -38 } }, ease: easeOut },
    { f: 24, p: {} },
  ]);
  return (
    <g transform={camT(1040, kf(t, [[0, 500], [len, 515]]), kf(t, [[0, 1.3], [len, 1.38]]))}>
      <Bedroom t={t + 200} id="nsbd6" clock="04:12" crossed={0} />
      <Cat x={S1_CAT.x} y={S1_CAT.y - 4} mood="sleep" f={t + 140} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral']]) }} rimId="rimBlue" shadow={0.4} />
      <Foreground blur={10}>
        <path d="M -60 1080 L 260 640 L 430 1080 Z" fill="#100D1C" />
      </Foreground>
    </g>
  );
};

// ---------- S7: macro insert, straight on at the glass: street after street of dark windows; one dies ----------
export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const die = clamp((t - 14) / 20);
  return (
    <g transform={camT(kf(t, [[0, 990], [len, 1000]]), kf(t, [[0, 520], [len, 505]]), kf(t, [[0, 0.92], [len, 0.98]]))}>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0A0C1A" />
      <g transform="translate(-40 60)">
        <DarkCity t={t} die={die} seed={4} />
      </g>
      {/* the glass in front: a cross mullion, its sheen, the roof's light on the inside edge */}
      <rect x={940} y={-400} width={22} height={1880} fill="#1A1428" />
      <rect x={-400} y={520} width={2720} height={16} fill="#1A1428" opacity={0.9} />
      <polygon points="300,-100 640,-100 200,1180 -140,1180" fill="#D9E6FF" opacity={0.05} />
      <polygon points="760,-100 860,-100 420,1180 320,1180" fill="#D9E6FF" opacity={0.07} />
      <rect x={-400} y={-400} width={2720} height={1880} fill="#141434" opacity={0.14} style={{ mixBlendMode: 'screen' }} />
    </g>
  );
};

// ---------- S8: close-up: Pip's reflection in the glass, the eyes glinting, the dead streets behind ----------
export const S8: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 3.4 * (1 + 0.03 * clamp(t / len));
  const head = { x: 960, y: 610 };
  const pose: Pose = { ...basePose, x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0.12, look: -0.25, armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, ...faceAt(t, [[0, 'neutral'], [12, 'cool']]) };
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-660 -220) scale(1.85)">
          <DarkCity t={t} die={1.4} seed={6} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#0A0C1A" opacity={0.4} />
      <Hero look={PIP} pose={{ ...pose, glint: 1 }} rimId="rimBlue" shadow={0} />
      {/* the glass sheen over his reflection */}
      <polygon points="1180,-140 1420,-140 900,1220 660,1220" fill="#D9E6FF" opacity={0.05} />
      <polygon points="1640,-140 1760,-140 1240,1220 1120,1220" fill="#D9E6FF" opacity={0.07} />
    </g>
  );
};

// ---------- S9: title, wide: first light over the city; Pip on the parapet, the handheld dark in his hand ----------
const ROOF_FEET = 838;
export const S9: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 940, y: ROOF_FEET - LEG_LEN * 0.66, scale: 0.66, yaw: 0.15, look: 0.3, armL: { a: 18, b: -6 }, armR: { a: 30, b: -40 } } },
    { f: 30, p: {} },
    { f: 42, p: { armR: { a: 40, b: -52 }, headTilt: 2 }, ease: easeOut },
  ]);
  return (
    <g transform={camT(960, kf(t, [[0, 540], [len, 560]]), kf(t, [[0, 1.0], [len, 1.06]]))}>
      <Rooftop t={t + 80} sunX={1120} sunY={742 - 14 * easeOut(clamp(t / 50))} low={40} cityLit={1.4} />
      <Handheld x={1024} y={860} s={0.42} rot={22} dark />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral']]) }} rimId="rimR" shadow={0.55} />
      <TitleCard t={t} lines={['WHAT IF YOU NEVER', 'NEEDED TO SLEEP?']} accent="SLEEP" accentT={40} size={104} y={168} />
    </g>
  );
};

// ---------- S10: medium, low angle on the roof: he stops mid-step and looks up; the light is turning ----------
export const S10: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 900, y: 838 - LEG_LEN * 0.98, scale: 0.98, yaw: 0.3, look: 0.7, tilt: 5, legL: { a: -8, b: 0 }, legR: { a: 10, b: -2 }, armL: { a: -12, b: 8 }, armR: { a: 62, b: -58 } } },
    { f: 10, p: {}, ease: easeOut }, // the step ends: planted
    { f: 16, p: { look: 0.45, headTilt: 7, yaw: 0.2, armR: { a: 76, b: -64 }, tilt: 3 } }, // the head comes up from the screen
    { f: 22, p: { look: 0.15, headTilt: -1, tilt: 2 }, ease: easeOut },
    { f: 30, p: { headTilt: -5, look: -0.05, tilt: 0 } },
  ]);
  const face = faceAt(t, [[0, 'neutral'], [14, 'shock'], [26, 'worried']]);
  const j = joints(pose);
  const h = toWorld(pose, j.armR.end);
  return (
    <g transform={camT(940, 560, kf(t, [[0, 1.04], [len, 1.12]]))}>
      <Rooftop t={t + 120} sunX={1420} sunY={668} low={60} cityLit={1.4} />
      <Hero look={PIP} pose={{ ...pose, ...face, glint: t < 12 ? 0.8 : 0 }} rimId="rimR" shadow={0} />
      <Handheld x={h.x + 8} y={h.y + 24} s={0.48} rot={-14} lit={t < 12 ? 1 : 0.2} />
      {t > 15 && t < 34 ? <g transform={`translate(${pose.x} ${pose.y - 176 * pose.scale}) scale(0.38) translate(${-pose.x} ${-(pose.y - 176 * pose.scale)})`}><FocusRings x={pose.x} y={pose.y - 176 * pose.scale} t={t - 15} /></g> : null}
    </g>
  );
};

// ---------- S11: schematic: while you sleep, the CSF rises inside the brain and the waste washes out ----------
const BR_MAIN = 'M 668 636 C 640 560 644 470 700 400 C 760 322 900 288 1010 296 C 1130 304 1220 360 1240 450 C 1256 540 1220 610 1150 648 C 1100 670 1060 672 1030 660 C 940 690 790 690 700 664 C 690 656 678 648 668 636 Z';
const CEREB = 'M 1034 664 C 1036 626 1072 604 1108 610 C 1146 618 1170 650 1164 686 C 1158 724 1120 742 1082 730 C 1048 718 1032 700 1034 664 Z';
export const S11: React.FC<ShotProps> = ({ t, len }) => {
  const inside = Array.from({ length: 6 }).map((_, i) => ({ x: 730 + rnd(3, i) * 320, y: 570 + rnd(5, i) * 110, d: rnd(7, i) }));
  const rise = easeOut(clamp((t - 14) / 28)); // the fluid climbs to about a third
  const poolY = 720 - rise * 180;
  const drift = easeOut(clamp((t - 28) / 16)); // the waste leaves
  return (
    <g transform={`translate(960 540) scale(${kf(t, [[0, 1], [len, 1.04]])}) translate(-960 -540)`}>
      <Schematic t={t} id="sch11" />
      <SchLabel x={430} y={140} t={t - 4} text="WHILE YOU SLEEP" size={44} />
      {/* the cerebellum first: the cerebrum's dark fill cuts it where it tucks under */}
      <DrawOn d={CEREB} t={t - 12} dur={9} width={6} color={SCH.dim} />
      <defs>
        <clipPath id="s11brain">
          <path d={BR_MAIN} />
        </clipPath>
      </defs>
      {/* the cerebrum: a dark interior on the blueprint, the fluid rising in it */}
      <path d={BR_MAIN} fill="#131F30" />
      <g clipPath="url(#s11brain)">
        <rect x={540} y={poolY} width={780} height={520} fill="#2E6FA8" opacity={0.26} />
        <path d={`M 600 ${poolY} Q 900 ${poolY - 14} 1240 ${poolY + 6}`} stroke="#5FB0EE" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.9} />
        <path d={`M 600 ${poolY + 26} Q 900 ${poolY + 12} 1240 ${poolY + 32}`} stroke="#4FA3E8" strokeWidth={7} fill="none" strokeDasharray="12 74" strokeDashoffset={-(t * 2.4) % 86} opacity={0.45} />
        {inside.map((w, i) => (
          <circle key={i} cx={w.x + 130 * drift * (0.5 + w.d)} cy={w.y - 8 * Math.sin(t / 7 + i * 2)} r={12} fill="#FFD08A" opacity={(0.3 + 0.55 * rise) * (1 - 0.6 * drift)} />
        ))}
      </g>
      {/* the silhouette on top; stem below the front-centre; a crevice arc where the two parts meet */}
      <DrawOn d={BR_MAIN} t={t - 2} dur={16} width={8} />
      <DrawOn d="M 866 686 C 870 756 866 806 846 844" t={t - 22} dur={7} width={7} color={SCH.dim} />
      <DrawOn d="M 1076 620 C 1092 648 1096 676 1082 706" t={t - 20} dur={5} width={5} color={SCH.dim} />
      {/* the folds: scrolls that run edge to edge */}
      <DrawOn d="M 1180 380 C 1080 330 960 330 900 390 C 850 440 880 500 950 510" t={t - 12} dur={8} width={5} />
      <DrawOn d="M 700 420 C 740 380 800 372 840 400 C 870 422 860 460 820 470" t={t - 14} dur={8} width={5} />
      <DrawOn d="M 660 540 C 720 580 800 590 870 560 C 910 542 930 516 926 490" t={t - 16} dur={8} width={5} />
      <DrawOn d="M 760 640 C 840 660 930 650 990 616 C 1010 604 1022 590 1026 574" t={t - 18} dur={8} width={5} />
      <DrawOn d="M 1200 470 C 1150 480 1116 508 1104 548" t={t - 20} dur={6} width={5} />
      {/* the cerebellum's own folds */}
      <DrawOn d="M 1046 690 C 1064 712 1090 718 1116 706" t={t - 22} dur={4} width={4} color={SCH.dim} />
      <DrawOn d="M 1042 724 C 1062 740 1088 744 1114 732" t={t - 24} dur={4} width={4} color={SCH.dim} />
      {/* the waste leaves along the arrow, dots already free */}
      <Arrow x0={1196} y0={700} x1={1420} y1={824} t={t - 30} bend={-0.2} color={SCH.dim} />
      {[0, 1, 2].map((i) => {
        const q = clamp(drift * 1.5 - i * 0.25);
        return <circle key={`f${i}`} cx={1186 + q * (104 + i * 52)} cy={710 + q * (92 + i * 22)} r={12} fill="#FFD08A" opacity={0.9 * q * (1 - 0.3 * q)} />;
      })}
      <SchLabel x={1080} y={940} t={t - 28} text="THE WASTE WASHES OUT" size={40} color={SCH.live} />
      <SchLabel x={1080} y={996} t={t - 34} text="CEREBROSPINAL FLUID, ON EVERY SLEEP" size={26} color={SCH.dim} />
    </g>
  );
};

// ---------- S12: schematic: a day awake; the reaction bar falls past the legal limit ----------
export const S12: React.FC<ShotProps> = ({ t, len }) => {
  const hrs = 24 * easeIn(clamp((t - 6) / 46)) ** 0.7;
  const gap = Math.min(1, Math.pow(clamp((t - 6) / 46), 1.5) + 0.02);
  return (
    <g transform={`translate(960 540) scale(${kf(t, [[0, 1], [len, 1.05]])}) translate(-960 -540)`}>
      <Schematic t={t + 40} id="sch12b" />
      <SchLabel x={430} y={210} t={t - 4} text="NO SLEEP, ONE DAY" size={40} />
      <CountUp x={430} y={420} t={t - 6} to={24} dur={46} size={120} suffix=" H" />
      <SchLabel x={430} y={520} t={t - 46} text="MINUTE 17: STILL FEELS FINE" size={26} color={SCH.dim} />
      <DrawOn d="M 700 420 L 800 420" t={t - 50} dur={6} color={SCH.dim} width={5} />
      <Gauge x={1080} y={330} w={620} p={gap} label="YOUR REACTION GAP" danger={0.55} />
      <SchLabel x={1390} y={470} t={t - 34} text="0.05% BAC = 17 H AWAKE" size={30} color={SCH.dim} />
      <SchLabel x={1390} y={530} t={t - 52} text="0.10% BAC = 24 H" size={40} color={SCH.live} />
      <SchLabel x={1390} y={600} t={t - 58} text="OVER EVERY LEGAL LIMIT." size={28} color={SCH.dim} />
      <Dial x={1780} y={180} r={110} p={hrs / 24} readout={`${String(Math.round(hrs)).padStart(2, '0')}:00`} size={44} />
    </g>
  );
};

// ---------- S13: extreme close-up: "That's real." The dawn reaches his face ----------
export const S13: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 6.4 * (1 + 0.03 * clamp(t / len));
  const head = { x: 960, y: 700 };
  const pose: Pose = { ...basePose, x: head.x, y: head.y - HEAD.y * sc, scale: sc, yaw: 0.1, look: 0.05, armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, ...faceAt(t, [[0, 'worried'], [14, 'neutral']]), blink: t > 10 && t < 13 ? 1 : 0 };
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-540 -540) scale(2)">
          <Rooftop t={t + 250} sunX={1100} sunY={600} red={0.25 * clamp(t / 16)} low={200} cityLit={1.4} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#160A12" opacity={0.3} />
      <Glow x={1500} y={200} r={600} o={0.35 + 0.2 * clamp(t / len)} />
      <Hero look={PIP} pose={pose} rimId={t > 12 ? 'rimRed' : 'rimR'} shadow={0} />
    </g>
  );
};

// ---------- S14: wide, low angle: the sun clears the roofs; a whole night behind him; so how long? ----------
export const S14: React.FC<ShotProps> = ({ t, len }) => {
  const red = 0.3 * easeOut(clamp((t - 6) / 30));
  const pose = poseAt(t, [
    { f: 0, p: { x: 960, y: 905 - LEG_LEN * 1.1, scale: 1.1, yaw: -0.12, look: 0.55, armL: { a: 20, b: -8 }, armR: { a: 20, b: -8 } } },
    { f: 24, p: { headTilt: 4, look: 0.35 } },
    { f: 50, p: { look: -0.15, headTilt: -2 } },
  ]);
  return (
    <g transform={camT(kf(t, [[0, 960], [len, 945]]), kf(t, [[0, 520], [len, 500]]), kf(t, [[0, 1.0], [len, 1.16]]))}>
      <Rooftop t={t + 300} sunX={1010} sunY={kf(t, [[0, 640], [len, 590]])} red={red} low={40} cityLit={1.4} />
      <Handheld x={1116} y={892} s={0.34} rot={-30} dark />
      <Bokeh seed={8} x0={200} y0={700} w={500} h={300} t={t} o={0.15} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'worried'], [30, 'neutral']]) }} rimId="rimRed" shadow={0} />
      <Dust t={t} seed={19} x0={600} y0={640} w={800} h={300} n={18} o={0.35} />
    </g>
  );
};
