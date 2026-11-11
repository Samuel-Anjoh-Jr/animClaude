#!/usr/bin/env bash
# KazChart Skill one-step setup (macOS / Linux). Run: bash setup.sh
set -e
cd "$(dirname "$0")"
ok(){ echo "  ✓ $1"; }; miss(){ echo "  ✗ $1"; }
echo "KazChart setup"
if ! command -v node >/dev/null; then miss "Node.js not found - install Node 18+ from https://nodejs.org then re-run"; exit 1; fi
V=$(node -p 'process.versions.node.split(".")[0]'); [ "$V" -ge 18 ] || { miss "Node $V is too old (need 18+)"; exit 1; }; ok "Node $(node -v)"
if ! command -v ffmpeg >/dev/null; then
  echo "  … installing ffmpeg"
  if command -v brew >/dev/null; then brew install ffmpeg
  elif command -v apt-get >/dev/null; then sudo apt-get update && sudo apt-get install -y ffmpeg
  elif command -v dnf >/dev/null; then sudo dnf install -y ffmpeg
  else miss "ffmpeg not found - install it from https://ffmpeg.org"; exit 1; fi
fi; ok "ffmpeg"
echo "  … installing Playwright + Chromium"
npm install --silent && npx playwright install chromium; ok "Playwright"
if command -v python3 >/dev/null; then
  python3 -m pip install -q -r requirements.txt 2>/dev/null || python3 -m pip install -q --break-system-packages -r requirements.txt || echo "  ! faster-whisper not installed (optional)"
  ok "Python extras (optional)"
else echo "  ! Python 3 not found - voiceover auto-timing disabled (optional)"; fi
echo "Testing render…"
node scripts/render.mjs examples/ink-demo.json test-render.mp4 --scale 0.5 --to 3 && ok "Done! test-render.mp4 created."
