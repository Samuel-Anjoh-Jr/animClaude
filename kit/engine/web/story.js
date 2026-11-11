// Staging for "The Man Who Moved a Mountain": every value is a pure function of the frame number.
import { clamp, lin, smooth, smoother, easeOut, easeIn, easeInOut, back, spring, lerp, lerp3, add3, catmull, camKeys, kick, blinkAt, idle, q } from "./motion.js";
import { groundAt, chanEnd, floorH, terrainH } from "./terrain.js";
import { MANJHI_Y, MANJHI_M, MANJHI_O, FALGUNI, VIL_1, VIL_2, VIL_3, VIL_4, VIL_5, KID } from "./castdefs.js";

export const FPS = 30, TOTAL = 1254;

// ---------------- world layout ----------------
const houses = [];
{
  let s = 5;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const rowL = [[-11, 54, 1], [-12.5, 63, 0], [-11.5, 72, 2], [-13, 82, 1], [-12, 92, 0], [-14, 103, 2], [-12, 114, 1], [-25, 60, 0], [-27, 76, 2], [-26, 95, 1]];
  const rowR = [[11, 58, 0], [12.5, 68, 2], [11.5, 79, 1], [13, 89, 0], [12, 100, 2], [14, 111, 1], [25, 66, 1], [27, 84, 0], [26, 104, 2]];
  for (const [x, z, k] of rowL) houses.push([x, z, 5 + r() * 2.5, 4.2 + r() * 1.5, 2.9 + r() * 0.6, Math.PI / 2, k, r() < 0.45]);
  for (const [x, z, k] of rowR) houses.push([x, z, 5 + r() * 2.5, 4.2 + r() * 1.5, 2.9 + r() * 0.6, -Math.PI / 2, k, r() < 0.45]);
}
export const VILLAGE = {
  houses,
  palms: [[-19, 50, 10], [19, 52, 9], [-6, 120, 11], [33, 72, 9.5], [-35, 88, 10.5], [36, 98, 8.5], [-31, 66, 9], [7, 133, 10], [44, 60, 10], [-46, 74, 9]],
  trees: [[-6.5, 47, 2.6, 2.4], [17, 75, 3, 2.8], [-19, 108, 2.8, 2.6], [40, 118, 3.2, 3], [-42, 120, 3, 2.8], [55, 40, 2.6, 2.4], [-60, 45, 2.8, 2.6], [70, -40, 3, 2.8], [-50, -48, 2.8, 2.6]],
  hay: [[-20, 58, 1], [19.5, 63, 0.9], [-21, 86, 1.1], [33, 79, 1], [-33, 104, 0.9]],
  fields: [[85, 85, 70, 55, 1, 0.05], [-90, 90, 75, 60, 0, -0.04], [80, 150, 60, 45, 0, 0.1], [-85, 160, 70, 50, 1, 0], [40, -95, 80, 55, 1, 0.08], [-70, -100, 90, 60, 0, -0.05], [170, -40, 60, 70, 0, 0.1]],
};
export const LANE = [[0.5, 150], [0.3, 110], [0.2, 70], [0.4, 40], [0.5, 27]];
export const CLINIC = [92, -246, 0.3];
export const ROAD = [[2, 82], [40, 87], [90, 82], [138, 68], [174, 44], [190, 12], [192, -22], [180, -58], [158, -98], [132, -142], [110, -186], [96, -228]];
export const MAPCAM = { pos: [92, 520, 44], look: [92, 0, -80], fov: 50 };
export const SHORT = [[0.4, -22], [6, -70], [26, -130], [56, -190], [86, -236]];

