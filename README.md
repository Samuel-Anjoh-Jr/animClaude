# animClaude — 3D animated videos with Three.js + Remotion

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Open Remotion Studio (live preview, timeline, props editor) |
| `npm run render` | Render `Main` to `out/video.mp4` |
| `npm run render:still` | Render a single frame to `out/thumbnail.png` |
| `npm run captions -- <audio-file>` | Transcribe audio locally (whisper.cpp) into `public/captions.json` |
| `npm run typecheck` | Type-check the project |

## Layout

- `src/Root.tsx` — registers compositions (size, fps, duration, default props)
- `src/Main.tsx` — composes 3D scene + captions + audio
- `src/components/Scene3D.tsx` — Three.js scene via `@remotion/three` (`<ThreeCanvas>`)
- `src/components/Captions.tsx` — TikTok-style word-highlight captions (`@remotion/captions`)
- `public/` — static assets (`audio/`, `captions.json`), loaded with `staticFile()`

## Rules of thumb

- **Drive all 3D motion from `useCurrentFrame()`**, not `useFrame()` or `requestAnimationFrame`. Otherwise renders are non-deterministic.
- Use `<ThreeCanvas>` from `@remotion/three`, not R3F's `<Canvas>`.
- All `remotion` / `@remotion/*` packages (and `zod`) are pinned to exact versions. Keep them identical when upgrading: `npx remotion upgrade`.
- Load GLTF/textures with `staticFile()` and `useLoader`/drei's `useGLTF`; Remotion waits for them.

## Rendering without a GPU (servers, CI, containers)

`remotion.config.ts` uses `--gl=angle`. On machines with no GPU, WebGL fails; render with software GL:

```bash
npx remotion render src/index.ts Main out/video.mp4 --gl=swangle
```

## Captions workflow

1. Put a voiceover in `public/audio/` and point `audioSrc` (in `src/Root.tsx`) at it.
2. `npm run captions -- public/audio/voiceover.mp3` — requires `ffmpeg`; downloads whisper.cpp and a model (`medium.en` by default, pass another as the 3rd argument) on first run.
3. Set `durationInFrames` in `src/Root.tsx` to match your audio.

`public/captions.json` and `public/audio/sample.mp3` are placeholders.
