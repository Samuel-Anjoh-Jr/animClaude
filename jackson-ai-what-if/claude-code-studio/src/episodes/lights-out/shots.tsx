import React from 'react';
import {
  Apartments, COLD, winBox, winOrder, Lounge, LOUNGE, LOUNGE_WIN, stand,
  Hero, Look, Pose, basePose, poseAt, faceAt, kf, clamp, lerp, easeOut, easeIn, backOut, rnd, settle, camT, LOOKS, joints, toWorld,
  Rooftop, Schematic, SCH, DrawOn, SchLabel, CountUp, Arrow, Moon, Stars,
  Cat, Guitar, GamePad, Amp, WallSwitch, Nightlight, Jellyfish, Foreground, Glow, Cone, LightVeil, Dust, FocusRings, Sparkle, FloatLabel, Tag, TitleCard, FONT, UI, ShotProps,
} from '../../engine';

// "What if you never needed to sleep?" The whole world switches off around Pip. Sixteen shots: the block across the
// street, the lounge, the switch in the hall, sis's room, the roof at dawn, two science beats, and Pip's window at the
// end. The power's word is "Lights out": a click, and everything dies except one amber window and Pip's amber eyes.
// Each shot is a pure function of its own clock t.

const PIP = LOOKS.pipHood;
const AMBER = '#FFB54A';
const MY_WIN: [number, number] = [2, 2]; // Pip's window on the block
const THEIR_WIN: [number, number] = [3, 1]; // the one that comes on across the street

/** The same costume with the lights off him: a dim face, so the amber eyes are the only bright thing. */
const PIP_DIM: Look = { ...PIP, skin: '#6A6678', skinShade: '#4A4658', hand: '#6A6678', face: '#14121C' };
/** A figure against the light: everything dark, no features, only the eyes (the glint) read. */
const PIP_SHADE: Look = { ...PIP, skin: '#0C0A12', skinShade: '#0C0A12', hand: '#0C0A12', jacket: '#0C0A12', jacketShade: '#0A0810', limb: '#0C0A12', accent: '#3A2A1A', line: '#07050B', face: '#0C0A12', hair: '#0C0A12', shoe: '#0C0A12' };

// ---------- pieces for the hands the rig can't reach ----------
const Sleeve: React.FC<{ d: string; w: number; look?: Look }> = ({ d, w, look = PIP }) => (
  <g>
    <path d={d} stroke={look.line} strokeWidth={w + 14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} stroke={look.limb} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const Mitt: React.FC<{ x: number; y: number; rot: number; s: number; look?: Look; point?: boolean; side?: 1 | -1 }> = ({ x, y, rot, s, look = PIP, point, side = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {point ? (
      <g>
        <rect x={-4} y={10} width={8} height={24} rx={4} fill={look.hand} stroke={look.line} strokeWidth={2.6} />
        <path d="M -11 -2 Q -14 14 -6 18 L 7 18 Q 14 14 11 -2 Z" fill={look.hand} stroke={look.line} strokeWidth={2.8} strokeLinejoin="round" />
        <ellipse cx={side * -10} cy={6} rx={4.5} ry={7} fill={look.hand} stroke={look.line} strokeWidth={2.6} />
      </g>
    ) : (
      <g>
        <ellipse cx={side * 10} cy={3} rx={5.5} ry={9} transform={`rotate(${side * -28} ${side * 10} 3)`} fill={look.hand} stroke={look.line} strokeWidth={2.8} />
        <ellipse cx={0} cy={10} rx={11} ry={15} fill={look.hand} stroke={look.line} strokeWidth={2.8} />
      </g>
    )}
  </g>
);

/** Pip from behind: the hood and the shoulders, for looking over at what he's looking at. */
const PipBack: React.FC<{ x: number; y: number; s: number; rimColor?: string }> = ({ x, y, s, rimColor = '#FFB15A' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -300 420 Q -290 190 -110 130 Q 0 96 110 130 Q 290 190 300 420 Z" fill="#17151F" />
    <path d="M -128 150 Q -160 -116 0 -132 Q 160 -116 128 150 Q 0 176 -128 150 Z" fill="#1F1C29" />
    <path d="M 0 -130 Q -12 20 0 158" stroke="#100E16" strokeWidth={6} fill="none" />
    <path d="M -128 150 Q -160 -116 0 -132 Q 40 -128 76 -108" stroke={rimColor} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.85} />
    <path d="M -300 420 Q -290 190 -128 142" stroke={rimColor} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
  </g>
);

/** Where an eye lands in world space for a pose: the rig's face slide, squeeze and head tilt, worked through. */
const eyeAt = (pose: Pose, cx: number) => {
  const ay = Math.min(1, Math.abs(pose.yaw));
  const lx = (cx + pose.look * 7) * (1 - 0.28 * ay) + pose.yaw * 30;
  const ly = -180;
  const a = (pose.headTilt * Math.PI) / 180;
  const dy = ly + 136;
  return { x: pose.x + (lx * Math.cos(a) - dy * Math.sin(a)) * pose.scale, y: pose.y + (-136 + lx * Math.sin(a) + dy * Math.cos(a)) * pose.scale };
};

/** Every window dies once, in one sweep, between `from` and `from + dur`; Pip's stays on. */
const sweep = (t: number, from: number, dur: number) => (c: number, r: number) => {
  if (c === MY_WIN[0] && r === MY_WIN[1]) return 1;
  const off = from + winOrder(c, r) * dur;
  return t < off ? 1 : t < off + 1 ? 0.4 : 0;
};

// ---------- S1: wide, the block: every window on, then the sweep. One stays. ----------
export const S1: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={camT(960, kf(t, [[0, 500], [len, 520]], (x) => x), kf(t, [[0, 0.86], [len, 0.92]], (x) => x))}>
    <Apartments t={t + 20} id="a1" level={sweep(t, 19, 11)} others={clamp((t - 19) / 11)} />
    <Foreground blur={10}>
      <path d="M -300 -300 Q -90 60 -160 340 Q 80 150 180 -300 Z" fill="#070914" />
      <path d="M 40 -300 Q 110 -40 300 60 Q 260 -120 300 -300 Z" fill="#090B18" />
    </Foreground>
  </g>
);

// ---------- S2: medium, Pip on the sofa with the pad, TV light on his face ----------
const seat: Partial<Pose> = { x: 830, y: 868, scale: 2.5, yaw: 0.55, look: 0.9, legL: { a: 78, b: -78 }, legR: { a: 84, b: -84 }, armL: { a: 3, b: 0 } };
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { ...seat, tilt: 3, armR: { a: 22, b: 66 } } },
    { f: 10, p: { tilt: 7, headTilt: 3 }, ease: easeOut },
    { f: 25, p: { tilt: 5 } },
  ]);
  const mash = Math.sin(t * 2.1) * 4;
  const posed = { ...pose, armR: { a: pose.armR.a + mash * 0.4, b: pose.armR.b + mash } };
  const hand = toWorld(posed, joints(posed).armR.end);
  const fl = 0.8 + 0.2 * Math.sin(t * 1.3) * Math.sin(t / 2.3);
  return (
    <g transform={camT(kf(t, [[0, 960], [len, 975]], (x) => x), 540, kf(t, [[0, 1], [len, 1.06]], (x) => x))}>
      <g filter="url(#blur6)" transform={camT(760, 500, 1.5)}>
        <Lounge t={t + 90} id="l2" tv={0.3} veil={0.55} />
      </g>
      {/* the sofa behind him */}
      <path d="M -200 1200 L -200 640 Q -190 540 -60 520 L 1120 520 Q 1250 540 1260 640 L 1260 1200 Z" fill="#26383C" />
      <path d="M 470 520 L 460 880" stroke="#1C2A2E" strokeWidth={8} />
      <path d="M -60 520 L 1120 520" stroke="#6FA8FF" strokeWidth={3} opacity={0.4} />
      <rect x={-240} y={868} width={1560} height={420} fill="#2E4246" />
      <Hero look={PIP} pose={{ ...posed, ...faceAt(t, [[0, 'neutral'], [8, 'smug']]), glint: 1, glintColor: AMBER }} rimId="rimBlue" shadow={0} />
      <GamePad x={hand.x + 8} y={hand.y + 10} s={1.55} rot={-10} />
      <Mitt x={hand.x + 56} y={hand.y - 22 + mash} rot={-60} s={2.1} />
      {/* the TV's light, from the right */}
      <Glow x={1500} y={480} r={900} kind="cool" o={0.42 * fl} />
      <Foreground blur={16}>
        <rect x={1650} y={-100} width={420} height={1300} fill="#07090F" />
      </Foreground>
    </g>
  );
};