// ---------------- light presets ----------------
const LP = {
  day: { az: 112, el: 50, sun: [1.2, 1.12, 0.97], amb: [0.36, 0.37, 0.46], gnd: [0.32, 0.27, 0.2], top: "#3f80d4", mid: "#8fb7e6", hor: "#c4d8ee", fog: [120, 1300], sat: 1.1, lift: [0.02, 0.025, 0.05], gain: [1, 1, 1], card: [1, 1, 1], cloud: [1, 1, 1], disc: 0 },
  morning: { az: 28, el: 20, sun: [1.38, 1.04, 0.74], amb: [0.34, 0.34, 0.47], gnd: [0.3, 0.24, 0.19], top: "#4f8ad8", mid: "#a6c3e4", hor: "#f0dcbc", fog: [110, 1200], sat: 1.12, lift: [0.025, 0.02, 0.05], gain: [1.02, 1, 0.97], card: [1.03, 0.98, 0.93], cloud: [1, 0.93, 0.86], disc: 0.003 },
  golden: { az: 168, el: 10, sun: [1.62, 0.98, 0.52], amb: [0.31, 0.28, 0.48], gnd: [0.27, 0.21, 0.19], top: "#6d7cc4", mid: "#e6a98e", hor: "#ffcf8e", fog: [90, 1100], sat: 1.14, lift: [0.03, 0.02, 0.06], gain: [1.04, 0.99, 0.94], card: [1.06, 0.94, 0.82], cloud: [1, 0.84, 0.72], disc: 0.004 },
  night: { az: 135, el: 42, sun: [0.34, 0.44, 0.72], amb: [0.15, 0.19, 0.34], gnd: [0.08, 0.09, 0.15], top: "#0d1838", mid: "#1f3058", hor: "#34496f", fog: [80, 900], sat: 0.82, lift: [0.01, 0.02, 0.05], gain: [0.95, 1, 1.08], card: [0.56, 0.63, 0.88], cloud: [0.32, 0.4, 0.58], disc: 0 },
  memory: { az: 160, el: 13, sun: [1.0, 0.66, 0.58], amb: [0.23, 0.25, 0.43], gnd: [0.15, 0.14, 0.21], top: "#2a3a72", mid: "#7c6f96", hor: "#d29a84", fog: [80, 900], sat: 0.7, lift: [0.03, 0.03, 0.07], gain: [1, 0.97, 1.02], card: [0.85, 0.79, 0.88], cloud: [0.72, 0.6, 0.7], disc: 0.003 },
};
const hexMix = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const ch = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0"); return `#${ch(16)}${ch(8)}${ch(0)}`; };
const blendL = (a, b, t) => {
  const o = {};
  for (const k of Object.keys(a)) {
    const x = a[k], y = b[k];
    o[k] = typeof x === "string" ? hexMix(x, y, t) : Array.isArray(x) ? x.map((v, i) => lerp(v, y[i], t)) : lerp(x, y, t);
  }
  let d = b.az - a.az; if (d > 180) d -= 360; if (d < -180) d += 360; o.az = a.az + d * t;
  return o;
};
/** piecewise light: [[f, preset], ...] with smooth blends */
const lightSeq = (seq, f) => {
  if (f <= seq[0][0]) return LP[seq[0][1]];
  for (let i = 0; i < seq.length - 1; i++) if (f <= seq[i + 1][0]) return blendL(LP[seq[i][1]], LP[seq[i + 1][1]], smooth(lin(seq[i][0], seq[i + 1][0], f)));
  return LP[seq[seq.length - 1][1]];
};

// ---------------- helpers ----------------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dist = (a, b) => Math.hypot(...sub(a, b));
const camRight = (c) => norm(cross(sub(c.look, c.pos), [0, 1, 0]));
const camUp = (c) => norm(cross(camRight(c), sub(c.look, c.pos)));
/** canvas angle the key light comes FROM, for a card seen by camera c (mirror flips x) */
const lightAng = (c, L, mirror = 1) => {
  const d = [Math.cos(L.el * Math.PI / 180) * Math.cos(L.az * Math.PI / 180), Math.sin(L.el * Math.PI / 180), Math.cos(L.el * Math.PI / 180) * Math.sin(L.az * Math.PI / 180)];
  const r = camRight(c), u = camUp(c);
  const sx = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) * mirror, sy = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
  return q(Math.atan2(-Math.max(0.25, sy), sx), 0.35);
};
const mirrorOf = (c, dir) => { const r = camRight(c); return dir[0] * r[0] + dir[1] * r[2] < 0 ? -1 : 1; };
/** hammer cycle: impact at t = 0 (k 1), raise, then swing down at the end of the period */
const hammerCycle = (f, period, off = 0) => {
  const t = ((((f - off) % period) + period) % period) / period;
  if (t < 0.12) return 1;
  if (t < 0.72) return 1 - smooth((t - 0.12) / 0.6);
  return easeIn((t - 0.72) / 0.28);
};
/** one strike landing at fi: wind-up from fi-raise, down in `down` frames, recoil after */
const strike = (f, fi, down = 5, raise = 14, from = 1) => {
  if (f >= fi) return 1 - 0.12 * Math.sin(Math.min(1, (f - fi) / 6) * Math.PI);
  if (f >= fi - down) return easeIn((f - (fi - down)) / down);
  if (f >= fi - down - raise) return lerp(from, 0, smooth((f - (fi - down - raise)) / raise));
  return from;
};
const ext = (f, a, b) => f >= a && f < b;
const ht = (x, z, p) => groundAt(x, z, p);
/** hammer-head world point for a side card at pos (x, y, z), lateral offset along camera right */
const headPt = (c, pos, mirror, fwd = 0.8, up = 0.95) => { const r = camRight(c); return [pos[0] + r[0] * fwd * mirror, pos[1] + up, pos[2] + r[2] * fwd * mirror]; };
let CAMNOW = null;
const pullTo = (p, d = 0.9) => { if (!CAMNOW) return p; const v = sub(CAMNOW.pos, p), l = Math.hypot(...v) || 1; return add3(p, v.map((x) => (x * Math.min(d, l * 0.5)) / l)); };
const fxHit = (out, id, f, fi, p0, size = 1.1, seed = 1) => {
  const p = pullTo(p0);
  if (f >= fi && f < fi + 9) out.push({ id: id + "b", kind: "burst", pos: p, size, t: q((f - fi + 1) / 9, 0.11) });
  if (f >= fi && f < fi + 14) out.push({ id: id + "c", kind: "chips", pos: p, size: size * 1.3, t: q((f - fi + 1) / 14, 0.07), seed });
  if (f >= fi + 1 && f < fi + 22) out.push({ id: id + "p", kind: "puff", pos: [p0[0], p0[1] - 0.55, p0[2]], size: size * 1.0, t: q((f - fi) / 22, 0.05), alpha: 0.75 });
};
const walkPhase = (d) => q(d / 1.25, 1 / 24);

// ---------------- shots ----------------
const SHOTS = [];
const shot = (id, a, b, fn) => SHOTS.push({ id, a, b, fn });

