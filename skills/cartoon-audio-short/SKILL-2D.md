---
name: cartoon-audio-short
description: Make a finished 2D cartoon short (MP4) from scratch. Use when the user wants a faceless animated story short (YouTube Shorts, Reels, TikTok), asks for cartoon story ideas, a voice-over script, or wants an uploaded voice-over turned into a synced animation. Covers ideas, script, voice hand-off, shot planning, frame rendering, sound design, and final encode.
---

# Cartoon Audio Short (2D)

Turn an idea (or an existing voice-over) into a finished vertical cartoon MP4, using only Claude plus free tools.
Pipeline: **Story -> Voice -> Plan -> Animate -> Sound -> Finish.**

Never skip a gate. Always wait for the user's answer before moving on.

---

## Gate 0: Intake (ask first, one message)

1. "Do you already have a voice-over, or do you need ideas and a script?"
   - Has audio -> jump to **Phase 3** (ask for the audio file and its script text if they have it).
   - Needs ideas -> continue.
2. "How long? (20-30 s recommended: short, punchy, easy to finish.)" Accept 15-60 s. Above 45 s, warn that rendering takes longer.

Defaults unless told otherwise: vertical 1080x1920, 30 fps, English narration, comedic-true-story or dramatic tone.

## Phase 1: 10 story ideas

Give exactly 10 original ideas. Each one:
- A scroll-stopping title (under 60 characters)
- One line: the hook, and why a viewer cannot swipe away

Rules:
- Prefer **true or true-feeling stories with a reversal** (the strong lost to the weak, the absurd that really happened, the underdog payoff).
- Every idea must be **visually simple**: one or two characters, one or two places, strong physical actions (hit, fall, chase, explode, laugh).
- Mix formats: single story, "the truth about...", countdown, escalating absurdity.
- Avoid overdone topics. Never invent facts; if a story is disputed, say so.

Then ask for a number (or "10 more").

## Phase 2: The script

Write the voice-over for the chosen idea, sized to the target length at about 2.5 words per second
(20 s ~ 50 words, 30 s ~ 75 words, 40 s ~ 100 words).

Structure:
1. **HOOK** (first 3 s): the shocking claim in one line. No greetings, no channel intro.
2. **BUILD-UP**: 3-5 short beats, each one visual and each ending on a pull into the next.
3. **PAYOFF**: the reversal or the punchline, in the last 3-5 s.
4. **Last line**: short, memorable. No "like and subscribe" inside the cartoon.

Write for the ear: short sentences, simple words, numbers spelled out ("nineteen sixty", "fifty-five"),
punctuation that marks the pauses (every full stop becomes a breath of silence, which the timing step relies on).

Show the script as plain text the user can copy. Then tell them:
> Paste this into ElevenLabs, pick a voice that fits the story (deep and calm works for storytelling), generate, download the MP3, and upload it here.

Also offer one voice description to pick (e.g. "deep, calm, documentary").

## Phase 3: Voice in -> timing

When the user uploads the voice-over:
1. Save the script as `script.txt` (the exact words spoken) and the audio as `voice.mp3`.
2. Decode with ffmpeg, measure duration, convert to frames: `frames = round(seconds * 30)`.
3. **Align script to audio without speech recognition**:
   - Compute a 10 ms RMS envelope, mark silences of 0.18 s or more as gaps, the rest as speech segments.
   - Split the script into phrases at punctuation (`. , ! ? ; : -`), count syllables per phrase.
   - Match phrases to segments in order (dynamic programming): the cost is how far a group's speaking rate drifts from the global rate, plus a penalty for a sentence end inside a segment and for a pause inside a phrase.
   - Give each word a time by its syllable share inside its group, then snap word starts to the nearest energy dip (within 90 ms).
   - Output `words.json` (word, start, end, frame), `phrases.json`, `segments.json`.
4. Print a table: `frame range | time | phrase`. Everything later keys off these frames.

(If Whisper or another ASR is available, it can replace step 3, but the script-alignment method works offline.)

## Phase 4: Shot plan (show it before animating)

Write `PLAN.md` and show a summary to the user. One row per shot:

