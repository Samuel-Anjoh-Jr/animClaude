# cartoon-audio-short kit
Engine + tools for the cartoon-audio-short skill (first used on "The Man Who Moved a Mountain", 41.8 s, 12 shots).
- `tools/setup.sh ~/shorts/<slug>`: copy the engine into a project, install three.js r160, build `web/toon.js`, link Playwright.
- `engine/web/`: `main.js` (renderer, toon + triplanar materials, world builder, cards with depth pull, ink, grade, DOF, route lines),
  `story.js` (worked example: shots, cameras, lights, actors, fx as pure functions of the frame), `terrain.js` (ridge + cut heightfield),
  `motion.js` (easing, camKeys, kicks, blinks, idle), `paint.js` (canvas textures), `toonbase.js` (Pen API from
  mromidev/claude-animated-shorts toon.ts, MIT, types stripped), `cast.js` (dhoti, kurta, sari + pallu, pagri, beards, arm poses,
  two-handed sledgehammer, pot, fx), `castdefs.js` (outfits), `charsheet.html` (character test sheet).
- `engine/render.mjs` (Playwright + SwiftShader frames/stills/test pages), `timing.py` (script-to-voice alignment, no ASR needed),
  `sheet.py` (contact sheets), `finish.sh` (loudness, encode, QA).
- `engine/audio/`: `audio.py` (worked example cue table), `mix.py` (music -6 dB, SFX -6 dB + peak cap), `finish_audio.py`,
  and the synth modules `dsp.py`, `instruments.py`, `sfx_gen.py` from mromidev/claude-animated-shorts (MIT).
