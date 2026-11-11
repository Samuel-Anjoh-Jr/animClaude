---
name: "animation-studio"
description: "Full system for product demo guides and videos: HTML guides, simple narrated videos, motion-graphics videos, and viral marketing ads, with ElevenLabs voice and a Claude Code prompt."
---

# Animation Studio

One system for turning a product (web app, mobile app, SaaS, school platform, service) into: (A) user-guide HTML artifacts, (B) simple narrated videos, (C) motion-graphics narrated videos, (D) marketing / viral ads, and (E) a ready-to-paste prompt for Claude Code to prepare the repository (demo data, screenshots, routes).

Siblings to reuse, not duplicate: `cartoon-audio-short` (2D story shorts: ideas, script, shot plan, per-frame render, music, loudness finish), `cartoon-audio-short-3d` (Three.js + Remotion, captions via whisper), `kazchart-skill` (scene-JSON explainer engine), `video-making` (render rules: one mp4 per scene, concat with `-c copy`, temp names then rename, look at frames before the full render). Use them when the person wants a story short, a 3D piece or the kazchart style. This skill is for product demos and marketing. Skip their story/idea phases when the product context is already known.

## Operating rules (learned the hard way)
- Send a one-line status before long work. The person often steps away and wants to know it landed.
- Give prompts and plans up front. When a decision is needed, use multiple-choice (AskUserQuestion), at most 4 questions per round, recommended option first.
- Never start a 1-hour batch before the person has approved ONE sample. Render a sample (one role, one language, one orientation), check it, send it, get feedback, then batch.
- Test stills / contact sheets before any full render. Look at them. Fix, then render.
- Long renders: background process with `nohup`, resumable (skip existing outputs), poll with sleeps of 115 s or less (longer sleeps time out), keep a task list, send a short progress message about every 15 minutes.
- Say limits plainly: free voices have no regional accents and sound robotic in some languages; the sandbox may block some websites; render time estimates.
- Never invent statistics, testimonials, reviews, prices or customer names. Never use photos of real people.

## Step 0: Intake (one AskUserQuestion round, skip what is already known)
1. **Output type** (multi-select): HTML guides/artifacts only; simple video with voice (slides + narration); motion-graphics video with voice; marketing/ad videos; Claude Code prompt for the repo.
2. **Purpose**: demo/how-to, or marketing (organic + ads).
3. **Audience + language(s)**: who, where, which languages. Ask about accent/market (for example Cameroon: French and English, mobile-first, WhatsApp, Mobile Money, low bandwidth).
4. **Formats**: landscape 16:9, portrait 9:16, square 1:1 (ads often need all three).
5. **Voice**: free offline TTS (Kokoro), ElevenLabs via API key, or ElevenLabs scripts the person generates themselves (then they upload MP3s).
6. **Sources**: repo / live URL / screenshots they already have.
Defaults if unanswered: guides + motion video, EN+FR if the market is bilingual, female calm voice, landscape + portrait.

## Track E: Prompt for Claude Code (give this FIRST when the repo is not yet ready)
Produce one paste-ready prompt. It must make Claude Code:
1. Read the repo: list roles, routes/screens per role, auth method, i18n setup, existing seed scripts, README. Write `DEMO_PLAN.md` mapping role -> ordered screens/features.
2. Create a **demo mode**: seed script with realistic fake data (names, classes, amounts, products) in each language, idempotent, never touching production data; demo accounts per role; env guard so it only runs locally or on staging.
3. Add stable hooks for capture: `data-testid` on key buttons, fields and forms; disable animations/toasts that flicker; a fixed viewport per device (desktop 1440x900, phone 390x844).
4. Write a Playwright script that logs in per role and language, visits each screen in the plan, fills forms with demo values, and saves screenshots as `shots/<lang>/<role>/<NN>-<slug>.png` plus `shots/manifest.json` (file, role, lang, title, element boxes for every button/field so pins can be placed exactly).
5. Record real mobile install/PWA screens if applicable, and a short list of UX bugs found while capturing.
6. Report: what was captured, what failed, how to re-run. No secrets in files; no production writes.
Adapt the prompt to the actual stack the person names. If they have a Help Center plan, add a final step to embed the guides.

## Track A: HTML guides (artifacts)
- Check the artifact types available (`list_types`); a self-contained HTML page per role per language unless a Docs type fits better.
- Real screenshots with numbered pins placed on the exact element (use the manifest boxes), a legend per pin, tips and warnings, step headings, FR/EN versions, and a PWA/install section if relevant. Private first; the person decides on sharing.
- Keep one spec file per role (steps, image, pins, legend, tip) so the same spec later drives the videos.

