// Usage: npm run captions -- public/audio/voiceover.mp3 [outputJson] [model]
// Transcribes an audio/video file locally with whisper.cpp and writes
// Remotion-compatible Caption[] JSON (word-level timestamps).
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const [input, output = "public/captions.json", model = "medium.en"] = process.argv.slice(2);
if (!input) {
  console.error("Usage: npm run captions -- <audio-or-video-file> [output.json] [model]");
  process.exit(1);
}

const WHISPER_VERSION = "1.5.5";
const whisperPath = path.join(process.cwd(), ".whisper");
const wavPath = path.join(whisperPath, "input-16khz.wav");
fs.mkdirSync(whisperPath, { recursive: true });

// whisper.cpp needs 16 kHz mono WAV
execFileSync("ffmpeg", ["-y", "-i", input, "-ar", "16000", "-ac", "1", wavPath], { stdio: "inherit" });

await installWhisperCpp({ to: whisperPath, version: WHISPER_VERSION });
await downloadWhisperModel({ model, folder: whisperPath });

const whisperCppOutput = await transcribe({
  model,
  whisperPath,
  whisperCppVersion: WHISPER_VERSION,
  inputPath: wavPath,
  tokenLevelTimestamps: true,
});

const { captions } = toCaptions({ whisperCppOutput });
fs.writeFileSync(output, JSON.stringify(captions, null, 2));
console.log(`Wrote ${captions.length} captions to ${output}`);
