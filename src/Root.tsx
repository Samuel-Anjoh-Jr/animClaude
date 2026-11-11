import { Composition } from "remotion";
import { Main, mainSchema } from "./Main";

export const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      schema={mainSchema}
      durationInFrames={FPS * 6}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{
        title: "Three.js + Remotion",
        color: "#ff6b35",
        audioSrc: "audio/sample.mp3",
        captionsSrc: "captions.json",
      }}
    />
  );
};