## Voice layer (all video tracks)
### Option 1: Kokoro (free, offline)
`kokoro-onnx` with model files from the kokoro-onnx GitHub releases. Voices: `bf_emma` (EN), `ff_siwis` (FR). Speed about 0.95. Cache each narration segment as `md5(lang|text)[:16].wav`. Apply TTS text substitutions (CSV -> "C S V", QR, PDF, arrows -> words, domain dots -> "dot"). Disclose: no regional accent, French can sound robotic.
### Option 2: ElevenLabs via API (when the person gives a key)
- Ask for the key in chat. Use it only as an environment variable for the session. Never write it to a file, memory or log. Suggest rotating it afterwards.
- First test one tiny request. The sandbox may block `api.elevenlabs.io`. If blocked, say so and fall back to Option 3, or give a small local Python script the person can run to generate the per-segment audio.
- Check the quota first: `GET /v1/user/subscription` (`character_count`, `character_limit`). Count characters of all scripts (1 character = 1 credit on the standard models). Free is about 10k credits/month (about 10 min, no commercial licence), Starter about 30k, Creator about 100k+. 16 long videos usually need Creator for one month. Re-check the pricing page, plans change.
- Generate **per narration segment**, not per whole script: `POST /v1/text-to-speech/{voice_id}/with-timestamps` with header `xi-api-key`, body `text`, `model_id` (`eleven_multilingual_v2` or `eleven_flash_v2_5`), `voice_settings` (stability about 0.5, similarity 0.75, speed 0.95 to 1.0), `previous_text`/`next_text` for continuity. The response gives `audio_base64` plus character-level `alignment`; convert it to word times. This removes any need for silence-gap alignment, and plugs straight into the per-segment audio cache.
- Same voice per language across all videos. Check the output of one segment by ear before generating all.
### Option 3: Person generates audio from scripts
Deliver one script file per video with `<break time="1.0s" />` between segments (use Multilingual v2 or Flash v2.5; Eleven v3 ignores break tags). Ask for MP3s named `<project>-<role>-<lang>.mp3`. On upload, split into segments by silence gaps (10 ms RMS envelope, gap >= 0.18 s; the 1.0 s and 2.0 s breaks make this reliable), map to the segment list in order, then re-time and re-render.
**Warning to give**: if the voice is replaced after rendering (for example in CapCut), captions highlighting and click timing drift. For a clean result, re-sync and re-render.

## Track B: Simple narrated video (slideshow style)
One scene per step: screenshot with pins, title, legend text, narration. Fast to render, good for tutorials where polish matters less. Per-scene mp4, concat, AAC audio, 30 fps. Offer this as the cheap option before motion graphics.

## Track C: Motion-graphics demo video (what worked)
Engine design (Python + Pillow + ffmpeg, about 23 ms per frame on 2 CPUs):
- Every frame is a pure function of time `t` (deterministic, resumable). Raw RGB piped to ffmpeg (libx264 crf 20, veryfast, AAC 128k, 30 fps), one mp4 per scene, concat with `-c copy`. Pool of 2 over scenes.
- Scene kinds: title/section/outro, step (screenshot + pins), install (animated phone mockups for Android/iPhone PWA steps). A global progress rail, animated drifting-blob backgrounds, window flying in with shadow.
- Step scene motion: camera zoom/pan eased in log-space per pin, animated cursor travelling pin to pin, click ripple and sparks, spring pin pop with pulsing ring, light spotlight dim (alpha about 0.13), karaoke word highlighting driven by the speech bounds of each audio segment, tip/warning cards, progress dots.
- Sound: synthesized SFX (pop, whoosh, tick, chime) and an original synthesized music loop about 20 dB under the voice. Never use copyrighted music.
**Camera framing rules (important):**
- Frame the element, not the pin. Pins sit on a field's edge; the person must see the whole field with its label and placeholder, or the whole button. On desktop: zoom about 1.45 and pull the camera centre halfway toward the horizontal middle. On phone screens: zoom about 1.1 with the camera centred horizontally, move only vertically. Use manifest element boxes when available and fit the camera to the box plus margin.
- Always keep the target fully inside the viewport and clamp the camera to the image.
- A legend item may have no pin (a note). Guard every pin loop with the pin count, not the legend count.
- Verify with contact sheets across desktop and phone, landscape and portrait, before the batch.
Audio length rules: pad 0.2 s before each scene, 0.5 s after (0.8 s on the last). Make mixes length-safe (pad/crop to the video length). Normalize to about -19 to -14 LUFS integrated with true peak under -1 dBTP.

## Track D: Marketing / viral animation
Act as a senior digital marketer, behavioral psychologist, copywriter and creative director. Goal: people stop scrolling, watch, feel something, share, and take action. Works organically first, and is also ad-ready. Marketing videos always use ElevenLabs (API or scripts); free TTS is not good enough for persuasion. Always ask for the offer, the target buyer, the one action wanted (sign up, WhatsApp, book a demo), the price/proof available and the platform.

