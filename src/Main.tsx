import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import { z } from "zod";
import { Scene3D } from "./components/Scene3D";
import { Captions } from "./components/Captions";

export const mainSchema = z.object({
  title: z.string(),
  color: z.string(),
  audioSrc: z.string(),
  captionsSrc: z.string(),
});

export const Main: React.FC<z.infer<typeof mainSchema>> = ({
  color,
  audioSrc,
  captionsSrc,
}) => {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [handle] = useState(() => delayRender("Loading captions"));

  useEffect(() => {
    fetch(staticFile(captionsSrc))
      .then((res) => res.json())
      .then((data: Caption[]) => {
        setCaptions(data);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [captionsSrc, handle]);

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#0b0d17" }}
      from={16}
      durationInFrames={164}
      trimBefore={16}
    >
      <Scene3D color={color} />
      <Captions captions={captions} />
      <Audio src={staticFile(audioSrc)} volume={0.6} />
    </AbsoluteFill>
  );
};
