import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
// Needed so WebGL (Three.js) works in headless Chromium, both locally and on servers.
Config.setChromiumOpenGlRenderer("angle");
