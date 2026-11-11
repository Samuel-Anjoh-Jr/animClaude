---
name: kazchart-skill
description: KazChart Skill. Turns a voiceover or script into a narrated ocean/nature explainer animation in the flat-vector "deep sea documentary" style. It has god-ray underwater sets, side-view creatures, keyword captions, fact pills, stamps, marker circles, meters, isotype grids, sonar and size lineups. Use it when the user asks to animate a script or voiceover in this style, make a KazChart video, or build explainer infographics with creatures.
---

# KazChart Skill

KazChart renders explainer animations from a **scene JSON** file. A deterministic SVG engine draws each frame in headless Chromium (Playwright), and ffmpeg encodes the result to MP4. All the art is generated in code, so no stock footage or images are needed.

Folder map:
- `engine/engine.js`: the renderer, presets, creatures and every element type
- `engine/index.html`: the page the renderer loads, which embeds the bundled Poppins font
- `scripts/render.mjs`: scene JSON → MP4 or contact sheet
- `scripts/timestamps.py`: voiceover → word timestamps (Whisper)
- `references/style-guide.md`: the visual grammar (read it before planning shots)
- `references/elements.md`: every element type and its fields (read it before writing JSON)
- `examples/`: `abyss-demo.json` and `ink-demo.json`, working scenes to copy from
- `rights/`: ownership and licence notices. Keep this folder with any copy of the skill.

## Requirements and setup
Needs Node 18+, Playwright with Chromium, and ffmpeg. Python 3 with `faster-whisper` is optional and only needed for automatic voiceover timing.
- One step: `bash setup.sh` (macOS/Linux) or `powershell -ExecutionPolicy Bypass -File setup.ps1` (Windows). It installs what's missing and makes a 3-second test render.
- Manual: `npm install && npx playwright install chromium`, install ffmpeg, and optionally `pip install -r requirements.txt`.
- Inside Claude's workspace these are usually preinstalled. If Node can't find Playwright, run `export NODE_PATH=$(npm root -g)`.

## Workflow

1. **Intake.** Get the voiceover audio and/or the script, and the preset. Use `abyss` (flat, no outlines, CAPS labels, cold documentary feel) or `ink` (outlined cartoon, mixed-case captions with orange keywords, detective-mystery feel). Ask which preset to use if it isn't clear. The default is 16:9 1920x1080 at 30 fps; for vertical video, set `width:1080,height:1920`.
2. **Timing.** If there is audio, run `python3 scripts/timestamps.py vo.mp3 words.json`. Without audio, assume about 2.6 words per second and use the script's sentence breaks.
3. **Beat sheet.** Split the narration into beats of 1.5–3 s, each one a stressed phrase. For each beat pick **one** visual event: a creature move, a caption keyword, a pill, a stamp, a circle, or an infographic. Group the beats into shots of 3–8 s. Choose shot types from the menu in `references/style-guide.md` §4. Vary them, and never use the same set-piece twice in a row.
4. **Write the scene JSON.** Shot `start`/`end` and element `t0` come straight from the word timestamps. `t0` is relative to the start of its shot. Land captions and pills on the stressed word. Put fades only on chapter changes.
5. **QC.** Run `node scripts/render.mjs scene.json sheet.png --contact`, then view the sheet. Check legibility, overlaps, empty frames and that subjects are on screen. Fix the problems, then render one or two risky shots with `--from/--to --scale 0.5` and look at the frames.
6. **Final render.** Run `node scripts/render.mjs scene.json out.mp4 --audio vo.mp3 [--music bed.mp3]`. Use `--scale 2` for 4K. Deliver the MP4 and the scene JSON so the user can make edits.

## Style rules (summary; the full version is in the style guide)
- One underwater stage, with darkness increasing with depth: `bg.depth` 0 (sunlit) → 1 (abyss). Use `sun`, `spotlight`, `seabed` and `surface` for variety, and `mode: sonar | thermal | black | paper` for special sections.
- Creatures are side-view cut-outs that swim slowly. Use `mode: silhouette` for mystery and scale, `sonar`/`thermal` for "how it senses" moments, and `approach` with `threat:true` (on `sharkFront`) for the scary head-on beat.
- Text is the storyteller. Use short keyword captions (`*word*` = highlight colour, `!word!` = alert red). Use pills that stack one fact per beat, with the last shocking fact in `tone:"red"`. Stamps are verdicts, circles point at features, and a corner `tag` names the subject or the year.
- Camera: slow `zoomFrom→zoomTo` push-ins (1.0→1.15–1.3) and gentle `panX`. Overlays stay fixed on screen.
- Change something on screen every 1.5–3 s. Hard cuts on the beat are the default transition.

## Extending
- New creature: add `C.name = (P, col, t, o) => svgString` in `engine.js`. Draw it facing right in about a 400 px wide local box centred on 0,0, and give `P.creature` an entry with 3 colours `[body, light, dark]`.
- New element: add `E.name = (P, e, t) => svgString` (with `t` relative to the shot). Overlay types sit above the camera layer automatically.
- New preset: add it to `PRESETS` (top/bottom bg colours, stroke, font, capsCaptions, highlight colour), or override per scene with `"tokens": {...}`.

## Ownership
This skill is proprietary. Before redistributing or modifying it, read `rights/OWNERSHIP_AND_RIGHTS.txt`, and keep the `rights/` folder in every copy.