// 1 HOOK: young Manjhi hammers the rock face at the start of the cut
shot("hook", 0, 106, (f) => {
  const p = 0.16, ze = chanEnd(p), A = [0.25, 0, ze + 1.05]; A[1] = ht(A[0], A[2], p);
  const cam = camKeys([
    { f: 0, pos: add3(A, [2.5, 2.2, 9.2]), look: add3(A, [-0.35, 3.6, -3.0]), fov: 44 },
    { f: 106, pos: add3(A, [2.3, 2.0, 8.2]), look: add3(A, [-0.3, 3.5, -2.8]), fov: 43, ease: (t) => t },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const k = f < 40 ? strike(f, 35, 5, 28, 0.08) : strike(f, 72, 5, 22, 1);
  const k2 = f >= 80 ? lerp(1, 0.15, smooth(lin(80, 104, f))) : k;
  const id = idle(f, 3);
  const actors = [{ id: "manjhi", kind: "side", wide: true, pull: 0.9, outfit: MANJHI_Y, pos: [A[0], A[2]], dir: [0, -1],
    opts: { mode: "hammer", k: q(k2, 0.04), expr: f >= 33 && f < 44 || f >= 70 && f < 80 ? "strain" : "stubborn", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), lean0: q(id.tilt * 0.6, 0.5) } }];
  const fx = [], hp = headPt(cam, A, mir, 0.82, 0.92);
  fxHit(fx, "h1", f, 35, hp, 1.0, 1); fxHit(fx, "h2", f, 72, hp, 1.25, 2);
  return { cam, L, actors, fx, p, kicks: [{ f: 35, a: 0.016 }, { f: 72, a: 0.022 }], dof: { focus: dist(cam.pos, add3(A, [0, 1.4, 0])), cInf: 12 }, shadow: { c: A, r: 12 } };
});

// 2 SETTING: crane down from the village to Manjhi, who walks to the ridge and points his hammer at it
shot("setting", 106, 268, (f) => {
  const p = 0, z0 = 53, z1 = 45.2, fs = 236;
  const z = lerp(z0, z1, lin(106, fs, f)), A = [0.6, ht(0.6, z, p), z];
  const cam = camKeys([
    { f: 106, pos: [30, 42, 150], look: [1, 6, 24], fov: 44 },
    { f: 200, pos: [5.8, 2.4, 56.2], look: [0.4, 2.2, 45.8], fov: 41, ease: smoother, path: [[14, 16, 96]] },
    { f: 268, pos: [4.8, 1.2, 50.8], look: [0.25, 2.0, 44.0], fov: 40, ease: (t) => smooth(t) },
  ], f);
  const L = LP.morning, mir = mirrorOf(cam, [0, -1]);
  let opts;
  if (f < fs) opts = { mode: "walk", phase: walkPhase(z0 - z), expr: "stubborn", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir) };
  else {
    const k = f < 248 ? lerp(1, 0, smooth(lin(fs, 248, f))) : lerp(0, 0.5, back(clamp((f - 248) / 7)));
    opts = { mode: "hammer", k: q(k, 0.04), expr: "stubborn", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), lean0: f >= 248 ? q(-6 * Math.sin(Math.min(1, (f - 248) / 10) * Math.PI), 0.5) : 0 };
  }
  const actors = [{ id: "manjhi", kind: "side", wide: true, outfit: MANJHI_Y, pos: [A[0], A[2]], dir: [0, -1], opts }];
  // a neighbour by her door for scale and life
  actors.push({ id: "v2", kind: "front", outfit: VIL_2, pos: [-7.2, 58.5], opts: { expr: "neutral", armR: "pot", pot: true, blink: blinkAt(f, 9), seed: 9, light: -2.1, tilt: q(idle(f, 9).tilt, 0.5) } });
  const fx = [];
  houses.filter((h) => h[7]).slice(0, 4).forEach((h, i) => fx.push({ id: "smoke" + i, kind: "smoke", pos: [h[0], h[4] + 3.5, h[1]], size: 3.2, t: q(((f * 0.012 + i * 0.27) % 1), 0.02), alpha: 0.9 }));
  for (let i = 0; i < 3; i++) { const t = (f - 106) / 160; fx.push({ id: "bird" + i, kind: "bird", pos: [-40 + t * 80 + i * 4, 30 + i * 2.5 + Math.sin(t * 6 + i) * 1.5, 70 - i * 3], size: 1.6, t: q(((f * 0.09 + i * 0.33) % 1), 0.125) }); }
  const wide = 1 - smooth(lin(150, 200, f));
  return { cam, L, actors, fx, p, kicks: [{ f: 255, a: 0.01 }], dof: { focus: dist(cam.pos, add3(A, [0, 1.4, 0])), cInf: 8 * (1 - wide) }, shadow: { c: lerp3([2, 0, 70], A, 1 - wide), r: lerp(16, 75, wide) } };
});