| # | frames | words | setting / light | camera | cast / action | fx + sfx |
|---|---|---|---|---|---|---|

Also list the **key-word frames** (the frame where each important word is spoken) because actions must land on them.

Plan rules:
- **Cut on the sentence.** One shot per sentence or beat (typically 8-14 shots in 40 s, 4-7 in 25 s).
- **Hard cuts only on place or time jumps.** A time jump gets a 6-frame white flash. Everything else is a continuous camera move.
- **No static hold of 4 frames or more.** Every shot has camera motion, idle life (breathing, sway, blinks), or both.
- **Reactions land 0-3 frames before the word that causes them**, never after.
- **Impacts get a kick**: a 6-8 frame decaying camera shake, plus a burst/dust/spark fx and an SFX on the exact frame.
- **Depth of field only on close-ups.**
- **Silence is a tool**: stop the music on a turn (a memory, a loss) and bring it back on the payoff.
- Vary shot size: wide establishing -> medium -> close-up on the emotional beat -> wide for the payoff.
- Give the payoff its own camera move (push-in then pull-back, or a crane to a wide).

Ask: "Plan OK, or any changes?" Then build.

## Phase 5: Animate (draw every frame)

Every value in the animation is a **pure function of the frame number**: `state = shot(f)`. No timers, no randomness
that is not seeded. That makes any frame renderable alone, makes re-renders deterministic, and lets you resume.

### 5.1 Setup
- Preferred: use the project's engine if present (see **Engine kit** below).
- Otherwise build a minimal 2D renderer: an HTML canvas (or SVG) page that exposes `window.renderFrame(f)` returning a JPEG data URL, driven by Playwright; or Python with Pillow/cairo writing `frames/f0000.jpg`.
- Canvas: 1080x1920, 30 fps, 8-bit JPEG quality ~90, file names `f0000.jpg` onward.

### 5.2 Characters (cut-out style)
Build each character from simple shapes in code: head, eyes, brows, mouth, torso, two arms, two legs, props.
- Distinct silhouette and a limited palette (3-5 colors per character, bold dark outline).
- Expressions as parameter sets (neutral, stubborn, strain, laugh, shock, sad smile). Blink 4 frames at seeded random intervals of 15-70 frames.
- Idle life: breathing bob, tiny body tilt, head sway (sin waves with per-character seed).
- Actions as easing curves: wind-up (slow ease-in-out), strike (3-5 frames ease-in), recoil (small damped overshoot).
- Walk cycles keyed to distance travelled so feet never slide.

### 5.3 World and camera (2D with depth)
- Layered backgrounds (sky, far, mid, near, ground) moved at different speeds for parallax.
- A "camera" is just pan, zoom and roll applied to the layer stack, defined by keyframes `{f, x, y, zoom, roll, ease}` with easing between keys.
- Light presets (day, morning, golden, night, memory/flashback): sky gradient, tint, saturation, shadow color. Blend between presets with a smoothstep over 20-40 frames when time passes.
- Final grade on every frame: slight saturation boost, vignette, subtle ink outline.

### 5.4 Motion toolbox
Keep a small helper file: `clamp, lin, smooth, smoother, easeIn, easeOut, easeInOut, back, spring, lerp, catmull (spline), camKeys, kick, blinkAt, idle`.
Use `spring` and `back` for cartoon overshoot, `kick` for impacts, `catmull` for flowing camera paths.

### 5.5 FX
Small particle/shape fx, each a function of `t` from 0 to 1 over its life: burst (impact star), chips/debris, puff (dust), sparks, smoke, speed lines, laugh marks, sweat drops, white flash. Spawn them on the exact impact frame from `words.json`.

### 5.6 Render loop and QA (do this, do not skip)
1. **Test stills first**: render 1-3 frames per shot (first, middle, last) to `stills/`, build a contact sheet, and look at it.
   Fix: off-frame characters, floating props, unreadable faces, text cut off, clipping.
2. Fix, re-render the stills. Only then render the full range.
3. Full render with resume (skip existing files), in chunks, printing seconds per frame. Show progress to the user.
4. Tell the user it needs patience (several minutes to over an hour depending on length and machine).

## Phase 6: Sound

