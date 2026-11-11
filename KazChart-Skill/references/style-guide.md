# KazChart style guide

Sources: "Why You'd Never Want To Meet A Sperm Whale" (10:57) and "Nobody Knows About Megalodon's Evil Twin" (10:00). Both are 2560x1440, 30 fps. Live-action footage, archival photos and documentary clips are excluded here.

The two videos share one grammar: a flat-vector 2D world, a single underwater stage, and data overlays timed to the narration. They differ in how each one illustrates and types things. A skill should treat them as two presets of one engine.

---

## 1. Shared core grammar

### Stage / environment
- **One persistent "ocean" backdrop**: a vertical gradient (lighter teal-blue at the top, near-black navy at the bottom) with a radial **vignette** that darkens the edges heavily.
- **God rays**: 4–8 soft diagonal light shafts coming from the top, low opacity (5–15%), drifting or swaying slowly.
- **Marine snow**: small, soft, blurred dots (bokeh) drifting slowly up or down, two depth layers.
- **Depth = darkness**: as the story goes deeper, rays fade out and the background goes toward #05080c. Deep scenes are almost black, with only the subject lit.
- **Spotlight motif**: a cone or radial pool of light picks out the hero object (a tooth on the seabed, a diver against a sunburst, a whale in a flashlight beam).
- Optional **seabed**: a flat sand-colored wavy band or a dark silhouette ridge at the bottom.
- Optional **surface line**: a bright horizontal band at the top for "near the surface" shots.

### Camera
- Mostly a **locked-off side view** (orthographic, like a diorama).
- Moves are slow **push-ins** (scale 1.0→1.3 over 2–4 s, ease-in-out) and slow pans that follow a swimming subject.
- **Head-on approach shot**: the subject starts tiny and dark in the center and scales up toward the camera. The eyes light up red at the end (the megalodon "threat" beat).
- **Zoom-into-detail transitions**: the camera pushes into one part of the subject (the diver's tank, the whale's head) while a thin **circular reticle** marks the target.

### Characters / creatures
- **Side-profile flat vector cut-outs**. Animation is **rigid-body plus slight bending**: the body translates and slowly rotates, the tail sways (a sine wave on 2–3 segments), fins flap. There is no frame-by-frame redrawing.
- Swim cycle: a slow body bob (±4 px, about 2 s period), tail rotation ±8°, constant drift across the frame.
- **Silhouette mode**: the same asset filled pure black/navy and backlit. Used for mystery, scale comparisons and "unknown" beats.
- **Recolor modes** for the same asset: thermal (orange/brown on a purple bg), sonar (neon green on black), x-ray/cutaway (translucent body showing an organ, such as the glowing red brain).
- Humans are either a **scuba diver** (dark suit, white tank, yellow fins, cyan mask) or a **minimal stick-figure scientist** (block body, glasses, a pointer at a whiteboard).
- **Groups/schools**: the same asset instanced with random scale, offset and phase.