// 3 CLIMB: he climbs the slope and hits the hill
shot("climb", 268, 384, (f) => {
  const p = 0, z0 = 29.5, z1 = 20.2, fs = 334;
  const z = lerp(z0, z1, lin(268, fs, f)), A = [0.5, ht(0.5, z, p), z];
  const cam = { pos: add3(A, lerp3([6.4, 1.6, 3.4], [4.0, 0.9, 2.2], smoother(lin(268, 360, f)))), look: add3(A, lerp3([-0.3, 1.3, -0.9], [-0.15, 1.35, -0.4], smoother(lin(268, 360, f)))), fov: 40 };
  cam.pos[1] = Math.max(cam.pos[1], ht(cam.pos[0], cam.pos[2], p) + 1.2);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  let opts;
  if (f < fs) opts = { mode: "walk", phase: walkPhase(z0 - z), expr: "stubborn", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), lean0: 6 };
  else { const k = f < 362 ? strike(f, 357, 5, 16, 0.6) : strike(f, 372, 4, 6, 1); opts = { mode: "hammer", k: q(k, 0.04), expr: f >= 355 ? "strain" : "stubborn", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir) }; }
  const actors = [{ id: "manjhi", kind: "side", wide: true, pull: 0.9, outfit: MANJHI_Y, pos: [A[0], A[2]], dir: [0, -1], opts }];
  const fx = [], hp = headPt(cam, A, mir, 0.82, 0.92);
  fxHit(fx, "c1", f, 357, hp, 1.1, 3); fxHit(fx, "c2", f, 372, hp, 0.8, 4);
  return { cam, L, actors, fx, p, kicks: [{ f: 357, a: 0.018 }, { f: 372, a: 0.01 }], dof: { focus: dist(cam.pos, add3(A, [0, 1.3, 0])), cInf: 6 }, shadow: { c: A, r: 14 } };
});

// 4 VILLAGE: they laugh and call him mad; he hammers far behind them
shot("village", 384, 476, (f) => {
  const p = 0.04;
  const cam = camKeys([
    { f: 384, pos: [5.6, 1.72, 56.0], look: [5.0, 1.5, 46.0], fov: 38 },
    { f: 476, pos: [4.8, 1.62, 55.2], look: [4.8, 1.48, 46.0], fov: 36, ease: (t) => smooth(t) },
  ], f);
  const L = LP.day;
  const laugh = f >= 411, bounce = (s) => (laugh ? q(4 * Math.sin((f - 411) * 1.05 + s), 1) : q(idle(f, s).tilt, 0.5));
  const bob = (s) => (laugh ? q(Math.abs(Math.sin((f - 411) * 0.52 + s)) * -6, 1) : 0);
  const actors = [
    { id: "v1", kind: "front", outfit: VIL_1, pos: [4.0, 47.0], opts: { expr: laugh ? (f >= 450 ? "mock" : "laugh") : "smile", armL: laugh ? "belly" : "hang", armR: f >= 451 ? "temple" : laugh ? "belly" : "hip", swirl: f >= 451 ? q(((f - 451) / 14) % 1, 0.08) : -1, blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: f >= 451 ? q(bounce(1) * 0.4, 1) : bounce(1), bob: bob(1), look: 0.6 } },
    { id: "v2", kind: "front", outfit: VIL_2, pos: [5.9, 49.2], opts: { expr: laugh ? "laugh" : "squint", armR: laugh ? "belly" : "hang", blink: blinkAt(f, 9), seed: 9, light: -2.2, tilt: bounce(2), bob: bob(2), look: -0.5 } },
    { id: "v3", kind: "front", outfit: VIL_3, pos: [6.6, 45.4], opts: { expr: laugh ? "grin" : "neutral", armL: "hip", armR: f >= 438 ? "point" : "hang", blink: blinkAt(f, 11), seed: 11, light: -2.2, tilt: bounce(3), bob: bob(3) } },
    { id: "kid", kind: "front", outfit: KID, pos: [4.6, 51.0], opts: { expr: laugh ? "laugh" : "smile", armL: laugh ? "belly" : "hang", armR: laugh ? "point" : "hang", blink: blinkAt(f, 13), seed: 13, light: -2.2, tilt: bounce(4), bob: bob(4) } },
  ];
  const zM = 19.6, M = [0.6, ht(0.6, zM, p), zM], k = hammerCycle(f, 20, 4);
  actors.push({ id: "manjhi", kind: "side", wide: true, outfit: MANJHI_Y, pos: [M[0], M[2]], dir: [0, -1], opts: { mode: "hammer", k: q(k, 0.1), expr: "stubborn", seed: 3, light: -2.2 } });
  const fx = [];
  const ph = (((f - 4) % 20) + 20) % 20;
  if (ph < 5) fx.push({ id: "mspark", kind: "burst", pos: headPt(cam, M, mirrorOf(cam, [0, -1]), 0.8, 0.95), size: 0.9, t: q((ph + 1) / 6, 0.17) });
  return { cam, L, actors, fx, p, kicks: [], dof: { focus: dist(cam.pos, [5.2, 1.5, 48.6]), cInf: 9 }, shadow: { c: [5, 0, 46], r: 18 } };
});

