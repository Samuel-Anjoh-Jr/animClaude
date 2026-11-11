---
name: cartoon-audio-short-3d
description: Make a finished 3D animated short (MP4) from scratch with Three.js and Remotion. Use when the user wants a 3D story short, 3D explainer, or 3D animation with narration, asks for story ideas and a voice-over script, or uploads a voice-over to be turned into a synced 3D video with captions. Covers ideas, script, voice hand-off, word timing, shot plan, 3D scene code, captions, sound, render and QA.
---

# Cartoon Audio Short (3D, Three.js + Remotion)

Turn an idea (or an existing voice-over) into a finished 3D MP4 with captions, using Claude, a Remotion project, and free tools.
Pipeline: **Story -> Voice -> Timing -> Plan -> Build scene -> Render -> Finish.**

Never skip a gate. Always wait for the user's answer before moving on.

This is the 3D sibling of the `cartoon-audio-short` (2D) skill. Phases 0-2 are identical. Phases 3-7 change because the
renderer is a real 3D scene (Three.js through `@remotion/three`) rendered by Remotion instead of hand-drawn 2D frames.

---

## Gate 0: Intake (one message)

1. "Do you already have a voice-over, or do you need ideas and a script?" Has audio -> skip to Phase 3.
2. "How long? (20-45 s recommended.)" Accept 15-60 s.
3. "Format? Vertical 1080x1920 (Shorts/Reels/TikTok, default) or landscape 1920x1080?"
4. "Visual style? Pick one: **clean toon** (flat colors, outlines), **low-poly**, **glossy 3D**, **miniature/diorama**." Default: clean toon.

Defaults: 30 fps, English, captions on.

## Phase 1: 10 story ideas

Give exactly 10 ideas, each with a scroll-stopping title (under 60 characters) and one line on the hook.

3D-specific rules:
- Favor stories that **gain from space and depth**: scale reveals (tiny vs huge), journeys through places, things falling/exploding/building, orbiting or flying camera moments, "what if" scenes, objects and creatures rather than detailed humans.
- Keep it buildable from **primitives and simple models**: one or two hero objects/characters, one environment.
- Mix formats: single story, "the truth about...", countdown, "what if".
- Never invent facts; if disputed, say so.

Ask for a number (or "10 more").

## Phase 2: Script

Voice-over sized to length at about 2.5 words per second (30 s ~ 75 words).

Structure: **HOOK** (first 3 s, shocking claim, no greeting) -> **BUILD-UP** (3-5 beats, each pulling into the next) -> **PAYOFF/TWIST** -> a short memorable last line.

Write for the ear: short sentences, simple words, numbers spelled out, full stops where a breath should land.
Show the script as plain text to copy. Tell the user: paste it into ElevenLabs, pick a voice that fits, generate, download the MP3, and upload it here.

## Phase 3: Voice in -> word timings

1. Save the file as `public/audio/voiceover.mp3` and the spoken text as `script.txt`.
2. Get word-level timestamps with the project's script:
   ```bash
   npm run captions -- public/audio/voiceover.mp3
   ```
   This needs `ffmpeg`, runs whisper.cpp locally (downloads it and the `medium.en` model on first run) and writes
   `public/captions.json` (Remotion `Caption[]`: text, startMs, endMs).
3. Compute `durationInFrames = ceil(audioSeconds * fps)` (+ ~0.5 s tail). Set it in `src/Root.tsx`.
4. Build a **key-word table**: for every important word, `word | startMs | frame = round(startMs / 1000 * fps)`.
   All later animation lands on these frames.

Fallback if whisper cannot run: split the script into phrases, detect silences with ffmpeg `silencedetect`, spread words by
syllable count inside each speech segment. Say clearly that timings are estimated.

## Phase 4: Shot plan (show before building)

Write `PLAN.md` and show a summary:

| # | frames | words | environment / light | camera move | objects / action | fx + sfx |
|---|---|---|---|---|---|---|

Plan rules:
- **One shot per sentence or beat**; 4-7 shots in 25 s, 8-14 in 40 s.
- **Camera always moves** (dolly, orbit, crane, push-in) or the subject does. No static hold of 4+ frames.
- **Hard cuts only on place/time jumps**; time jumps get a 6-frame white flash.
- **Actions land on key-word frames**, reactions 0-3 frames before the word.
- **Impacts get a camera kick** (6-8 frame decaying shake) + particles + SFX on the same frame.
- **Depth of field on close-ups only.**
- Vary scale: wide establishing -> medium -> close-up on the emotional beat -> wide/crane for the payoff.
- Use 3D to say something: scale reveals, flying through, orbiting a reveal, pulling back to show the whole.
- Music stops on the turn, returns on the payoff.

Ask: "Plan OK, or changes?" Then build.

## Phase 5: Build the scene

