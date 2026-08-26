import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

export type PhotoSceneProps = {
  src: string;
  lines: { text: string[]; fontSize?: number }[];
  durationInFrames: number;
  motion?: "in" | "out";
  focus?: string;
  /** delay before the first super appears (lets an incoming crossfade land first) */
  superInDelay?: number;
  /** how early the last super clears before the scene ends (keeps text out of the outgoing crossfade) */
  superOutEarly?: number;
};

const SUPER_FADE = 14;

// One montage scene: a full-bleed photo drifting slowly (Ken Burns) while
// two "For the ..." supers take turns over a consistent dark grade. No
// hard cuts anywhere — supers dissolve, scenes crossfade around this.
export const PhotoScene: React.FC<PhotoSceneProps> = ({
  src,
  lines,
  durationInFrames,
  motion = "in",
  focus = "50% 50%",
  superInDelay = 0,
  superOutEarly = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom =
    motion === "in"
      ? interpolate(frame, [0, durationInFrames], [1.03, 1.14])
      : interpolate(frame, [0, durationInFrames], [1.14, 1.04]);
  const drift =
    motion === "in"
      ? interpolate(frame, [0, durationInFrames], [0, -22])
      : interpolate(frame, [0, durationInFrames], [-22, 0]);

  const half = Math.floor(durationInFrames / 2);

  return (
    <AbsoluteFill style={{ background: theme.logoBlack }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: focus,
            transform: `scale(${zoom}) translateY(${drift}px)`,
          }}
        />
      </AbsoluteFill>
      {/* consistent cinematic grade: cool-dark vignette + deep lower third */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(10,16,26,0.42) 0%, rgba(10,16,26,0.08) 30%, rgba(10,16,26,0.22) 52%, rgba(8,12,20,0.92) 78%)`,
        }}
      />
      {lines.map((line, i) => {
        const start = i === 0 ? superInDelay : i * half;
        const localFrame = frame - start;
        const fadeIn = interpolate(localFrame, [0, SUPER_FADE], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const isLast = i === lines.length - 1;
        const outEnd = isLast ? durationInFrames - superOutEarly : (i + 1) * half;
        const fadeOut =
          !isLast || superOutEarly > 0
            ? interpolate(
                frame,
                [outEnd - SUPER_FADE, outEnd],
                [1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )
            : 1;
        const rise = spring({
          frame: localFrame,
          fps,
          config: { damping: 40, mass: 1.1, stiffness: 60 },
        });
        const y = interpolate(rise, [0, 1], [34, 0]);
        return (
          <AbsoluteFill
            key={i}
            style={{
              justifyContent: "flex-end",
              paddingBottom: 250,
              paddingLeft: 70,
              paddingRight: 70,
              opacity: fadeIn * fadeOut,
            }}
          >
            <div
              style={{
                transform: `translateY(${y}px)`,
                display: "flex",
                flexDirection: "column",
                gap: 26,
              }}
            >
              <div
                style={{
                  width: 130,
                  height: 12,
                  background: theme.gold,
                  borderRadius: 6,
                }}
              />
              <h1
                style={{
                  fontSize: line.fontSize ?? 100,
                  fontWeight: 800,
                  color: theme.white,
                  lineHeight: 1.08,
                  margin: 0,
                  letterSpacing: -1,
                  textShadow: "0 6px 34px rgba(0,0,0,0.6)",
                }}
              >
                {line.text.map((l, j) => (
                  <div key={j} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </h1>
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