// 5 TIMELAPSE: years pass in flashes, the cut eats into the ridge, his beard turns white
shot("timelapse", 476, 600, (f) => {
  const p = lerp(0.1, 0.7, smooth(lin(476, 600, f))), ze = chanEnd(p);
  const A = [0.3, 0, ze + 1.05]; A[1] = ht(A[0], A[2], p);
  const cam = { pos: [-2.75, A[1] + 1.85, ze + 6.4], look: [0.6, A[1] + 1.9, ze - 0.7], fov: lerp(43, 40, lin(476, 600, f)) };
  CAMNOW = cam;
  const L = lightSeq([[476, "day"], [492, "golden"], [503, "night"], [514, "morning"], [524, "day"], [538, "golden"], [550, "night"], [562, "morning"], [574, "day"], [600, "day"]], f);
  const age = f < 526 ? MANJHI_Y : f < 575 ? MANJHI_M : MANJHI_O;
  const mir = mirrorOf(cam, [0, -1]), k = hammerCycle(f, 9, 2);
  const actors = [{ id: "manjhi", kind: "side", wide: true, pull: 0.9, outfit: age, outfitKey: f < 526 ? "y" : f < 575 ? "m" : "o", pos: [A[0], A[2]], dir: [0, -1], opts: { mode: "hammer", k: q(k, 0.1), expr: k > 0.9 ? "strain" : "stubborn", seed: 3, light: lightAng(cam, L, mir) } }];
  const fx = [], ph = (((f - 2) % 9) + 9) % 9;
  if (ph < 4) fx.push({ id: "tspark", kind: "burst", pos: pullTo(headPt(cam, A, mir, 0.82, 0.92)), size: 0.9, t: q((ph + 1) / 5, 0.2) });
  if (ph < 8) fx.push({ id: "tchip", kind: "chips", pos: pullTo(headPt(cam, A, mir, 0.82, 0.92)), size: 1.0, t: q((ph + 1) / 8, 0.125), seed: (f / 9) | 0 });
  const fl = (c) => (f >= c - 2 && f < c + 6 ? [0.5, 1, 0.85, 0.6, 0.38, 0.22, 0.1, 0.04][f - c + 2] : 0);
  return { cam, L, actors, fx, p, flash: Math.max(fl(526), fl(575)), kicks: [], dof: { focus: dist(cam.pos, add3(A, [0, 1.2, 0])), cInf: 5 }, shadow: { c: A, r: 16 } };
});

// 6 LOSING: wide; a slab cracks off the rim and crashes down the slope
shot("losing", 600, 712, (f) => {
  const p = 0.74, ze = chanEnd(p);
  const cam = camKeys([
    { f: 600, pos: [44, 15, 66], look: [2, 6.5, 6], fov: 34 },
    { f: 712, pos: [36, 19, 66], look: [3, 6, 7], fov: 33, ease: (t) => t },
  ], f);
  const L = LP.day;
  const A = [0.3, 0, ze + 1.05]; A[1] = ht(A[0], A[2], p);
  const actors = [{ id: "manjhi", kind: "side", wide: true, outfit: MANJHI_O, outfitKey: "o", pos: [A[0], A[2]], dir: [0, -1], opts: { mode: "hammer", k: q(hammerCycle(f, 16, 0), 0.1), expr: "stubborn", seed: 3, light: -2.4 } }];
  // slab: rests on the east rim, cracks (684), tumbles down the south face, lands (700), small bounce (704)
  const x0 = 6.8, z0 = 1.5, x1 = 10.5, z1 = 27;
  let sp, rot;
  if (f < 684) { const j = f >= 676 ? 0.04 * Math.sin(f * 2.7) : 0; sp = [x0 + j, ht(x0, z0, p) + 1.2, z0]; rot = [0.2, 0.4, 0.1 + j]; }
  else {
    const t = lin(684, 704, f), e = easeIn(Math.min(1, t * 1.05));
    const x = lerp(x0, x1, e), z = lerp(z0, z1, e), bounce = f > 700 ? 0.8 * Math.sin(lin(700, 708, f) * Math.PI) : 0;
    sp = [x, ht(x, z, p) + 1.2 + bounce, z]; rot = [0.2 + e * 7.5, 0.4 + e * 1.5, 0.1 + e * 3];
  }
  const fx = [];
  if (ext(f, 680, 692)) fx.push({ id: "crk", kind: "chips", pos: [x0, sp[1] + 0.5, z0 + 1], size: 3, t: q((f - 679) / 12, 0.08), seed: 7 });
  for (const [fi, s, dx, dz] of [[700, 6, 0, -1], [701, 4.5, -2.5, 0.5], [702, 5, 2.4, -2], [704, 3.5, 0.5, 1.5]]) if (ext(f, fi, fi + 30)) fx.push({ id: "dust" + fi, kind: "puff", pos: [x1 + dx, ht(x1 + dx, z1 + dz, p) + 1.4, z1 + dz], size: s, t: q((f - fi) / 30, 0.034), alpha: 0.55 });
  if (ext(f, 690, 704)) fx.push({ id: "roll", kind: "puff", pos: [sp[0], sp[1] - 0.6, sp[2]], size: 3, t: q((f - 690) / 14, 0.07) });
  for (let i = 0; i < 4; i++) fx.push({ id: "bird" + i, kind: "bird", pos: [-30 + (f - 600) * 0.45 + i * 3, 26 + i * 2 + Math.sin(f * 0.05 + i) * 1.2, 20 - i * 4], size: 1.4, t: q(((f * 0.08 + i * 0.25) % 1), 0.125) });
  return { cam, L, actors, fx, p, world: { slab: { pos: sp, rot } }, kicks: [{ f: 700, a: 0.022 }, { f: 704, a: 0.01 }], dof: { focus: 60, cInf: 0 }, shadow: { c: [6, 0, 12], r: 34 } };
});

