#!/bin/bash
# setup.sh <project dir>: copies the engine into a new short's folder, installs three.js r160, builds toon.js, links Playwright.
set -e
KIT="$(cd "$(dirname "$0")/.." && pwd)"; DST="${1:?usage: setup.sh ~/shorts/<slug>}"
mkdir -p "$DST"/{web,work,stills,frames,out,audio}
cp -n "$KIT"/engine/web/* "$DST/web/"; cp -n "$KIT"/engine/{render.mjs,timing.py,sheet.py,finish.sh} "$DST/"; cp -n "$KIT"/engine/audio/* "$DST/audio/"
chmod +x "$DST/finish.sh"
cd "$DST/web"
[ -f package.json ] || printf '{ "name": "short", "private": true, "type": "module" }\n' > package.json
[ -d node_modules/three ] || npm i three@0.160.0 --no-audit --no-fund >/dev/null
cat toonbase.js cast.js > toon.js
cd "$DST"
if [ ! -e node_modules ]; then G=$(npm root -g); [ -d "$G/playwright" ] && ln -s "$G" node_modules || echo "install playwright: npm i -g playwright && npx playwright install chromium"; fi
echo "ready: $DST (story.js is the Mountain Man example: replace its world layout and shots for the new story)"