### Text & overlays (the main storytelling layer)
- **Kinetic keyword captions**, synced word by word to the voiceover. There is no full subtitle track, only 1–5 punchline words.
- **Label pills**: small rounded dark rectangles (bg ~#1a222b at 85%), bold caps text, sometimes with a ✓ check icon in a green circle. They slide or fade in at the lower left.
- **Stacking fact list**: the pills stack vertically next to the subject one per beat. The last one is **red-tinted** for the shocking fact ("SANK A SHIP ON PURPOSE").
- **Stamps**: a rotated (−5° to −8°) outline box with distressed caps text ("THE RULE" in green, "NEVER PROVEN" and "STOPPED" in red). It pops in at a scale of 1.3→1.0 with a tiny shake.
- **Hand-drawn circles**: a wobbly yellow marker ellipse, animated as a stroke draw-on over 0.4 s, used to point at features or map regions. Sometimes several in alternating yellow and red.
- **Red X / crossed-out lines** to reject an idea.
- **Corner tags**: small caps labels at the top left ("APEX PREDATOR", "1728", "THE 1960s", "Bitten whale tail vertebra") with a thin underline.

### Infographic set-pieces
- **Meter bar**: a rounded track with a green→yellow→red gradient fill that animates from left to right while a big number counts up ("236 dB"), followed by a ring pulse.
- **Pictogram/isotype grid**: rows of whale icons fill in one by one ("each icon = 10,000"), with a counter box on the right. Lost units fade to dim red.
- **Sonar/radar**: a green polar grid and a sweep line on black. Detected objects light up neon green with labels (SQUID / FISH / ROCKS / YOU).
- **Height chart / lineup**: horizontal gridlines with meter labels (4 m / 8 m / 12 m) and front-view creatures with name cards ("MEGALODON — suspect 1", "grandpa / dad / the kid").
- **Stylized map**: flat beige continents with a teal coastline glow on a blueprint-grid ocean. Camera push into a region, then a hand circle and a place name.
- **Document/card**: an off-white paper card (a treaty, a species card) with greyed placeholder lines, then a stamp hits it.
- **Checkbox list**: "YOUR OPTIONS" with empty checkboxes that tick in sequence.
- **Evidence scene**: a dark backdrop with yellow numbered evidence markers (1, 2) and a spotlit fossil, a measurement bracket and a "~5 cm" label.
- **Split screen / panels**: vertical panels that reveal one per beat (SHIP STRIKES | FISHING GEAR | UNDERWATER NOISE).
- **Whiteboard gag**: scientists beside a whiteboard where a doodle draws on stroke by stroke ("STUN??").
- **Floating name cloud**: many Latin names in italics drifting at different depths and opacities around an object, with one highlighted in orange.

### Transitions
- Cuts on the narration beat (the dominant transition).
- Fade through black between story chapters.
- A camera push turns into the next shot (match zoom).
- Shots use the same palette, so a background swap reads as continuous.

### Timing
- A new visual event every **1.5–3 s**. A shot lasts 3–8 s.
- Text enters **on the stressed word** (±2 frames) and holds until the next beat.
- Easing: ease-out-cubic for entrances (~10–15 frames), with a small overshoot on stamps and pills.

---

## 2. Preset A — "Abyss Minimal" (sperm whale video)

- **Fills**: flat fills with no outlines. A subtle inner gradient and a faint grain texture on creatures.
- **Palette**: bg #0a1622 → #123448 top, whale grey #8d8d8b, diver suit #2b2f36, tank #e8e8e8, fins #f2b705, mask cyan #6fd3e6. Accents: alert red #e5383b, check green #3ecf6a, sonar green #39ff6a.
- **Typography**: a heavy geometric sans in ALL CAPS with wide tracking (Montserrat/Poppins ExtraBold style), small sizes (~2–3% of frame height). Headlines in red with an underline.
- **Mood**: calm, documentary, cold. A lot of negative space with the subject small in the frame.

## 3. Preset B — "Ink Cartoon" (megalodon video)

- **Fills**: thick dark **outlines** (~3–4 px at 1080p) with cel-shaded fills and hatch/scar texture lines on creatures. The look is close to a comic book.
- **Creature design**: exaggerated toothy grins, a counter-shaded belly with a jagged edge, and red glowing eyes for threat beats.
- **Palette**: bg teal #1d4f66 → #0b1d2a, tooth grey #5a6570, root tan #c8a06a, sand #d9c48f, map land #cdbb7f. Highlight **orange-gold #f5a623** for keywords, red #e0453a for negatives, marker yellow #f2e35b.
- **Typography**: a rounded sans (Raleway/Nunito style) in **mixed weight and case**. Regular lowercase words sit next to one ALL-CAPS BOLD keyword in orange ("physical **EVIDENCE**", "warm **SHALLOW** coastal seas"). They sit at the lower or upper center.
- **Mood**: playful mystery and "detective case file".

---

## 4. What the skill must implement (build list)

1. **Scene engine**: layered (bg → rays → particles → seabed → actors → overlays → vignette/grain), with a timeline keyed to word timestamps. Remotion, Motion Canvas, or Python + Cairo/Skia to PNG frames to ffmpeg would all work.
2. **Asset library**: parametric SVG creatures (whale, shark, orca, squid, fish, diver, stick scientist, ship) with named pivot groups (body, tail, fins, jaw, eye). Each asset supports normal, silhouette, thermal, sonar and x-ray render modes.
3. **Rig motions**: swim, drift, approach-to-camera, bite (jaw rotation), school spawn, tail sway.
4. **Overlay components**: KeywordCaption, LabelPill(+check), FactStack, Stamp, MarkerCircle (draw-on), RedX, CornerTag, Reticle.
5. **Infographic components**: MeterBar, IsotypeGrid, SonarSweep, HeightLineup, StylizedMap with zoom, DocCard, Checklist, EvidenceMarkers, SplitPanels, NameCloud, Whiteboard.
6. **Post FX**: vignette, film grain (2–4%), slight bloom on light sources, soft chromatic glow on neon modes.
7. **Pipeline**: script/voiceover → Whisper word timestamps → beat list (one visual event per stressed phrase) → shot assignment from the component list → render → music bed (low ambient drone) and SFX (whoosh on pills, thud on stamps, sonar pings) → mux.
8. **Style presets**: `abyss-minimal` and `ink-cartoon`, set by tokens (palette, stroke width, font, caption case rules).

## 5. Notes
- There is almost no character acting. The storytelling comes from layout, labels and camera moves, so the skill should invest in the overlay and infographic components more than in character animation.
- Fixing the creatures to side-on and front-on views keeps the asset count small. Every shot reuses one of those two views.

---
## Mapping to KazChart elements
| Look in the reference | KazChart |
|---|---|
| Label pill + check | `pill` with `check:true` |
| Stacking facts, red last | `factstack`, last item `tone:"red"` |
| THE RULE / NEVER PROVEN | `stamp` (green `#3ecf6a` / red) |
| Yellow marker circle | `circle` |
| Loudness bar | `meter` |
| Population icons | `isotype` with `counter`, `lostFrom/lostT` |
| Sonar screen | `bg.mode:"sonar"` + `sonar` + creatures `mode:"sonar"` |
| Size lineup | `gridlines` + `sharkFront` + `namecard` |
| Head-on threat | `sharkFront` + `approach` + `threat:true` |
| Spotlit fossil | `bg.spotlight` + `seabed` + `tooth` + `circle` |
| Evidence scene | `bg.mode:"paper"` + `marker` + `bracket` |
| Treaty / document | `doccard` + `stamp` |
| Options list | `checklist` |