// 7 MEMORY: dusk, intact hill; she carries water over the hill path and stumbles, the pot breaks
shot("memory", 712, 815, (f) => {
  const p = 0, z0 = 26.6, fs = 776;
  const z = z0 - 1.2 * (Math.min(f, fs) - 712) / 30, A = [1.4, ht(1.4, z, p), z];
  const potLand = [1.5, 0, z - 1.75]; potLand[1] = ht(potLand[0], potLand[2], p);
  const base = { pos: add3(A, [4.0, 1.3, 1.6]), look: add3(A, [-0.3, 1.4, -0.7]), fov: 38 };
  const fol = smoother(lin(776, 789, f));
  const potStart = add3(A, [0, 2.05, 0]);
  const potAt = (g) => { const t = lin(fs, 792, g), pp = lerp3(potStart, add3(potLand, [0, 0.25, 0]), t); pp[1] += 1.1 * Math.sin(t * Math.PI); return pp; };
  const lk = lerp3(base.look, f < 792 ? potAt(f) : add3(potLand, [0, 0.4, 0]), fol);
  const creep = smooth(lin(789, 815, f));
  const cam = { pos: lerp3(lerp3(add3([1.4, 0, z0 - 1.2 * (fs - 712) / 30], [4.0, 1.3 + ht(1.4, z0 - 2.56, p), 1.6]), add3(potLand, [3.0, 1.6, 2.2]), fol), add3(potLand, [2.3, 1.25, 1.7]), creep), look: lk, fov: lerp(38, 34, fol) - 2 * creep };
  if (f < fs) { cam.pos = base.pos; cam.look = base.look; }
  const L = LP.memory, mir = mirrorOf(cam, [0, -1]);
  const falling = f >= fs;
  const fallT = easeIn(lin(fs, fs + 11, f));
  const actors = [{ id: "falguni", kind: "side", outfit: FALGUNI, pos: [A[0], A[2]], dir: [0, -1], roll: -40 * fallT * mir, lift: -0.15 * fallT, visible: f < fs + 7,
    opts: { mode: falling ? "stand" : "walk", phase: walkPhase(z0 - z), pot: !falling, expr: falling ? "shock" : "calm", blink: blinkAt(f, 5), seed: 5, light: lightAng(cam, L, mir) } }];
  const fx = [];
  if (falling && f < 792) {
    const t = lin(fs, 792, f);
    fx.push({ id: "pot", kind: "pot", pos: potAt(f), size: 0.62, rot: -t * 4 * mir });
  }
  if (f >= 792) {
    fx.push({ id: "shards", kind: "shards", pos: add3(potLand, [0, 0.06, 0]), size: 1.6, flat: true, rot: 0.6 });
    fxHit(fx, "brk", f, 792, add3(potLand, [0, 0.35, 0]), 1.0, 9);
  }
  return { cam, L, actors, fx, p, kicks: [{ f: 792, a: 0.012 }], vign: 0.32, flash: f < 716 ? [0.55, 0.32, 0.15, 0.05][f - 712] : 0,
    dof: { focus: dist(cam.pos, fol > 0.5 ? potLand : add3(A, [0, 1.4, 0])), cInf: 9 }, shadow: { c: A, r: 12 } };
});

// 8 AROUND: night aerial along the long road around the ridge to the far clinic
shot("around", 815, 912, (f) => {
  const p = 0, t = smoother(lin(815, 852, f));
  const cam = camKeys([
    { f: 815, pos: [16, 30, 60], look: [3, 0, 18], fov: 46 },
    { f: 852, pos: MAPCAM.pos, look: MAPCAM.look, fov: MAPCAM.fov, ease: easeInOut, path: [[40, 160, 80]] },
    { f: 912, pos: add3(MAPCAM.pos, [0, -14, -4]), look: MAPCAM.look, fov: MAPCAM.fov, ease: (x) => x },
  ], f);
  const L = { ...LP.memory, fog: [lerp(80, 900, t), lerp(900, 5000, t)] };
  const fx = [{ id: "lantern", kind: "glow", pos: [CLINIC[0] + 1, 6, CLINIC[1] + 4], size: lerp(12, 34, t), alpha: 1 }];
  const reveal = easeInOut(lin(851, 903, f));
  return { cam, L, actors: [], fx, p, vign: 0.3, world: { routeLong: { reveal, alpha: 1 } }, kicks: [], dof: { focus: 100, cInf: 0 }, shadow: { c: lerp3([4, 0, 16], [96, 0, -80], t), r: lerp(40, 260, t) } };
});

