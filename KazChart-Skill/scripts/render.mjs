#!/usr/bin/env node
// KazChart renderer: scene JSON -> MP4 (or contact sheet).
// Usage:
//   node render.mjs scene.json out.mp4 [--scale 0.5] [--fps 30] [--from 0] [--to 12] [--audio vo.mp3] [--music bed.mp3]
//   node render.mjs scene.json sheet.png --contact      (one still per shot, tiled)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(require.resolve('playwright', { paths: [process.cwd(), ...(process.env.NODE_PATH || '').split(':').filter(Boolean)] }))); }
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const [specPath, outPath] = args;
if (!specPath || !outPath) { console.error('usage: render.mjs scene.json out.mp4|sheet.png [--contact] [--scale s] [--fps n] [--from s] [--to s] [--audio f] [--music f]'); process.exit(1); }

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const scale = +flag('scale', 1), fps = +flag('fps', spec.fps || 30);
const W = Math.round((spec.width || 1920) * scale / 2) * 2, H = Math.round((spec.height || 1080) * scale / 2) * 2;
spec.width = W; spec.height = H;
const total = spec.shots.at(-1).end;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(pathToFileURL(path.join(here, '..', 'engine', 'index.html')).href);
await page.evaluate(() => document.fonts.ready);
const shoot = async t => { await page.evaluate(([s, t]) => window.KZ.render(s, t), [spec, t]); return page.screenshot({ type: 'jpeg', quality: 92 }); };

function ff(argv, input) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', ['-y', '-v', 'error', ...argv], { stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
    p.on('close', c => c ? rej(new Error('ffmpeg exit ' + c)) : res()); if (input) input(p.stdin);
  });
}

if (flag('contact', false)) {
  const dir = fs.mkdtempSync(path.join(path.dirname(path.resolve(outPath)), '.kz-'));
  for (const [i, s] of spec.shots.entries()) fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.jpg`), await shoot(s.start + (s.end - s.start) * 0.7));
  const cols = Math.min(4, spec.shots.length), rows = Math.ceil(spec.shots.length / cols);
  await ff(['-i', path.join(dir, 'f%03d.jpg'), '-vf', `scale=480:-1,tile=${cols}x${rows}`, '-frames:v', '1', outPath]);
  fs.rmSync(dir, { recursive: true });
} else {
  const from = +flag('from', 0), to = Math.min(+flag('to', total), total);
  const frames = Math.round((to - from) * fps);
  const silent = outPath.replace(/\.mp4$/, '') + '.silent.mp4';
  await ff(['-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', silent], async stdin => {
    for (let f = 0; f < frames; f++) {
      const buf = await shoot(from + f / fps);
      if (!stdin.write(buf)) await new Promise(r => stdin.once('drain', r));
      if (f % fps === 0) process.stdout.write(`\rframe ${f}/${frames}`);
    }
    stdin.end();
  });
  process.stdout.write('\n');
  const audio = flag('audio', spec.audio), music = flag('music', spec.music);
  if (audio || music) {
    const inputs = ['-i', silent], filt = []; let n = 1;
    if (audio) { inputs.push('-ss', String(from), '-i', audio); filt.push(`[${n++}:a]volume=1[vo]`); }
    if (music) { inputs.push('-stream_loop', '-1', '-i', music); filt.push(`[${n++}:a]volume=${spec.musicVolume ?? 0.18}[mu]`); }
    const mixIn = (audio ? '[vo]' : '') + (music ? '[mu]' : '');
    filt.push(audio && music ? `${mixIn}amix=inputs=2:duration=first:normalize=0[a]` : `${mixIn}anull[a]`);
    await ff([...inputs, '-filter_complex', filt.join(';'), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', outPath]);
    fs.rmSync(silent);
  } else fs.renameSync(silent, outPath);
}
await browser.close();
console.log('wrote', outPath);
