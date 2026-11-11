import { useMemo } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["800"], subsets: ["latin"] });

/** How long (ms) tokens are merged into one page. Lower = fewer words per page. */
const COMBINE_TOKENS_WITHIN_MS = 1200;

export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const { fps } = useVideoConfig();

  const pages = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: COMBINE_TOKENS_WITHIN_MS,
      }).pages,
    [captions],
  );

  return (
    <>
      {pages.map((page, i) => {
        const next = pages[i + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const endFrame = Math.min(
          next ? Math.round((next.startMs / 1000) * fps) : Infinity,
          startFrame + Math.round((page.durationMs / 1000) * fps),
        );
        const duration = endFrame - startFrame;
        if (duration < 1) return null;

        return (
          <Sequence key={i} from={startFrame} durationInFrames={duration} layout="none">
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </>
  );
};

const CaptionPage: React.FC<{ page: ReturnType<typeof createTikTokStyleCaptions>["pages"][number] }> = ({
  page,
}) => {
  const frame = useCurrentFrame(); // relative to the Sequence
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000 + page.startMs;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 120,
        fontFamily,
        fontWeight: 800,
        fontSize: 84,
        whiteSpace: "pre",
        textShadow: "0 4px 24px rgba(0,0,0,0.6)",
      }}
      durationInFrames={75}
    >
      <div>
        {page.tokens.map((token) => {
          const active = token.fromMs <= nowMs && token.toMs > nowMs;
          return (
            <span key={token.fromMs} style={{ color: active ? "#ffd93d" : "white" }}>
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
