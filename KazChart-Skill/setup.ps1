# KazChart Skill one-step setup (Windows PowerShell). Run: powershell -ExecutionPolicy Bypass -File setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "KazChart setup"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { winget install -e --id OpenJS.NodeJS.LTS; Write-Host "Node installed - close and reopen PowerShell, then run this again."; exit }
Write-Host "  OK Node $(node -v)"
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { winget install -e --id Gyan.FFmpeg; Write-Host "ffmpeg installed - reopen PowerShell, then run this again."; exit }
Write-Host "  OK ffmpeg"
npm install --silent; npx playwright install chromium
Write-Host "  OK Playwright"
if (Get-Command python -ErrorAction SilentlyContinue) { python -m pip install -q -r requirements.txt; Write-Host "  OK Python extras (optional)" }
else { Write-Host "  ! Python not found - voiceover auto-timing disabled (optional)" }
node scripts/render.mjs examples/ink-demo.json test-render.mp4 --scale 0.5 --to 3
Write-Host "Done! test-render.mp4 created."