// 9 LOSS: night; he sits by the broken pot, then lifts his head toward the hill
shot("loss", 912, 958, (f) => {
  const p = 0, A = [1.0, 0, 23.6]; A[1] = ht(A[0], A[2], p);
  const cam = { pos: lerp3(add3(A, [0.7, 1.05, 2.7]), add3(A, [0.55, 1.0, 2.25]), smooth(lin(912, 958, f))), look: add3(A, [0, 1.0, 0]), fov: 34 };
  const L = LP.night, up = smoother(lin(942, 954, f));
  const actors = [{ id: "manjhi", kind: "front", outfit: MANJHI_Y, pos: [A[0], A[2]], opts: { mode: "sit", expr: up > 0.5 ? "stubborn" : "sad", headTilt: q(lerp(-9, 0, up), 1), look: q(lerp(-0.4, 0.3, up), 0.1), blink: blinkAt(f, 3), seed: 3, light: -2.4, armL: "knee", armR: "knee" } }];
  const fx = [{ id: "shards", kind: "shards", pos: add3(A, [-0.35, 0.05, 1.1]), size: 1.3, flat: true, rot: 0.6 }];
  return { cam, L, actors, fx, p, vign: 0.34, kicks: [], dof: { focus: dist(cam.pos, add3(A, [0, 1.0, 0])), cInf: 14 }, shadow: { c: A, r: 8 } };
});