// ---------- S3: insert, the TV fills the frame: the last hit, the boss bursts, YOU WIN ----------
const BOSS = ['X........X', 'XX......XX', '.XXXXXXXX.', 'XXXOOOOXXX', 'XXXOKKOXXX', 'XXXOOOOXXX', 'XXXXXXXXXX', 'XWWXWWXWWX', '.XXXXXXXX.'];
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const hit = 5;
  const gone = t >= hit + 4;
  const bar = kf(t, [[0, 0.1], [hit, 0.1], [hit + 2, 0]], (x) => x);
  const cell = 34;
  const bx = 980;
  const by = 300 + Math.sin(t / 2) * 6;
  const heroX = kf(t, [[0, 330], [hit - 1, 700], [hit + 3, 560]], (x) => x);
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1], [len, 1.05]], (x) => x))}>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#06070E" />
      {/* the screen */}
      <rect x={70} y={40} width={1780} height={960} rx={22} fill="#141A46" />
      <rect x={70} y={40} width={1780} height={360} rx={22} fill="#1E2A6A" />
      {[260, 640, 1180, 1560].map((x, i) => <path key={x} d={`M ${x} 700 l 90 -130 l 90 130 Z`} fill="#27337A" opacity={0.8 - i * 0.05} />)}
      <rect x={70} y={700} width={1780} height={300} fill="#2F6E5E" />
      {Array.from({ length: 22 }).map((_, i) => <rect key={i} x={70 + i * 82} y={700} width={40} height={24} fill="#245648" />)}
      {/* the bar */}
      <rect x={520} y={96} width={880} height={38} fill="#0B0816" stroke={UI.text} strokeWidth={5} />
      <rect x={526} y={102} width={868 * bar} height={26} fill={UI.bad} />
      {/* the boss: an original pixel block with teeth */}
      {!gone
        ? BOSS.map((row, y) =>
            row.split('').map((ch, x) =>
              ch === '.' ? null : <rect key={`${x}-${y}`} x={bx + x * cell} y={by + y * cell} width={cell + 1} height={cell + 1} fill={t >= hit && t < hit + 2 ? '#FFFFFF' : ch === 'O' ? '#F6EFE3' : ch === 'K' ? '#14121C' : ch === 'W' ? '#F6EFE3' : '#C8503A'} />,
            ),
          )
        : null}
      {/* the hero: a small hooded sprite with a sword */}
      <g transform={`translate(${heroX} 560)`}>
        <rect x={0} y={0} width={80} height={80} fill="#2E2B3D" />
        <rect x={16} y={18} width={52} height={40} fill="#F6EFE3" />
        <rect x={46} y={30} width={10} height={12} fill="#14121C" />
        <rect x={0} y={80} width={80} height={60} fill="#2E2B3D" />
        <rect x={80} y={70} width={110} height={16} fill="#E9C46A" />
      </g>
      {/* the burst */}
      {t >= hit
        ? Array.from({ length: 26 }).map((_, i) => {
            const a = rnd(3, i) * Math.PI * 2;
            const d = (t - hit) * (20 + rnd(4, i) * 34);
            return <rect key={i} x={bx + 170 + Math.cos(a) * d} y={by + 150 + Math.sin(a) * d + (t - hit) * (t - hit) * 1.4} width={26} height={26} fill={i % 2 ? '#C8503A' : '#E9C46A'} opacity={clamp(1 - (t - hit) / 22)} />;
          })
        : null}
      {t >= hit + 3 ? (
        <g transform={`translate(960 430) scale(${backOut(clamp((t - hit - 3) / 6))})`}>
          <text textAnchor="middle" fontFamily={FONT.ui} fontSize={190} fill="#FFE27A" stroke="#14121C" strokeWidth={16} paintOrder="stroke">YOU WIN</text>
        </g>
      ) : null}
      {/* scan lines and the glass */}
      {Array.from({ length: 48 }).map((_, i) => <rect key={i} x={70} y={40 + i * 20} width={1780} height={5} fill="#000" opacity={0.16} />)}
      <path d="M 120 60 L 520 60 L 300 520 L 120 520 Z" fill="#FFFFFF" opacity={0.05} />
      {/* the thumbs on the pad, near camera */}
      <Foreground blur={6}>
        <g transform={`translate(960 ${1062 + Math.sin(t * 2.2) * 5})`}>
          <GamePad x={0} y={0} s={3.4} />
          <Mitt x={-200} y={-62 + Math.sin(t * 2.7) * 12} rot={160} s={4.4} />
          <Mitt x={200} y={-62 - Math.sin(t * 2.7) * 12} rot={200} s={4.4} side={-1} />
        </g>
      </Foreground>
    </g>
  );
};

