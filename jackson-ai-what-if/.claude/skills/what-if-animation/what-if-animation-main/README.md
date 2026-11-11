# What If Animation by Jackson AI

**One line in. A finished animated episode out.**

Give it a premise like *"What if you could rewind 10 seconds?"* and it hands you back a finished 15-25 second
episode in the dusk-lit stick-figure style of the "What If" channels on YouTube: script, voice, animation, sound
effects, music and a mastered MP4.

It's a free skill for **Claude Code** and **OpenCode**. Every frame is drawn in code: the AI writes each scene as
SVG and Remotion renders it. Voice and sound effects come from ElevenLabs. There's no image model, no video model
and nothing to draw by hand.

---

## How it works

Each episode goes through eight steps:

1. **Script.** Written on the seven-beat What If formula: a cold open of quick demos, the premise as a title card,
   the fun part, and a twist built on one real, checked fact.
2. **Voice.** Recorded with ElevenLabs, with word-level timings, and the pauses tightened to the genre's pace.
3. **Shot list.** Cuts are placed on the words at the fast pace these channels use (around 27 cuts a minute in the
   opening).
4. **Storyboard.** One still per shot, so you can see the episode before anything is animated.
5. **Self-check.** The stills are checked against an 11-point list, and anything that reads wrong gets fixed.
6. **Animation.** An original cast on one rig, in rooms drawn in real perspective and lit by their own lamps and
   windows.
7. **Sound.** An effect on every action, timed to its attack, plus ambience for each location, a music bed and
   levels balanced against the voice.
8. **Master.** The final mix is mastered to -14 LUFS (YouTube's loudness target), and you get a report of what the
   episode cost.

### Why the character never changes

The main character, Pip, isn't generated. Pip is a rig in code, and the same function draws Pip in every shot, so
there's nothing to drift between scenes.

---

## What you need

- [Claude Code](https://claude.com/claude-code), or [OpenCode](https://opencode.ai) with a free model (see
  [Use it in OpenCode](#use-it-in-opencode-for-free))
- Node 18 or newer
- ffmpeg (with ffprobe)
- Python 3.9+ with `numpy` and `Pillow`
- An [ElevenLabs](https://elevenlabs.io) API key, set as `ELEVENLABS_API_KEY` in your environment or in a `.env`
  file (one line: `ELEVENLABS_API_KEY=your-key`). **Never publish your `.env` file.**

### What it costs

An episode uses roughly **150-250 ElevenLabs credits**, split between the voice and any new sound effects. Every
effect you generate is saved to `studio/library/sfx/` and reused in later episodes, so you pay less as your library
grows. A starter library ships with the studio.

ElevenLabs' free plan covers a good number of episodes a month, but it's for non-commercial use and asks you to
credit ElevenLabs. Check their current terms before you monetise a channel.

---

## Install in Claude Code

Copy this folder into your skills folder, then set up the studio once:

```bash
cp -r path/to/what-if-animation ~/.claude/skills/what-if-animation
cp -r ~/.claude/skills/what-if-animation/studio ./what-if-studio
cd what-if-studio && npm install
```

Then, in Claude Code, from that folder, ask:

> Make a What If episode: what if you could pause everyone but you?

Claude follows `SKILL.md` through every step. You'll see the storyboard before anything is animated. When it's
done you get:

- `out/<slug>/<slug>-final.mp4`, the finished episode
- `out/<slug>/storyboard.jpg`, the storyboard

### Try the examples first

Run `npx remotion studio src/index.ts` and open either example. Both render straight away.

- **`Rewind`**: three quick demos, each undone by playing the shot backwards
- **`CopyPaste`**: a full episode with a kitchen set, a science diagram and a cliffhanger ending

---

## Use it in OpenCode, for free

[OpenCode](https://opencode.ai) is a free, open-source coding agent. Paired with a free model, it can run this whole
skill with no model costs. You only pay ElevenLabs credits for the voice and sound.

1. Install the tools above, then OpenCode: `npm install -g opencode-ai`
2. Make a folder for your episodes, put the skill in it under `.claude/skills/`, and add the `/what-if` command.
   OpenCode doesn't list skills when you type `/`, so the command loads the skill for you.

   **Windows (PowerShell):**

   ```powershell
   mkdir what-if; cd what-if
   Copy-Item -Recurse path\to\what-if-animation .claude/skills/what-if-animation
   mkdir .opencode/commands
   copy .claude/skills/what-if-animation/opencode/commands/what-if.md .opencode/commands/
   ```

   **Mac or Linux:**

   ```bash
   mkdir what-if && cd what-if
   cp -r path/to/what-if-animation .claude/skills/what-if-animation
   mkdir -p .opencode/commands && cp .claude/skills/what-if-animation/opencode/commands/what-if.md .opencode/commands/
   ```

   Got it as a ZIP? Unzip it into `.claude/skills/` (the folder's name doesn't matter), then copy
   `opencode/commands/what-if.md` from it into `.opencode/commands/`.
3. Put your key in a file called `.env` in the same folder, on one line: `ELEVENLABS_API_KEY=your-key`
4. Start OpenCode **from inside that folder**: `cd` into it, then type `opencode`. (On Windows you can right-click
   the folder and choose Open in Terminal.) Started anywhere else, it won't find the skill or the command.
5. Type `/models`, pick a free model, and turn its reasoning level up to high if it has one.
6. Type `/what-if What if you could pause everyone but you?` and leave it running. The first run copies the studio
   into `what-if-studio/` and installs it, so it takes a few extra minutes.

### Tips for free models

- **One session per episode.** An episode can fill most of a model's context, so start fresh for the next one.
- **Check your premise yourself.** Search YouTube before you start. A free model's search can miss episodes that
  already exist, and you want an original title.
- **Check the fact before you post.** Open the source of the episode's fact (`science` in its `episode.json`).

---

## What's in the folder

| Path | What it is |
|---|---|
| `SKILL.md` | The step-by-step pipeline the AI follows |
| `references/` | The script formula, the look and its checklists, the building-block catalogue, sound, and common traps |
| `studio/` | The Remotion project: the engine (rig, sets, lighting, UI, episode engine) and two example episodes |
| `scripts/` | Voice, plan, stills, board, sfx, mixcheck, motiongrid and master |
| `opencode/commands/what-if.md` | The `/what-if` command for OpenCode |

---

## Ground rules

- **Original characters only.** Never a channel's hero, and nothing that looks like a famous cartoon character.
- **Original stories.** The formula is shared; the episodes are yours.
- **No false claims.** It never says other channels are made with Claude or any other tool.
- **Facts are checked.** Every fact in a script is worked out and sourced before it's voiced.

## Limits to know about

- Walk cycles and acting are simple compared with a hand-animated channel. The look carries it.
- Painted, textured styles (like ink-and-paper explainers) aren't realistic in pure code; they need an image model.
- It's not a one-prompt button. The storyboard step is where an episode gets good, so look at it.

---

## Licences

- **Code:** MIT. See `LICENSE`. Free to use, change and share.
- **Fonts:** loaded from Google Fonts at render time (Bricolage Grotesque, Fragment Mono, Kalam), all under the SIL
  Open Font License. To use your own title font, put it in `studio/public/fonts/` and set `titleFont` in
  `src/studio.config.ts`.
- **Remotion:** [free](https://www.remotion.dev/license) for individuals and companies of up to three people.
  Larger companies need a Remotion company licence.
- **Voice and sound:** generated by your own ElevenLabs account under its terms.

---

Made by **Jackson AI**.