### Strategy brief (write it before any script)
- **Audience**: who, their daily frustration, the words they use (local language and slang), where they spend time.
- **One promise** in plain words: the before -> after. One video = one idea = one action.
- **Proof** that is real: numbers, screenshots, results the person can verify. If none exists, use demonstration (show it working) instead of claims.
- **Angle bank** (list 10, pick 3 to test): pain, fear of loss (of money/time/reputation), status/identity ("principals who run organized schools"), curiosity gap, myth-busting, before/after, a day-in-the-life, comparison with the old way (paper/Excel), behind the scenes, social proof, a surprising number.

### Psychology levers (use honestly)
Loss aversion, specificity ("saves 6 hours a week" beats "saves time"), curiosity gap and open loops, pattern interrupt, identity and belonging, social proof, authority through demonstration, reciprocity (free value first), commitment ladder (small first step), anchoring against the cost of the old way, scarcity or urgency ONLY when true. No fake countdowns, fake testimonials, fake reviews, invented numbers, shaming, or dark patterns. Follow platform ad policies and local advertising law; claims about results must be provable.

### Video structure (15 to 35 s default; 45 s max for organic storytelling)
- **0 to 1.5 s HOOK**: the first frame must already be a complete thumbnail: big text (max 7 words), motion starts at frame 0, a visible problem or a bold claim. No logo intro, no greeting. Hook types: question that names the pain, bold contrarian claim, shocking number, "stop doing X", "POV:", visual pattern interrupt.
- **1.5 to 6 s PROBLEM**: make the pain vivid and specific (agitate), in the viewer's own words.
- **6 to 20 s SOLUTION BY DEMONSTRATION**: show the product doing the thing in the fewest taps, motion-graphic style (zoom to the button, cursor, pop numbers, before/after split, counters).
- **PROOF beat**: one real number, screenshot or result.
- **CTA (last 3 to 4 s)**: one action, said and shown ("Send DEMO on WhatsApp"), with a reason to act now that is real. Make the end loop back into the first frame where possible (replays boost reach).
- Frameworks to pick from: PAS (problem, agitate, solve), AIDA, BAB (before, after, bridge), "3 mistakes" list, myth vs truth, story with a twist.

### Craft rules for engagement
- A new visual event every 1 to 2 s: cut, zoom, kinetic text, icon pop, split-screen, counter. Hard cuts on the beat; whoosh/pop SFX on changes; music under the voice and ducked on key words.
- **Sound-off first**: burned-in captions (large, high contrast, keyword highlight colour), safe areas for platform UI (keep text out of the bottom 20% and right edge on 9:16).
- Voice: conversational, warm, energetic, short sentences, written for the ear. Natural pauses via break tags. Test 2 voices on the hook and pick the better.
- Vertical 9:16 for Reels, TikTok and Shorts; 1:1 and 4:5 for feed ads; 16:9 for YouTube and website. Build each from the same scene data with per-format layouts.
- **Viral-ready by design** (STEPPS): social currency (makes the sharer look smart or caring), triggers (tie to a daily situation, like fees season or report-card day), emotion (high-arousal: surprise, relief, indignation, pride), public (watermark-free, relatable), practical value (a tip people save), story (a mini-narrative). Add a share line: "send this to a school owner who...". Optimize for watch time, completion, saves and shares, not likes.
- Native look beats slick: for organic, mimic the platform's style (face-less kinetic text, screen-recording with motion graphics); for ads, same creative with a stronger CTA and a different end card.

### Deliverables per campaign
1. Strategy brief and angle bank (above).
2. 3 hook variants for each of 2 to 3 angles (test hook, keep the body); full scripts with scene timings.
3. Storyboard table: scene, seconds, visual, on-screen text, voice, SFX/music.
4. ElevenLabs scripts (or API-generated audio) with voice settings used.
5. The videos in the needed formats, a thumbnail/first-frame still, a caption (hook line + value + CTA), 5 to 10 hashtags, and a posting plan (times, cross-posting, comment prompt to pin).
6. A test plan: hook rate (3-s views / impressions), hold rate (watch time), CTR, cost per action; run 3 hooks, keep the winner, iterate weekly. Organic: post the winner as an ad with the same creative.
Sample first (hook + 10 s), approval, then the batch.

## Quality checklist before delivering any video
- Duration equals the sum of segment audio plus pads; no freeze or black frames (`freezedetect`, `blackdetect`); loudness in range (`ebur128`); contact sheet checked.
- Every pin target fully visible, no text clipped, captions inside safe areas, TTS pronunciations checked, language correct.
- Deliver as zips by language (and by format), file names `<project>-<role>-<lang>-<land|port>.mp4`, plus the scripts and, for marketing, captions/hashtags. Say plainly what is not verified.
- Offer the next step: replace voice (send MP3s for a re-sync), more formats, A/B variants, Help Center embedding.