// ---------- S4: insert, the wall in the hall: Mum's hand flips the switch ----------
const SW = { x: 900, y: 500 };
export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const at = 22; // the click lands in the pause after "out"
  const on = t < at;
  const off = clamp((t - at) / 2);
  const hand = { x: kf(t, [[0, 1500], [10, 1050], [at - 2, 1000], [at, 960], [at + 8, 1020], [len, 1300]]), y: kf(t, [[0, 900], [10, 400], [at - 2, 410], [at, 500], [at + 8, 560], [len, 900]]) };
  const MUM = LOOKS.mom;
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1], [len, 1.07]], (x) => x))}>
      <rect x={-400} y={-400} width={2720} height={1880} fill={on ? '#B98A5C' : '#14182C'} />
      {/* wallpaper, a door edge, a framed photo, a hook with a coat */}
      <g opacity={on ? 0.32 : 0.5} stroke={on ? '#8E6442' : '#0E1120'} strokeWidth={4}>
        {Array.from({ length: 16 }).map((_, i) => <path key={i} d={`M ${-100 + i * 140} -300 L ${-100 + i * 140} 1400`} />)}
      </g>
      <rect x={-400} y={-400} width={700} height={1880} fill={on ? '#6E4A30' : '#0C0F1E'} />
      <rect x={270} y={-400} width={24} height={1880} fill={on ? '#E6BC84' : '#232842'} />
      <rect x={1380} y={120} width={360} height={270} fill="#2A1C18" />
      <rect x={1402} y={142} width={316} height={226} fill={on ? '#E0B98A' : '#262C48'} />
      <circle cx={1500} cy={260} r={42} fill={on ? '#8E6A4A' : '#171B30'} />
      <circle cx={1610} cy={270} r={32} fill={on ? '#8E6A4A' : '#171B30'} />
      <WallSwitch x={SW.x} y={SW.y} s={1.25} off={on ? 0 : 1} lit={on ? 1 : 0.1} />
      {/* the hall lamp's pool, gone at the click */}
      {on ? <Glow x={560} y={120} r={1300} o={0.42} /> : null}
      {!on ? <rect x={-400} y={-400} width={2720} height={1880} fill="#050816" opacity={0.42 * (1 - off * 0.35)} /> : null}
      <g filter={on ? 'url(#rimR)' : 'url(#rimBlue)'}>
        <Sleeve d={`M ${hand.x + 30} ${hand.y + 40} Q ${hand.x + 180} ${hand.y + 220} ${hand.x + 620} ${hand.y + 720}`} w={126} look={{ ...MUM, limb: on ? MUM.jacket : '#2E2436' }} />
        <Mitt x={hand.x} y={hand.y} rot={140} s={5.6} look={{ ...MUM, hand: on ? MUM.hand : '#54506A' }} point side={-1} />
      </g>
    </g>
  );
};

// ---------- S5: close medium, moonlit: Pip wrestles the first chord ----------
export const S5: React.FC<ShotProps> = ({ t }) => {
  const P0 = { ...basePose, x: 930, y: 900, scale: 2.2, yaw: 0.45, look: 0.75, armL: { a: 4, b: 0 }, armR: { a: 4, b: 0 }, tilt: 5 };
  const pose = poseAt(t, [{ f: 0, p: { ...P0, headTilt: 6 } }, { f: 8, p: { headTilt: 12, tilt: 8 } }, { f: 20, p: { headTilt: 8 } }], P0);
  const gx = 900;
  const gy = 780;
  const strum = Math.sin(t * 0.9) * 26;
  const elbow = { x: 760, y: 1000 };
  return (
    <g>
      <g filter="url(#blur6)" transform={camT(1010, 470, 2)}>
        <Lounge t={t + 200} id="l5" tv={0} veil={0.3} />
      </g>
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral'], [7, 'worried']]), glint: 0.9, glintColor: AMBER }} rimId="rimBlue" shadow={0} />
      <Guitar x={gx} y={gy} s={1.9} rot={-16} ping={t > 7 ? t - 7 : 0} />
      <Sleeve d={`M 810 730 Q ${elbow.x - 30} ${elbow.y - 130} ${gx - 40} ${gy + 110 + strum * 0.4}`} w={60} />
      <Mitt x={gx - 40} y={gy + 86 + strum * 0.4} rot={160} s={2.6} />
      <Sleeve d="M 1000 744 Q 1240 830 1400 650" w={56} />
      <Mitt x={1420} y={630} rot={-112} s={2.5} side={-1} />
      {/* the string that lets go */}
      {t > 7 ? <path d={`M 1000 ${738 - (t - 7) * 3} q 90 ${-40 + Math.sin(t) * 20} 180 ${-10 - (t - 7) * 4} q 80 ${10 + Math.cos(t * 1.3) * 20} 150 -50`} stroke="#F0E6CF" strokeWidth={3} fill="none" opacity={clamp(1 - (t - 7) / 14)} /> : null}
    </g>
  );
};