### 5.1 Project (check before assuming)
The working folder is a Remotion + Three.js project: `src/index.ts`, `src/Root.tsx` (compositions), `src/Main.tsx`
(scene + captions + audio), `src/components/Scene3D.tsx`, `src/components/Captions.tsx`, `public/`.
**Check these files exist.** If `Main.tsx` or `Captions.tsx` are missing, create them. If there is no project at all, create one:
`npm i remotion@4.0.542 @remotion/cli@4.0.542 @remotion/three@4.0.542 @remotion/captions@4.0.542 @remotion/install-whisper-cpp@4.0.542 @remotion/google-fonts@4.0.542 @remotion/media@4.0.542 three @react-three/fiber @react-three/drei react react-dom zod@4.6.7 typescript @types/three @types/react`
(all `remotion` and `@remotion/*` packages on the **same exact version**).

`remotion.config.ts` must have `Config.setChromiumOpenGlRenderer("angle")`, JPEG frames and H.264.

### 5.2 Hard rules (these prevent broken renders)
- **All motion is a pure function of `useCurrentFrame()`.** Never use `useFrame()`, `requestAnimationFrame`, `setTimeout`, `Date.now()`, or `Math.random()` (use a seeded hash).
- Use `<ThreeCanvas>` from `@remotion/three`, **not** R3F's `<Canvas>`. Pass `width` and `height` from `useVideoConfig()`.
- Load models and textures with `staticFile()` and `useLoader` / drei `useGLTF`, so Remotion waits for them. Use `delayRender`/`continueRender` for any other async load.
- Each shot is a `<Sequence from={a} durationInFrames={b - a}>` containing its own scene, so `useCurrentFrame()` inside is shot-relative. Use the global key-word frames by adding the sequence offset.
- Don't mount more than one heavy `ThreeCanvas` at once. One `ThreeCanvas` with shot switching inside is faster than many.
- No `useState` for animation state.

### 5.3 Structure
```
src/
  Root.tsx            // <Composition id="Main" fps={30} width height durationInFrames schema defaultProps>
  Main.tsx            // <Audio/> + <Scene/> + <Captions/>
  lib/motion.ts       // easing + camera + noise helpers (below)
  lib/timing.ts       // KEY = { hammer: 74, ... } frames from captions.json
  shots/Shot01.tsx    // one file per shot, or one story.tsx exporting shot functions
  components/Captions.tsx
public/audio/voiceover.mp3  public/captions.json
```

### 5.4 Motion toolbox (`lib/motion.ts`)
Create and reuse: `clamp, lin(a,b,f), smooth, smoother, easeIn, easeOut, easeInOut, back, lerp, lerp3, catmull(points,t)`,
`camKeys(keys, f)` (position/look/fov keyframes with per-key easing and optional spline path), `kick(f, hits)` (decaying alternating shake),
`blink(f, seed)`, `idle(f, seed)` (breathing/sway), `hash(seed)` (seeded random), and Remotion's `spring()` / `interpolate()` for overshoot and mapping.

### 5.5 Camera
A `<CameraRig>` reads `camKeys([...], frame)` and sets position, `lookAt`, `fov` every frame (use `useThree()` and set values during render; do not animate in `useFrame`).
- Move styles: push-in, pull-back, orbit (`angle = f * speed`, position = center + r*(cos, h, sin)), crane (y rises while looking down), dolly along a `catmull` path, whip pan between shots.
- Add `kick()` offsets on impacts and a slow handheld drift (low-amplitude sines with seeds) on calm shots.
- Always change `fov` slightly on push-ins (dolly-zoom feel) for energy.

### 5.6 Look (do this to avoid the "default Three.js" look)
- **Toon style**: `MeshToonMaterial` with a 3-4 step `gradientMap` (a `DataTexture`, `NearestFilter`), plus an outline: duplicate mesh with `BackSide` and an inflated black `MeshBasicMaterial`, or drei `<Outlines>`.
- **Low-poly**: `flatShading: true`, few segments, strong colors, one directional light + hemisphere light.
- **Glossy/diorama**: `MeshStandardMaterial`, soft shadows (`castShadow`, shadow-map 2048), drei `<Environment>` preset, contact shadows.
- Always: a **sky/background gradient** (not black), **fog** matching the horizon color, a **ground** with a shadow-catching plane, 3-point light (key, fill, rim), a **limited palette** (5-6 colors), and a **time-of-day preset** (day, golden, night, memory) blended with `lerp` over 20-40 frames when time passes.
- Postprocessing (bloom, vignette, DOF) via `@react-three/postprocessing` is optional; check that it renders under headless Chromium before relying on it. Cheaper alternative: CSS vignette overlay and a color-grade `AbsoluteFill` with `mixBlendMode`.

