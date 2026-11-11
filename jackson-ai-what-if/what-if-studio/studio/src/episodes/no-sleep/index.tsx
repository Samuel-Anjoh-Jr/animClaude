import React from 'react';
import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14 } from './shots';

// The power's look lives in the shots themselves: Pip's eyes glint cyan (pose.glint) and the AWAKE chip pops in the
// corner while a demo line says "No sleep." No engine grade: the night stays the night; the clock does the talking.
export const noSleep = defineEpisode('NoSleep', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14 },
});