// ---------- S6: low angle, full figure: he has it. Foot on the amp, the moon behind him ----------
const S6_STAND = { x: 930, y: 700, scale: 1.25 };
export const S6: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { ...S6_STAND, yaw: 0.35, look: 0.5, tilt: 2, armL: { a: 4, b: 0 }, armR: { a: 4, b: 0 }, legL: { a: -8, b: 6 }, legR: { a: 42, b: -82 }, squash: 0.05 } },
    { f: 3, p: { tilt: -9, headTilt: -13, squash: -0.02 }, ease: easeOut },
    { f: 8, p: { tilt: -7 } },
    { f: 25, p: { tilt: -8, headTilt: -10 } },
  ]);
  const gr = pose.tilt * 0.6;
  const g = { x: pose.x + 12, y: pose.y - 34 };
  const zoom = kf(t, [[0, 1.62], [3, 1.78], [len, 1.86]], easeOut);
  const strum = t < 4 ? kf(t, [[0, -60], [3, 66]], easeOut) : 66 + Math.sin(t * 0.5) * 6;
  return (
    <g transform={camT(985, 596, zoom)}>
      <Lounge t={t + 220} id="l6" tv={0.15} veil={0.26} />
      <Glow x={g.x + 60} y={g.y} r={320} kind="red" o={0.3} />
      <Amp x={1098} y={884} s={0.95} led={1} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'happy']]), glint: 0, handL: 'open', handR: 'open' }} rimId="rimBlue" shadow={1} />
      <Guitar x={g.x} y={g.y} s={0.95} rot={-34 + gr} />
      <Sleeve d={`M ${pose.x - 34} ${pose.y - 124} Q ${pose.x - 64} ${pose.y - 40} ${g.x - 22} ${g.y + strum * 0.42}`} w={28} />
      <Mitt x={g.x - 22} y={g.y + strum * 0.42 - 8} rot={170} s={1.2} />
      <Sleeve d={`M ${pose.x + 40} ${pose.y - 128} Q ${pose.x + 112} ${pose.y - 94} ${g.x + 178} ${g.y - 110}`} w={26} />
      <Mitt x={g.x + 190} y={g.y - 122} rot={-120} s={1.2} side={-1} />
      <g transform={`translate(${g.x} ${g.y}) scale(0.34) translate(${-g.x} ${-g.y})`}>
        <FocusRings x={g.x} y={g.y} t={t - 1} r0={60} color="#FFE7B3" />
      </g>
      <Sparkle x={g.x + 250} y={g.y - 190} t={t - 3} s={1.2} />
      {/* the notes in the air */}
      {[0, 1, 2].map((i) => {
        const nt = t - 4 - i * 5;
        return nt > 0 ? <path key={i} d="M 0 0 l 0 -34 l 22 8 l 0 9 l -22 -8 M 0 0 a 9 7 0 1 1 -18 0 a 9 7 0 1 1 18 0" fill="#FFE27A" stroke="#FFE27A" strokeWidth={3} transform={`translate(${1090 + i * 44} ${830 - nt * 8}) rotate(${Math.sin(nt / 3) * 12})`} opacity={clamp(1 - nt / 20)} /> : null;
      })}
      <Foreground blur={10}>
        <path d="M 380 1000 Q 430 880 560 860 Q 640 880 640 1000 Z" fill="#08090F" />
      </Foreground>
    </g>
  );
};

// ---------- S7: medium, sis asleep with the cat on her duvet. Her nightlight clicks off ----------
const SIS_STILL = { x: 1072, y: 672, scale: 1.25 };
const SisBed: React.FC<{ t: number; lit: number }> = ({ t, lit }) => {
  const breath = Math.sin(t / 11);
  return (
    <g>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#28304E" />
      <rect x={-400} y={880} width={2720} height={600} fill="#1C1A2A" />
      <rect x={-400} y={872} width={2720} height={12} fill="#14121E" />
      {/* the window, the moon, glow-stars stuck on the wall, her drawings */}
      <rect x={-20} y={110} width={430} height={420} fill="#0E1636" />
      <Moon x={120} y={220} r={48} />
      <Stars seed={7} x0={-20} y0={110} w={430} h={300} t={t} n={22} />
      <g fill="#1E1824">
        <rect x={-30} y={100} width={450} height={14} />
        <rect x={-30} y={528} width={450} height={14} />
        <rect x={190} y={110} width={10} height={420} />
        <rect x={406} y={100} width={14} height={440} />
      </g>
      <path d="M -30 100 L 80 100 Q 60 340 20 560 L -30 560 Z" fill="#3E4670" />
      {[[560, 170], [720, 110], [880, 210], [1010, 120], [1240, 180], [1390, 110], [1500, 230]].map(([x, y], i) => (
        <path key={i} d="M 0 -20 L 6 -6 L 20 -6 L 8 3 L 13 17 L 0 8 L -13 17 L -8 3 L -20 -6 L -6 -6 Z" transform={`translate(${x} ${y}) scale(${0.7 + (i % 3) * 0.2})`} fill="#CFE8B8" opacity={0.42 + 0.1 * Math.sin(t / 9 + i)} />
      ))}
      <rect x={700} y={250} width={150} height={120} fill="#E6D4B6" transform="rotate(-4 775 310)" />
      <path d="M 730 340 L 770 280 L 810 340 Z M 790 300 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0" fill="#F28C6A" transform="rotate(-4 775 310)" />
      <rect x={900} y={270} width={120} height={150} fill="#D9C8A8" transform="rotate(3 960 345)" />
      <circle cx={960} cy={330} r={34} fill="#3E8C86" transform="rotate(3 960 345)" />

      {/* the bed: headboard, frame, pillow */}
      <rect x={1400} y={430} width={46} height={450} rx={16} fill="#4A3A44" />
      <rect x={-300} y={760} width={1740} height={90} fill="#3E3038" />
      <rect x={-300} y={720} width={1720} height={50} fill="#D8D2C4" />
      {[[1400, 880], [60, 880]].map(([x, y]) => <rect key={x} x={x - 16} y={840} width={30} height={y - 840 + 20} fill="#2E242A" />)}
      <ellipse cx={1250} cy={680} rx={190} ry={68} fill="#E4DDCC" />
      <path d="M 1100 700 Q 1250 640 1400 690" stroke="#C9C0AE" strokeWidth={4} fill="none" />
      <Hero look={LOOKS.sis} pose={{ ...basePose, ...SIS_STILL, spin: 90, yaw: 0, blink: 1, expr: 'neutral', headTilt: 2, armL: { a: 1, b: 0 }, armR: { a: 1, b: 0 }, legL: { a: 1, b: 0 }, legR: { a: -1, b: 0 } }} rimId={lit > 0.5 ? 'rimL' : 'rimBlueL'} shadow={0} />
      {/* the duvet, rising and falling */}
      <g transform={`translate(0 ${720}) scale(1 ${1 + breath * 0.022}) translate(0 -720)`}>
        <path d="M -320 860 L -320 590 Q 300 450 720 464 Q 900 464 1030 460 Q 1096 458 1112 530 Q 1136 690 1120 860 Z" fill="#4E5E92" />
        <path d="M -320 590 Q 300 450 720 464 Q 900 464 1030 460 Q 1096 458 1112 530" stroke="#7A8AC4" strokeWidth={4} fill="none" opacity={0.7} />
        <path d="M 1030 460 Q 1096 458 1112 530 Q 1134 680 1122 790 Q 1006 650 1030 460 Z" fill="#E4DDCC" />
        {[150, 450, 760].map((x) => <path key={x} d={`M ${x} 520 Q ${x + 40} 700 ${x + 10} 860`} stroke="#43527F" strokeWidth={4} fill="none" />)}
      </g>
      <Cat x={560} y={466 + breath * 2} mood="sleep" f={t} />
      {/* the bedside table and the nightlight */}
      <rect x={1520} y={640} width={280} height={240} fill="#4A3A36" />
      <rect x={1510} y={626} width={300} height={18} fill="#5E4A44" />
      <rect x={1556} y={690} width={208} height={80} fill="none" stroke="#2E2220" strokeWidth={4} />
      <circle cx={1660} cy={730} r={7} fill="#C9A46A" />
      <rect x={1560} y={596} width={84} height={30} fill="#7A4A4A" />
      <rect x={1566} y={574} width={72} height={22} fill="#4A6A7A" />
      <Nightlight x={1700} y={626} s={1.25} on={lit} />
    </g>
  );
};
export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const at = 21;
  const on = t < at ? 1 : 0;
  return (
    <g transform={camT(kf(t, [[0, 1130], [len, 1160]], (x) => x), 520, kf(t, [[0, 1.12], [len, 1.2]], (x) => x))}>
      <SisBed t={t + 30} lit={on} />
      {on ? (
        <g>
          <LightVeil id="s7a" lights={[[1660, 500, 760], [200, 300, 300]]} o={0.3} />
          <Glow x={1686} y={520} r={760} o={0.6} />
          <Glow x={1686} y={520} r={260} o={0.7} />
          <Cone d="M 1630 560 L 1740 560 L 1980 880 L 1320 880 Z" o={0.3} />
        </g>
      ) : (
        <g>
          <LightVeil id="s7b" lights={[[200, 320, 560]]} o={0.62} />
          <circle cx={120} cy={220} r={420} fill="url(#kitMoonBloom)" opacity={0.3} />
          <path d="M 80 540 L 400 540 L 1020 880 L 420 880 Z" fill="#9FC0FF" opacity={0.06} style={{ mixBlendMode: 'screen' }} />
        </g>
      )}
      <Foreground blur={16}>
        <circle cx={1960} cy={1060} r={250} fill="#05060C" />
      </Foreground>
    </g>
  );
};

