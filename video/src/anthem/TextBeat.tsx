import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

export type TextBeatProps = {
  line: string[];
  bg: "red" | "blue";
  fontSize?: number;
};

// One rhythmic "For the ..." title card, Coke-anthem style: solid brand
// background, giant white type popping in on a hard cut, gold star accent.
export const TextBeat: React.FC<TextBeatProps> = ({
  line,
  bg,
  fontSize = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 220 },
  });
  const scale = interpolate(pop, [0, 1], [1.14, 1]);
  const opacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateRight: "clamp",
  });

  const starPop = spring({
    frame: frame - 3,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 240 },
  });
  const starScale = interpolate(starPop, [0, 1], [0, 1]);
  const starRot = interpolate(starPop, [0, 1], [-120, 0]);

  const base = bg === "red" ? theme.logoRed : theme.logoBlue;
  const deep = bg === "red" ? theme.logoRedDeep : theme.logoBlueDeep;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 38%, ${base} 0%, ${deep} 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 44,
          transform: `scale(${scale})`,
          opacity,
          padding: "0 60px",
        }}
      >
        <svg
          width="88"
          height="88"
          viewBox="0 0 24 24"
          style={{
            transform: `scale(${starScale}) rotate(${starRot}deg)`,
          }}
        >
          <path
            d="M12 1.6l3.1 6.9 7.3.8-5.5 5 1.6 7.3L12 17.9l-6.5 3.7 1.6-7.3-5.5-5 7.3-.8z"
            fill={theme.gold}
          />
        </svg>
        <h1
          style={{
            fontSize,
            fontWeight: 800,
            color: theme.white,
            textAlign: "center",
            lineHeight: 1.06,
            margin: 0,
            letterSpacing: -1,
            textShadow: "0 6px 30px rgba(0,0,0,0.35)",
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
  );
};