// 10 BREAK: twenty-two years later, the last wall at the north end of the cut bursts
shot("break", 958, 1048, (f) => {
  const p = 1, zP = -16.6, A = [0.25, 0, zP + 2.1]; A[1] = ht(A[0], A[2], p);
  const cam = camKeys([
    { f: 958, pos: [2.95, A[1] + 1.75, zP + 7.4], look: [-0.4, A[1] + 1.9, zP], fov: 42 },
    { f: 1018, pos: [2.75, A[1] + 1.6, zP + 6.2], look: [-0.3, A[1] + 1.8, zP], fov: 40, ease: (t) => smooth(t) },
    { f: 1048, pos: [2.55, A[1] + 1.5, zP + 5.6], look: [-0.9, A[1] + 2.0, zP - 3.0], fov: 44, ease: easeOut },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const fi = 1021;
  let k;
  if (f < 970) k = 1; else if (f < 1012) k = lerp(1, 0, smoother(lin(970, 1012, f))); else if (f < fi - 5) k = 0.02 * Math.sin(f * 3); else k = strike(f, fi, 5, 0, 0);
  if (f > fi + 10) k = lerp(1, 0.6, smooth(lin(fi + 10, 1040, f)));
  const actors = [{ id: "manjhi", kind: "side", wide: true, pull: 0.9, outfit: MANJHI_O, outfitKey: "o", pos: [A[0], A[2]], dir: [0, -1],
    opts: { mode: "hammer", k: q(k, 0.04), expr: f < fi - 6 ? "stubborn" : f < fi + 12 ? "strain" : "relief_open", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir) } }];
  const fx = [], hp = headPt(cam, A, mir, 0.8, 0.95);
  if (f >= fi) {
    if (f < fi + 12) fx.push({ id: "bb", kind: "burst", pos: pullTo(add3(hp, [0, 0.3, -0.6])), size: 2.6, t: q((f - fi + 1) / 12, 0.08), col: "#fff7d0" });
    for (const [i, o] of [[0, [-1.8, 0.6, -1.2]], [1, [1.6, 1.4, -1.6]], [2, [0, 2.6, -1.4]]])
      if (f >= fi + i * 2 && f < fi + 30) fx.push({ id: "bd" + i, kind: "puff", pos: add3([0, A[1], zP], o), size: 4.5, t: q((f - fi - i * 2) / 28, 0.04) });
  }
  const flash = f >= fi && f < fi + 7 ? [0.9, 0.85, 0.7, 0.5, 0.3, 0.15, 0.05][f - fi] : f < 962 ? [0.5, 0.3, 0.15, 0.05][f - 958] : 0;
  return { cam, L, actors, fx, p, world: { plug: { pos: [0, A[1] - 0.3, zP], t: f < fi ? 0 : (f - fi) / 30 } }, flash, kicks: [{ f: fi, a: 0.03 }], dof: { focus: dist(cam.pos, add3(A, [0, 1.6, 0])), cInf: 7 }, shadow: { c: [0, 0, zP + 1], r: 14 } };
});

// 11 ROUTE: villagers walk through the cut; crane up to the route
shot("route", 1048, 1136, (f) => {
  const p = 1, t = (f - 1048) / 30;
  const cam = camKeys([
    { f: 1048, pos: [3.4, 3.2, -31], look: [0, 2.6, 2], fov: 46 },
    { f: 1078, pos: [3.0, 3.6, -29], look: [0, 2.8, 2], fov: 46, ease: (x) => x },
    { f: 1108, pos: MAPCAM.pos, look: MAPCAM.look, fov: MAPCAM.fov, ease: easeInOut, path: [[20, 60, -40]] },
    { f: 1136, pos: add3(MAPCAM.pos, [0, -12, -3]), look: MAPCAM.look, fov: MAPCAM.fov, ease: (x) => x },
  ], f);
  const up = smooth(lin(1078, 1108, f));
  const L = { ...LP.day, fog: [lerp(120, 900, up), lerp(1300, 5000, up)] };
  const walkers = [[VIL_1, -14, 1.25, 7, 0.9], [VIL_5, -6, 1.15, 21, -0.8], [KID, -11, 2.1, 13, 0.4], [VIL_4, 2, 1.3, 15, -0.3], [VIL_2, 9, 1.2, 9, 0.8], [VIL_3, 16, 1.1, 11, -0.6]];
  const actors = walkers.map(([o, z0, v, seed, x], i) => {
    const z = z0 - v * t, mir = mirrorOf(cam, [0, -1]);
    return { id: "w" + i, kind: "side", outfit: o, pos: [x, z], dir: [0, -1], opts: { mode: "walk", phase: walkPhase(z0 - z + i * 0.3), pot: o === VIL_5, expr: o === KID ? "grin" : "calm", seed, light: lightAng(cam, L, mir) } };
  });
  const fx = [];
  for (let i = 0; i < 5; i++) fx.push({ id: "bird" + i, kind: "bird", pos: [-20 + (f - 1048) * 0.5 + i * 2.5, 18 + i * 1.6 + Math.sin(f * 0.06 + i) * 0.8, -20 - i * 3], size: 1.3, t: q(((f * 0.09 + i * 0.2) % 1), 0.125) });
  const tt = lin(1048, 1136, f);
  const world = { short: true, routeLong: { reveal: 1, alpha: 0.7 * up }, routeShort: { reveal: easeInOut(lin(1094, 1118, f)), alpha: 1 } };
  fx.push({ id: "lantern", kind: "glow", pos: [CLINIC[0] + 1, 6, CLINIC[1] + 4], size: 26 * up, alpha: 0.8 });
  return { cam, L, actors, fx, p, world, kicks: [], dof: { focus: 20, cInf: 0 }, shadow: { c: lerp3([0, 0, -10], [96, 0, -80], up), r: lerp(32, 260, up) } };
});

// 12 PAYOFF: golden; old Manjhi in the cut, then pull back to the split mountain
shot("payoff", 1136, 1254, (f) => {
  const p = 1, A = [0.2, 0, 1.5]; A[1] = ht(A[0], A[2], p);
  const cam = camKeys([
    { f: 1136, pos: add3(A, [0.9, 1.6, 5.4]), look: add3(A, [0, 1.5, 0]), fov: 36 },
    { f: 1198, pos: add3(A, [0.65, 1.55, 3.9]), look: add3(A, [0, 1.5, 0]), fov: 35, ease: (t) => smooth(t) },
    { f: 1246, pos: [0.9, 9.0, 64], look: [0.3, 6.6, 0], fov: 40, ease: easeInOut, path: [add3(A, [1.2, 2.6, 14]), [1.1, 6.5, 38]] },
    { f: 1254, pos: [0.92, 9.1, 65.2], look: [0.3, 6.6, 0], fov: 40, ease: (t) => t },
  ], f);
  const L = LP.golden;
  const id = idle(f, 3);
  const actors = [{ id: "manjhi", kind: "front", outfit: MANJHI_O, outfitKey: "o", pos: [A[0], A[2]], opts: { expr: f < 1170 ? "calm" : "soft", armR: "shoulder", hammer: "shoulder", blink: blinkAt(f, 3), seed: 3, light: -2.5, tilt: q(id.tilt * 0.6, 0.5), headTilt: q(id.head * 0.6 + (f > 1165 && f < 1195 ? -4 : 0), 1), look: q(f > 1160 && f < 1196 ? -0.5 : 0, 0.5) } }];
  // a few villagers on the lane for the wide
  [[VIL_1, 1.0, 14, 7], [KID, -0.6, 19, 13], [VIL_2, 0.8, 24, 9]].forEach(([o, x, z0, seed], i) => {
    const z = z0 + 1.2 * (f - 1136) / 30;
    actors.push({ id: "pw" + i, kind: "side", outfit: o, pos: [x, z], dir: [0, 1], opts: { mode: "walk", phase: walkPhase(z - z0 + i * 0.4), expr: "calm", seed, light: -2.4 } });
  });
  const fx = [];
  for (let i = 0; i < 7; i++) {
    const s = lin(1214 + i * 2, 1254, f);
    if (s > 0) fx.push({ id: "fb" + i, kind: "bird", pos: [(i - 3) * 2.2 + Math.sin(i * 1.7) * 2, 8 + s * 22 + (i % 3) * 1.5, -6 + s * 60], size: 1.5, t: q(((f * 0.1 + i * 0.17) % 1), 0.125) });
  }
  const pull = smoother(lin(1198, 1240, f));
  return { cam, L, actors, fx, p, world: { short: true }, kicks: [], dof: { focus: dist(cam.pos, add3(A, [0, 1.5, 0])), cInf: 12 * (1 - pull) }, shadow: { c: lerp3(A, [0, 0, 6], pull), r: lerp(10, 80, pull) } };
});

export const SHOTLIST = SHOTS.map((s) => ({ id: s.id, a: s.a, b: s.b }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];

export const frameState = (f) => {
  const s = shotAt(f), r = s.fn(f);
  const cam = { ...r.cam, pos: [...r.cam.pos], look: [...r.cam.look] };
  // creeping push on every frame (no static holds) and impact kicks
  const [kx, ky] = kick(f, r.kicks || []);
  if (kx || ky) {
    const d = dist(cam.pos, cam.look), R = camRight(cam), U = camUp(cam);
    cam.look = add3(cam.look, [R[0] * kx * d + U[0] * ky * d, R[1] * kx * d + U[1] * ky * d, R[2] * kx * d + U[2] * ky * d]);
  }
  const world = { progress: r.p ?? 0, slab: null, plug: null, short: false, ...(r.world || {}) };
  return { shot: s.id, cam, light: r.L, actors: r.actors || [], fx: r.fx || [], world, flash: r.flash || 0, vign: r.vign ?? 0.18, dof: r.dof, shadow: r.shadow };
};