// ---------- S8: low, from the bed: the door swings open on the hall, a figure, two amber eyes ----------
export const S8: React.FC<ShotProps> = ({ t, len }) => {
  const open = kf(t, [[0, 0.06], [7, 0.12], [27, 0.92]]);
  const dx0 = 730;
  const dx1 = 1180;
  const leaf = lerp(dx0 + 40, dx1 + 340, open);
  const pose = { ...basePose, x: 955, y: 590, scale: 1.72, yaw: 0, armL: { a: 5, b: -4 }, armR: { a: 5, b: -4 }, expr: 'neutral' as const, glint: clamp((t - 8) / 6), glintColor: AMBER, headTilt: kf(t, [[10, 0], [30, -5]]) };
  return (
    <g transform={camT(960, 560, kf(t, [[0, 1.02], [len, 1.1]], (x) => x))}>
      {/* the room: dark wall, the door opening, a skirting board, a shelf */}
      <rect x={-400} y={-400} width={2720} height={1880} fill="#171B30" />
      <rect x={-400} y={950} width={2720} height={500} fill="#141220" />
      <rect x={-400} y={936} width={2720} height={16} fill="#0E0D18" />
      <rect x={1330} y={330} width={330} height={16} fill="#2A2230" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={1350 + i * 46} y={250 - (i % 2) * 18} width={34} height={80 + (i % 2) * 18} fill={['#3A2E3E', '#2E3A4A', '#40324A'][i % 3]} />)}
      <rect x={240} y={260} width={230} height={280} fill="#1E1A28" />
      <rect x={256} y={276} width={198} height={248} fill="#2E3A50" />
      {/* the hall behind */}
      <rect x={dx0} y={70} width={dx1 - dx0} height={880} fill="#E9A85E" />
      <rect x={dx0} y={70} width={dx1 - dx0} height={340} fill="#FFD9A0" />
      <path d={`M ${dx0} 950 L ${dx1} 950 L ${dx1 - 90} 790 L ${dx0 + 90} 790 Z`} fill="#8A5A36" />
      <Glow x={955} y={150} r={620} o={0.85} />
      {/* the figure, then the door leaf swinging away over it */}
      <Hero look={PIP_SHADE} pose={pose} rimId="rimR" shadow={0} />
      <rect x={dx0 - 22} y={48} width={22} height={906} fill="#0E0C14" />
      <rect x={dx1} y={48} width={22} height={906} fill="#0E0C14" />
      <rect x={dx0 - 22} y={48} width={dx1 - dx0 + 44} height={22} fill="#0E0C14" />
      <polygon points={`${dx1},60 ${leaf},${60 - 150 * open} ${leaf},${950 + 190 * open} ${dx1},952`} fill="#2A2436" stroke="#120E18" strokeWidth={5} />
      <polygon points={`${lerp(dx1, leaf, 0.14)},${130 - 20 * open} ${lerp(dx1, leaf, 0.86)},${130 - 130 * open} ${lerp(dx1, leaf, 0.86)},${470} ${lerp(dx1, leaf, 0.14)},${470}`} fill="none" stroke="#1C1826" strokeWidth={4} opacity={0.8} />
      {/* the wedge of light on the floor, reaching for the bed, the figure's shadow down the middle of it */}
      <polygon points={`${dx0},952 ${dx1},952 ${dx1 + 520 * open},1500 ${dx0 - 460 * open},1500`} fill="#FFB46A" opacity={0.22 * clamp(open * 2)} style={{ mixBlendMode: 'screen' }} />
      <polygon points={`${955 - 70},952 ${955 + 70},952 ${955 + 230},1500 ${955 - 230},1500`} fill="#05040A" opacity={0.75 * clamp(open * 2)} />
      <circle cx={955} cy={500} r={900 * open} fill="url(#g3warm)" opacity={0.1} style={{ mixBlendMode: 'screen' }} />
      {/* the foot of the bed and the blurred duvet near camera */}
      <Foreground blur={16}>
        <path d="M -400 1500 L -400 830 Q 140 760 520 900 Q 760 1000 860 1500 Z" fill="#0E1122" />
        <path d="M -400 830 Q 140 760 520 900" stroke="#3A4670" strokeWidth={10} fill="none" />
      </Foreground>
    </g>
  );
};

