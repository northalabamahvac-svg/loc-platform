import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SafeFrame } from "../components/SafeFrame";
import { theme } from "../theme";

const IMAGES = [
  { src: "brand/project-1.webp", headline: "Precision installs." },
  { src: "brand/project-2.webp", headline: "Clean, tidy work." },
  { src: "brand/project-3.webp", headline: "Done right the first time." },
];

const PER_IMAGE = 50;
const CROSSFADE = 12;

export const Scene4Showcase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: theme.bg0 }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.navy}44 0%, transparent 65%)`,
        }}
      />

      <SafeFrame>
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 44,
          }}
        >
          {/* Headlines */}
          <div style={{ height: 90, position: "relative", width: "100%" }}>
            {IMAGES.map((img, i) => {
              const start = i * PER_IMAGE;
              const end = start + PER_IMAGE;
              const opacity =
                frame < start
                  ? 0
                  : frame < start + CROSSFADE
                    ? interpolate(frame, [start, start + CROSSFADE], [0, 1])
                    : frame > end
                      ? interpolate(frame, [end, end + CROSSFADE], [1, 0], {
                          extrapolateRight: "clamp",
                        })
                      : 1;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: 68,
                    fontWeight: 800,
                    color: theme.white,
                    textAlign: "center",
                    opacity,
                    textShadow: "0 4px 20px rgba(0,0,0,0.6)",
                  }}
                >
                  {img.headline}
                </div>
              );
            })}
          </div>

          {/* Image stack */}
          <div
            style={{
              width: 960,
              height: 1280,
              position: "relative",
            }}
          >
            {IMAGES.map((img, i) => {
              const start = i * PER_IMAGE;
              const localFrame = frame - start;
              const isFirst = i === 0;
              const s = isFirst
                ? spring({
                    frame: localFrame,
                    fps,
                    config: { damping: 18, stiffness: 100 },
                  })
                : 1;
              const scale = isFirst
                ? interpolate(s, [0, 1], [0.9, 1])
                : 1;
              const opacity =
                frame < start
                  ? 0
                  : frame < start + CROSSFADE
                    ? interpolate(frame, [start, start + CROSSFADE], [0, 1])
                    : 1;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 24,
                    overflow: "hidden",
                    boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 0 3px ${theme.cardBorder}`,
                    opacity,
                    transform: `scale(${scale})`,
                  }}
                >
                  <Img
                    src={staticFile(img.src)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </SafeFrame>
    </AbsoluteFill>
  );
};
