---
name: kaz-short-films
description: Make minimalist animated "inner-enemy" short films (blob character vs a red-glowing shadow, day counters, whispers, title card) for any niche — discipline, money, addiction, fitness, study, relationships. Use when asked for a Kaz short film, a motivational animated short, or a video like DISCIPLINE / Motivation Will Fail You / Lust vs Love.
---

# Kaz Short Films

Builds 1.5–4 minute animated shorts in the minimalist "inner enemy" style:
a faceless cream blob hero, a black silhouette with a red glow that whispers
self-sabotage, day counters, a fall → rock bottom → turn → climb arc, and a
one-word title card with a two-line thesis.

Everything renders locally from a storyboard JSON with `scripts/render.py`
(Pillow + numpy + ffmpeg). No paid APIs, no network.

## Files

- `references/story-formula.md` — the 7-beat arc, the enemy's whisper ladder, niche adaptation table. **Read before writing any story.**
- `references/style-bible.md` — colours, character rules, typography, pacing, sound.
- `references/film-breakdowns.md` — timestamped shot-by-shot breakdown of the three reference films.
- `references/storyboard-schema.md` — every field `render.py` understands.
- `examples/the-cost-of-later.json` — complete working film (personal finance niche).
- `reference_screenshots/` — frames every 2 s from the three reference films (study only; see LICENSE).

## Workflow

1. **Intake (one message).** Niche, the "enemy" (the habit/voice — e.g. *Later*, *Scroll*, *Craving*), target length, platform (16:9 default; mention 9:16 needs a crop pass), and whether the user has a voiceover. If they don't answer, pick defaults and say so.
2. **Story.** Fill the 7 beats in `story-formula.md`. Write: the opening line, 4–6 whispers that escalate, the rock-bottom line ("He believed it."), the reframe ("X isn't who you are. It's what you repeat."), the climb caption, and the title + sub + punch. Show the user the beat sheet as a short table before building if they're present.
3. **Storyboard JSON.** One scene per beat moment, 2.5–6 s each, 15–30 scenes. Copy patterns from the example. Reuse a recurring anchor (alarm clock, sign, meter label) at the start and end — the bookend is what makes the ending land.
4. **Contact sheet QC.** `python3 scripts/render.py story.json --sheet sheet.jpg`, then look at it. Check: text not overlapping props, whisper near the shadow, palette goes cold → black → warm, hero mood matches beat.
5. **Preview** (optional): `--preview` renders 360p/12 fps fast.
6. **Render.** `python3 scripts/render.py story.json -o film.mp4 --res 1080` (add `--voice vo.wav` to mix a voiceover; the score is ducked to -14 dB; `--music track.mp3` replaces the generated score).
   If a voiceover exists, set each scene's `duration` to its line's length first (transcribe with Whisper if available, else ask the user for timings).
7. **Deliver** the MP4 and the JSON (so they can tweak lines and re-render).

## Rules that make it work

- The enemy never shouts the theme — it whispers specific, believable lies in lowercase red ("tomorrow.", "you deserve it.", "nobody cares."). Make them get crueler and shorter as the film goes on.
- The hero never speaks in discipline-type films; captions are the narrator. Bubbles are for relationship/family stories only.
- One idea per scene. If a caption runs past ~12 words, split the scene.
- The turn needs a trigger (a realisation caption or a person). A hero who just gets up is the main weakness of the reference DISCIPLINE film — don't copy it.
- Payoff: the enemy is still there at the end, just small (scale 0.4–0.5). The habit is managed, not gone.
- Don't reuse the reference films' exact lines, titles or characters; the formula is free, their script is theirs.