// ---------- S9: extreme close-up: he doesn't blink ----------
export const S9: React.FC<ShotProps> = ({ t, len }) => {
  const pose = { ...basePose, x: 960, y: 1180, scale: 3.8, yaw: 0.2, expr: 'neutral' as const, headTilt: kf(t, [[0, 0], [36, 7]], (x) => easeOut(x)), look: kf(t, [[0, 0.3], [20, 0.9]]) };
  return (
    <g transform={camT(960, kf(t, [[0, 560], [len, 500]], (x) => x), kf(t, [[0, 1], [len, 1.16]], (x) => x))}>
      <rect x={-400} y={-400} width={2720} height={1880} fill="#0B0D1A" />
      <circle cx={1760} cy={300} r={900} fill="url(#g3warm)" opacity={0.2} />
      <Hero look={PIP_DIM} pose={pose} rimId="rimR" shadow={0} />
      {/* the hall's light slides across one side of his face and leaves the rest in the dark */}
      <defs>
        <linearGradient id="s9dark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#05060E" stopOpacity={0.92} />
          <stop offset="58%" stopColor="#05060E" stopOpacity={0.5} />
          <stop offset="82%" stopColor="#05060E" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-400} y={-400} width={1800} height={1880} fill="url(#s9dark)" />
      {/* the eyes come back on top of the dark, so they're the brightest thing in frame */}
      {[-21, 21].map((cx) => {
        const e = eyeAt(pose, cx);
        return (
          <g key={cx}>
            <Glow x={e.x} y={e.y} r={170} kind="warm" o={0.55} />
            <ellipse cx={e.x} cy={e.y} rx={24} ry={36} fill={AMBER} />
            <circle cx={e.x + 8} cy={e.y - 12} r={8} fill="#FFFFFF" />
          </g>
        );
      })}
    </g>
  );
};

// ---------- S10: wide, the title over the dark block ----------
export const S10: React.FC<ShotProps> = ({ t, len }) => (
  <g>
    <g transform={camT(960, kf(t, [[0, 420], [len, 400]], (x) => x), kf(t, [[0, 0.82], [len, 0.86]], (x) => x))}>
      <Apartments t={t + 300} id="a10" level={(c, r) => (c === MY_WIN[0] && r === MY_WIN[1] ? 1 : 0)} others={1} />
    </g>
    <TitleCard t={t} lines={['WHAT IF YOU NEVER', 'NEEDED TO SLEEP?']} accent="SLEEP" accentT={39} y={150} size={118} />
  </g>
);

// ---------- S11: wide, the roof: a whole night goes by in two seconds. +8H, +8H, +8H ----------
export const S11: React.FC<ShotProps> = ({ t, len }) => {
  const up = clamp(t / 62);
  const sunY = lerp(960, 520, easeOut(up));
  const night = 1 - clamp((t - 8) / 46);
  const pose = poseAt(t, [
    { f: 0, p: { x: 800, y: 660, scale: 1.05, yaw: 0.5, look: 0.7, armL: { a: 8, b: -8 }, armR: { a: 8, b: -8 } } },
    { f: 16, p: { squash: 0.05, armL: { a: 20, b: 20 }, armR: { a: 20, b: 20 } } },
    { f: 26, p: { armL: { a: 158, b: 8 }, armR: { a: 150, b: 8 }, squash: -0.05, yaw: 0.25 }, ease: easeOut },
    { f: 32, p: { armL: { a: 148, b: 14 }, armR: { a: 142, b: 14 }, squash: 0 } },
    { f: len, p: { armL: { a: 152, b: 12 } } },
  ]);
  return (
    <g transform={camT(930, 570, kf(t, [[0, 1.16], [len, 1.24]], (x) => x))}>
      <Rooftop t={t + 400} sunX={1230} sunY={sunY} cityLit={1.4} blackout={up} />
      <rect x={-400} y={-400} width={2720} height={1880} fill="#07091C" opacity={0.76 * night} />
      <Stars seed={3} x0={-200} y0={-100} w={2300} h={600} t={t} n={70} o={night} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'smug'], [24, 'happy']]) }} rimId={night > 0.5 ? 'rimBlue' : 'rimR'} shadow={1} />
      <FloatLabel x={1130} y={500} t={t - 3} text="+8H" size={96} />
      <FloatLabel x={1370} y={420} t={t - 33} text="+8H" size={108} />
      <FloatLabel x={520} y={470} t={t - 58} text="+8H" size={120} />
    </g>
  );
};

// ---------- S12: the schematic: the sleepers, back through 450 million years, and one awake ----------
const LIFE: { x: number; d: string; eye: [number, number]; label: string }[] = [
  { x: 300, label: 'FISH', eye: [-34, -6], d: 'M -66 0 Q -24 -40 28 0 Q -24 40 -66 0 Z M 28 0 L 66 -28 L 66 28 Z' },
  { x: 575, label: 'REPTILE', eye: [-52, -9], d: 'M -78 -2 Q -62 -22 -36 -12 Q 0 -22 34 -8 Q 66 2 96 -6 Q 70 18 34 14 Q 0 18 -36 8 Q -62 12 -78 -2 Z M -24 12 l -12 22 M 22 14 l 14 20' },
  { x: 850, label: 'BIRD', eye: [-34, -24], d: 'M -62 -22 L -46 -30 Q -30 -48 -8 -30 Q 40 -22 60 12 L 90 22 L 50 28 Q 0 42 -30 8 Q -44 -10 -46 -18 Z M -2 40 l 0 22 M 22 38 l 0 24' },
  { x: 1125, label: 'CAT', eye: [-42, -12], d: 'M -66 22 Q -74 -14 -56 -22 L -60 -46 L -40 -32 L -22 -46 L -22 -20 Q 40 -40 72 0 Q 90 30 56 34 Q -30 44 -66 22 Z' },
  { x: 1400, label: 'HUMAN', eye: [-48, -8], d: 'M -74 -6 a 22 22 0 1 0 44 0 a 22 22 0 1 0 -44 0 M -24 8 Q 30 -24 92 8 L 92 30 L -74 30 Z' },
];
export const S12: React.FC<ShotProps> = ({ t, len }) => {
  const line = 660;
  const youT = 84;
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1], [len, 1.05]], (x) => x))}>
      <Schematic t={t} id="s12" />
      <SchLabel x={960} y={170} t={t - 14} text="AT LEAST" size={46} color={SCH.dim} />
      <CountUp x={960} y={330} t={t - 18} to={450000000} dur={48} size={156} />
      <SchLabel x={960} y={420} t={t - 58} text="YEARS OF SLEEP" size={52} />
      <DrawOn d={`M 150 ${line + 120} L 1790 ${line + 120}`} t={t - 6} dur={46} color={SCH.dim} width={4} />
      {LIFE.map((a, i) => {
        const at = 12 + i * 9;
        const p = t - at;
        return (
          <g key={a.label} transform={`translate(${a.x} ${line}) scale(1.4)`}>
            <DrawOn d={a.d} t={p} dur={8} color={SCH.line} width={3.6} />
            {p > 8 ? <path d={`M ${a.eye[0] - 7} ${a.eye[1]} q 7 6 14 0`} stroke={SCH.line} strokeWidth={3.4} fill="none" strokeLinecap="round" /> : null}
            {p > 10 ? <text x={68} y={-46 - (t % 30)} fontFamily={FONT.ui} fontSize={22} fill={SCH.dim} opacity={1 - (t % 30) / 30}>z</text> : null}
            <g transform="scale(0.72)">
              <SchLabel x={0} y={136} t={p - 2} text={a.label} size={40} color={SCH.line} />
            </g>
          </g>
        );
      })}
      {/* then you: the only open eye on the sheet */}
      <g transform={`translate(1680 ${line - 10}) scale(1.5)`}>
        <DrawOn d="M -24 -30 a 24 24 0 1 0 48 0 a 24 24 0 1 0 -48 0 M 0 -6 L 0 44 M 0 44 L -20 80 M 0 44 L 20 80 M 0 8 L -26 34 M 0 8 L 26 34" t={t - youT} dur={8} color={SCH.live} width={4} />
        {t > youT + 6 ? <circle cx={8} cy={-32} r={5} fill="#FFE27A" style={{ filter: `drop-shadow(0 0 8px ${SCH.glow})` }} /> : null}
        <g transform="scale(0.7)">
          <SchLabel x={0} y={166} t={t - youT - 4} text="YOU" size={46} color={SCH.live} />
        </g>
      </g>
      <g transform={`translate(1680 ${line - 40}) scale(0.42) translate(-1680 ${40 - line})`}>
        <FocusRings x={1680} y={line - 40} t={t - youT - 5} r0={90} color={SCH.live} />
      </g>
    </g>
  );
};