- **Music**: write a short original loop synthesized in code (no copyrighted music). Match the story's mood and culture. Plan its structure to the shot plan: intro, groove, **stop on the turn**, drone or tension, build to the payoff, return, tender close.
- **SFX**: synthesize from noise and sine layers (hits, crash, whoosh, footsteps, birds, wind, laugh bed, clay break, rumble). Place each at its event frame divided by 30, a few ms early for punchy impacts.
- Export `music.wav` and `sfx.wav`, 48 kHz stereo, exactly as long as the voice.
- **Mix**: measure integrated loudness (BS.1770) of each stem. Set music to **-6 dB under the voice** and SFX to **-6 dB under the voice**, with SFX peaks capped at 0.7x the voice peak. One gain per stem, no ducking, no compression on the voice.

## Phase 7: Finish

1. Final audio: loudness-normalize the mix (one gain and a limiter), target around -14 LUFS, true peak under -1 dBTP.
2. Encode: `ffmpeg -framerate 30 -i frames/f%04d.jpg -i final_audio.wav -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/<title>.mp4`
3. QA, report results plainly:
   - Duration and frame count match the voice.
   - `freezedetect` and `blackdetect` show no unintended freezes or black frames.
   - `ebur128` loudness and peak in range.
   - A contact sheet of one frame per second (`qa_sheet.jpg`). Look at it and name any issue you see.
4. Deliver the MP4 and tell the user where it is. Offer: a 9:16 thumbnail frame, 3 alternative titles, a description and 5 tags, or a new story.

---

## Engine kit (when the project has `kit/`)

If the working folder contains a `kit/` directory, use it instead of writing an engine:

- `kit/tools/setup.sh ~/shorts/<slug>`: copies the engine into a new project, installs three.js r160, builds `web/toon.js`, links Playwright.
- `engine/web/main.js` renderer (toon materials, cards with depth pull, ink, grade, DOF), `story.js` the **worked example**: shots, cameras, lights, actors and fx as pure functions of the frame. Replace its world layout and shots for the new story. `motion.js` easing/camera helpers, `paint.js` canvas textures, `toonbase.js` + `cast.js` + `castdefs.js` characters and outfits, `terrain.js` heightfield, `charsheet.html` character test sheet.
- `engine/render.mjs`: `node render.mjs stills/a "5,40,90"` for stills, `node render.mjs frames "0-1253"` for the full range (`RESUME=1` skips existing), `node render.mjs page charsheet.html out.png` for a test page.
- `engine/timing.py voice.mp3 script.txt --out work`: the alignment from Phase 3.
- `engine/sheet.py`: contact sheets. `engine/finish.sh "Title"`: loudness, encode, QA.
- `engine/audio/`: `audio.py` (worked example cue table), `mix.py`, `finish_audio.py`, and synth modules `dsp.py`, `instruments.py`, `sfx_gen.py` (MIT, from mromidev/claude-animated-shorts).
- Example to copy the structure from: `kit/example/PLAN_mountain_man.md` and `script_mountain_man.txt` (41.8 s, 12 shots).

Order: `setup.sh` -> `timing.py` -> write `PLAN.md` -> edit `story.js` and `castdefs.js` -> stills -> fix -> `audio.py` + `mix.py` -> full render -> `finish.sh`.

## Environment notes

- Needs: ffmpeg, Python 3 with numpy and scipy, Node 18+, Playwright with Chromium. If something is missing, say exactly what and give the install command; do not silently degrade.
- If the platform cannot run code (no file system or shell), say so, then deliver: the script, the shot plan, and the animation code as files the user can run locally.
- Free plans may hit usage limits during the long render. Render in resumable chunks and say where it stopped so the next message can continue with `RESUME=1`.
- Use only original art, original synthesized music and SFX. Do not copy characters, music or voices from other creators.

## Rules that always apply

- Wait for the user's choice at every gate. Never pick the story for them.
- Never invent statistics, quotes or studies. If a story is disputed, say it is.
- Keep every line of the script earning attention; cut filler.
- Check your own output (stills, contact sheet, QA numbers) before claiming it is done, and report problems honestly.
- Keep it short and plain in chat: show what matters, put the heavy output in files.