### 5.7 Characters and props
- Build characters from primitives (spheres, capsules, boxes, cylinders) grouped into body, head, arms, legs. Distinct silhouette, 3-5 colors, simple eyes.
- Pose with group rotations driven by easing functions of the frame: wind-up (slow ease), strike (3-5 frame ease-in), recoil (damped overshoot with `spring`).
- Walk cycle: leg swing = `sin(distance * k)`, tie to distance travelled so feet never slide.
- Idle life on everything alive: breathing scale, sway, seeded blinks.
- Use `.glb` models only if the user provides them or they are free (CC0) and downloaded to `public/`; always state the license.

### 5.8 FX
Small deterministic effects, each a function of `t = (frame - start) / life`: impact burst, debris chips (instanced meshes with seeded velocities and gravity `y = y0 + v*t - g*t*t`), dust puffs (scaling, fading spheres), sparks, trails, speed lines, smoke, white flash (full-screen `AbsoluteFill`). Spawn them on exact key-word frames.

### 5.9 Captions
`src/components/Captions.tsx`: read `captions.json` through `@remotion/captions` (`createTikTokStyleCaptions`), show 2-4 words per page, bold font from `@remotion/google-fonts` (e.g. Montserrat/Poppins), white text with thick outline, active word highlighted, centered in the lower third and inside the safe zone (about 15% from the top, 25% from the bottom for vertical). If the user does not want captions, drop the component.

### 5.10 Audio in the composition
`<Audio src={staticFile("audio/voiceover.mp3")} />` for the voice, plus `music.wav` and `sfx.wav` stems (Phase 6) as separate `<Audio>` tags with `volume` set to the mix levels below.

### 5.11 Check, then render
1. **Stills first**: render 2-3 frames per shot:
   `npx remotion still src/index.ts Main out/stills/s03_a.png --frame=<n>`
   Look at them (make a contact sheet). Fix: objects off-camera, intersecting meshes, black voids, flat lighting, text clipped by the safe zone, unreadable silhouettes.
2. `npm run typecheck` must pass.
3. Preview option: `npm run dev` (Remotion Studio) lets the user scrub the timeline.
4. Only then full render.

## Phase 6: Sound

- **Music**: an original loop written as code (synth in Python/numpy or Web Audio offline render), matched to the mood. Structure it to the plan: intro, groove, stop on the turn, build, payoff, tender close. No copyrighted music.
- **SFX**: synthesized from noise and sines (hits, whooshes, crashes, footsteps, wind, rumble, pops), placed at `frame / 30` seconds (a few ms early for impacts).
- Export `public/audio/music.wav` and `public/audio/sfx.wav`, 48 kHz stereo, exactly the voice length.
- **Mix**: measure integrated loudness (BS.1770). Music **-6 dB under the voice**, SFX **-6 dB under the voice**, SFX peaks capped at 0.7x voice peak. One gain per stem, no ducking, no voice compression. In Remotion, bake this into one `mix.wav` (preferred, deterministic) and use a single `<Audio>` for it.

## Phase 7: Render and finish

1. Render:
   ```bash
   npm run render            # = npx remotion render src/index.ts Main out/video.mp4
   ```
   No GPU (server, CI, container) or WebGL errors: add `--gl=swangle`. Slow? Add `--concurrency=<cores/2>`. Remotion shows its own progress; relay it to the user and say that long renders need patience.
2. Final audio: loudness-normalize to about -14 LUFS, true peak under -1 dBTP (`ffmpeg ... loudnorm`, or fix at the mix stage).
3. QA, report results plainly:
   - `ffprobe`: duration equals the voice, resolution and fps are right.
   - `freezedetect` and `blackdetect`: no unintended freezes or black frames.
   - `ebur128`: loudness and peak in range.
   - Contact sheet of one frame per second; look at it and name any issue.
4. Deliver `out/video.mp4` and its path. Offer: a thumbnail (`npm run render:still`), 3 alternative titles, description and 5 tags, a 60 s cut, or a new story.

---

## Environment notes

- Needs: Node 18+, npm, ffmpeg and ffprobe, Chromium (Remotion downloads it). Optional: Python 3 + numpy/scipy for audio synthesis.
- Pin all Remotion packages to one exact version. Upgrade with `npx remotion upgrade`.
- WebGL in headless Chromium: the project uses `--gl=angle`; fall back to `--gl=swangle` (software, slower) when there is no GPU.
- If the platform cannot run code, say so and deliver the script, the plan, and the full source files for the user to run locally with `npm install && npm run dev`.
- Free plans may hit usage limits mid-build. Work shot by shot, commit files as you go, and say exactly where you stopped.
- Use only original or properly licensed assets (CC0 models, original music/SFX). Do not copy other creators' characters, music or voices.

## Rules that always apply

- Wait for the user's choice at every gate. Never choose the story for them.
- Never invent statistics, quotes or studies.
- Determinism first: if it is not a function of the frame, it does not go in the scene.
- Look at your own stills and QA numbers before claiming it is done; report problems honestly.
- Keep chat replies short and plain; put heavy output in files.