// ---------- S13: macro, under water: a jellyfish, slowing right down. The scan finds no brain ----------
export const S13: React.FC<ShotProps> = ({ t, len }) => {
  const push = 44; // "No": the camera jumps in on the bell
  const rate = lerp(9, 24, clamp(t / 40));
  const phase = t < 40 ? t / 9 - (t * t) / 2600 : 4.44 - 0.615 + (t - 40) / 24;
  const pulse = 0.5 + 0.5 * Math.sin(phase * 1.6);
  const z = t < push ? kf(t, [[0, 0.96], [push, 1.02]], (x) => x) : kf(t, [[push, 1.02], [push + 7, 1.34], [len, 1.42]], easeOut);
  const scanOn = clamp((t - push - 4) / 7);
  const scanT = t - push - 4;
  return (
    <g>
      <g transform={camT(960, t < push ? 540 : kf(t, [[push, 540], [push + 7, 470]], easeOut), z)}>
        <defs>
          <linearGradient id="s13water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#123A5E" />
            <stop offset="55%" stopColor="#081F3A" />
            <stop offset="100%" stopColor="#030A18" />
          </linearGradient>
        </defs>
        <rect x={-400} y={-400} width={2720} height={1880} fill="url(#s13water)" />
        {[260, 660, 1180, 1560].map((x, i) => (
          <path key={x} d={`M ${x} -400 L ${x + 110} -400 L ${x + 40 + Math.sin(t / 40 + i) * 80} 1300 L ${x - 260 + Math.sin(t / 40 + i) * 80} 1300 Z`} fill="#9FE0FF" opacity={0.05} style={{ mixBlendMode: 'screen' }} />
        ))}
        <Dust t={t * 2} seed={41} x0={-200} y0={-200} w={2320} h={1500} n={70} o={0.35} />
        <g filter="url(#blur6)" opacity={0.4}>
          <Jellyfish x={1560} y={250} r={70} t={t + 60} pulse={0.5 + 0.5 * Math.sin(phase * 1.1)} />
          <Jellyfish x={330} y={760} r={92} t={t + 120} pulse={0.5 + 0.5 * Math.sin(phase * 0.9)} />
        </g>
        <Jellyfish x={960} y={400 + Math.sin(t / 34) * 10} r={230} t={t} pulse={pulse} />
        <circle cx={960} cy={0} r={rate * 0} fill="none" />
      </g>
      {/* the scan: a dashed ring on the bell and the verdict, kept flat on the frame so it stays readable */}
      {scanOn > 0 ? (
        <g>
          <circle cx={960} cy={scanT < 7 ? 440 : 412} r={150 + (1 - scanOn) * 80} fill="#7FD4FF" opacity={0.06} />
          <circle cx={960} cy={scanT < 7 ? 440 : 412} r={150 + (1 - scanOn) * 80} fill="none" stroke="#DDF6FF" strokeWidth={5} strokeDasharray="16 12" strokeDashoffset={-t * 2} opacity={scanOn} />
          <path d="M 1092 330 L 1300 240" stroke="#DDF6FF" strokeWidth={4} opacity={scanOn} />
          <Tag x={1450} y={220} t={scanT - 4} text="BRAIN: 0" w={340} mark="x" markT={14} />
        </g>
      ) : null}
      <SchLabel x={960} y={1030} t={t - 78} text="SLEEP-LIKE STATE  /  CURRENT BIOLOGY, 2017" size={26} color="#9FC6E0" />
    </g>
  );
};

