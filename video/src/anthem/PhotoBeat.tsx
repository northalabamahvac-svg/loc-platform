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

export type PhotoBeatProps = {
  src: string;
  line: string[];
  fontSize?: number;
  durationInFrames: number;
};

// Full-bleed real project photo with a slow push-in and the anthem line
// pinned at the lower third, inside the mobile safe zone.
export const PhotoBeat: React.FC<PhotoBeatProps> = ({
  src,
  line,
  fontSize = 104,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, durationInFrames], [1.04, 1.14]);
  const opacity = interpolate(frame, [0, 3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pop = spring({
    frame: frame - 2,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 220 },
  });
  const textY = interpolate(pop, [0, 1], [46, 0]);
  const textOpacity = interpolate(frame, [2, 7], [0, 1], {
    extrapolateRight: "clamp",
  });


  return (
    <AbsoluteFill style={{ background: theme.logoBlack, opacity }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom})`,
          }}
        />
      </AbsoluteFill>
      {/* legibility gradient — deep lower-third scrim so labels/stickers on
          the equipment can't compete with the headline */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(16,16,16,0.35) 0%, rgba(16,16,16,0) 28%, rgba(16,16,16,0.25) 48%, rgba(16,16,16,0.94) 76%)",
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          paddingBottom: 240,
          paddingLeft: 70,
          paddingRight: 70,
        }}
      >
        <div
          style={{
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              width: 130,
              height: 14,
              background: theme.gold,
              borderRadius: 7,
            }}
          />
          <h1
            style={{
              fontSize,
              fontWeight: 800,
              color: theme.white,
              lineHeight: 1.06,
              margin: 0,
              letterSpacing: -1,
              textShadow: "0 6px 30px rgba(0,0,0,0.55)",
            }}
          >
            {line.map((l, i) => (
              <div key={i} style={{ whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </h1>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