// ---------- S14: over the shoulder: Pip's window, the block opposite all dark. In the pause, one comes on ----------
const FAR_AT = 47; // the click, after "doesn't"
export const S14: React.FC<ShotProps> = ({ t, len }) => {
  const on = t >= FAR_AT;
  const lv = !on ? 0 : t < FAR_AT + 1 ? 0.55 : t < FAR_AT + 2 ? 0.2 : t < FAR_AT + 3 ? 1 : 0.92 + 0.08 * Math.sin(t * 1.1);
  const jolt = settle(t - FAR_AT - 3, 12, 1.2, 5);
  return (
    <g>
      <g transform={camT(kf(t, [[0, 1180], [len, 1195]], (x) => x), 400, kf(t, [[0, 1.02], [len, 1.12]], (x) => x))}>
        <Apartments t={t + 600} id="a14" seed={16} wall="#25263E" level={(c, r) => (c === THEIR_WIN[0] && r === THEIR_WIN[1] ? lv : 0)} cold={THEIR_WIN} others={1} moon={false} />
      </g>
      {/* the room's own light on the glass, and the frame round the view */}
      <rect x={0} y={0} width={1920} height={1080} fill="#FFB46A" opacity={0.045} />
      <path d="M 980 0 L 1320 0 L 700 1080 L 360 1080 Z" fill="#FFD9A0" opacity={0.04} />
      <g fill="#2E2420">
        <rect x={0} y={0} width={1920} height={70} />
        <rect x={0} y={1000} width={1920} height={80} />
        <rect x={0} y={0} width={110} height={1080} />
        <rect x={1810} y={0} width={110} height={1080} />
      </g>
      <rect x={952} y={70} width={16} height={930} fill="#2A201C" />
      <rect x={110} y={70} width={1700} height={5} fill="#FFB15A" opacity={0.5} />
      <rect x={110} y={995} width={1700} height={6} fill="#FFB15A" opacity={0.65} />
      <rect x={0} y={1000} width={1920} height={14} fill="#54403A" />
      {/* a mug on the sill, keeping him company */}
      <g transform="translate(1500 1000)">
        <rect x={-34} y={-66} width={68} height={66} rx={8} fill="#8A4A3E" />
        <path d="M 34 -52 q 28 6 0 34" stroke="#8A4A3E" strokeWidth={9} fill="none" />
        <path d="M -34 -60 L 34 -60" stroke="#FFC98A" strokeWidth={3} opacity={0.6} />
      </g>
      <g transform={`translate(0 ${jolt})`}>
        <Foreground blur={3}>
          <PipBack x={520} y={700} s={1.24} />
        </Foreground>
      </g>
      <Glow x={-60} y={820} r={700} o={0.34} />
    </g>
  );
};

// ---------- S15: close-up: he's seen it ----------
export const S15: React.FC<ShotProps> = ({ t, len }) => {
  const pose = { ...basePose, x: 860, y: 1130, scale: 3.2, yaw: 0.5, look: 1, headTilt: -3, expr: 'shock' as const, glint: 0.85, glintColor: AMBER };
  return (
    <g transform={camT(960, 540, kf(t, [[0, 1], [len, 1.1]], easeOut))}>
      <g filter="url(#blur16)">
        <rect x={-400} y={-400} width={2720} height={1880} fill="#3A2822" />
        <rect x={-200} y={80} width={460} height={420} fill="#6E4A34" />
        <circle cx={120} cy={300} r={260} fill="#FFB46A" opacity={0.5} />
        <rect x={1650} y={-200} width={500} height={1500} fill="#0E1226" />
      </g>
      <Hero look={PIP} pose={pose} rimId="rimBlue" shadow={0} />
      <Glow x={1760} y={380} r={900} kind="cool" o={0.6} />
    </g>
  );
};

// ---------- S16: the far window, right up close: a figure in a suit waves. Click. Two eyes stay on. Then nothing ----------
const OFF_AT = 40;
const EYES_GONE = 51;
export const S16: React.FC<ShotProps> = ({ t, len }) => {
  const lit = t < OFF_AT;
  const lift = kf(t, [[0, 40], [9, 152]], easeOut);
  const wave = t > 9 ? Math.sin((t - 9) / 3.1) * 15 : 0;
  const pose = { ...basePose, x: 960, y: 860, scale: 2.05, yaw: 0.05, look: 0, armL: { a: 4, b: -4 }, armR: { a: lift + wave, b: 6 + wave * 0.5 }, headTilt: kf(t, [[0, 0], [14, 6]]) };
  const z = kf(t, [[0, 1], [len, 1.16]], (x) => x);
  const cam = camT(960, 500, z);
  if (t >= EYES_GONE) return <rect x={-400} y={-400} width={2720} height={1880} fill="#000" />;
  return (
    <g transform={cam}>
      {/* the bricks round the window */}
      <rect x={-400} y={-400} width={2720} height={1880} fill="#14152A" />
      {Array.from({ length: 20 }).map((_, r) => Array.from({ length: 16 }).map((__, c) => (
        <rect key={`${r}-${c}`} x={-420 + c * 190 + (r % 2) * 95} y={-300 + r * 84} width={180} height={76} fill={lit ? '#1E2036' : '#0A0B14'} />
      )))}
      <rect x={380} y={70} width={1160} height={900} fill={lit ? COLD : '#04050A'} />
      {lit ? (
        <g>
          <rect x={380} y={70} width={1160} height={360} fill="#FFFFFF" opacity={0.6} />
          <circle cx={960} cy={420} r={860} fill="url(#g3cool)" opacity={0.65} />
          <path d="M 1210 70 L 1210 190" stroke="#2A3244" strokeWidth={5} />
          <circle cx={1210} cy={210} r={26} fill="#FFFFFF" />
          <Glow x={1210} y={210} r={300} kind="cool" o={0.9} />
          <path d="M 384 70 L 500 70 Q 470 500 520 966 L 384 966 Z" fill="#9FB6D0" opacity={0.75} />
          <clipPath id="s16room"><rect x={380} y={70} width={1160} height={900} /></clipPath>
          <g clipPath="url(#s16room)">
            <g style={{ filter: 'brightness(0.15) contrast(1.1)' }}>
              <Hero look={LOOKS.suit} pose={pose} rimId="rimBlue" shadow={0} />
            </g>
          </g>
        </g>
      ) : null}
      {/* the frame and the centre bar */}
      <g fill="#0B0C16">
        <rect x={350} y={40} width={1220} height={34} />
        <rect x={350} y={966} width={1220} height={36} />
        <rect x={350} y={40} width={34} height={960} />
        <rect x={1536} y={40} width={34} height={960} />
      </g>
      <rect x={330} y={1000} width={1260} height={26} fill={lit ? '#3A3B58' : '#0A0B12'} />
      {/* the eyes: they don't go out with the light */}
      {[-21, 21].map((cx) => {
        const { x, y } = eyeAt(pose, cx);
        const shut = t >= EYES_GONE - 2;
        return (
          <g key={cx}>
            <Glow x={x} y={y} r={70} o={lit ? 0.7 : 0.55} />
            <ellipse cx={x} cy={y} rx={13} ry={shut ? 2 : 17} fill={AMBER} />
            <circle cx={x + 4} cy={y - 6} r={4} fill="#FFFFFF" opacity={shut ? 0 : 1} />
          </g>
        );
      })}
      <Foreground blur={16}>
        <rect x={-400} y={-400} width={380} height={1880} fill="#050610" />
        <rect x={1940} y={-400} width={500} height={1880} fill="#050610" />
      </Foreground>
    </g>
  );
};
