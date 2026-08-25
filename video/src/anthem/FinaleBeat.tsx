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

// Sparkles fan out only through the upper arc, above the logo and away
// from every text line, staying inside the 60px side margins.
const SPARKLES = Array.from({ length: 9 }).map((_, i) => {
  const seed = (i * 7919 + 104729) % 6151;
  const angle = Math.PI + (i / 8) * Math.PI; // 180°..360° = upward fan
  const distance = 340 + (seed % 120);
  const size = i % 2 === 0 ? 30 : 20;
  const delay = 10 + (seed % 6);
  return { angle, distance, size, delay };
});

// Closing card. The scene crossfades in from the last photo, so all
// elements are present from frame 0 and only settle gently — no slam,
// no blank white moment.
export const FinaleBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const settle = spring({
    frame,
    fps,
    config: { damping: 30, mass: 1.2, stiffness: 60 },
  });
  const logoScale = interpolate(settle, [0, 1], [1.07, 1]);

  const lineRise = spring({
    frame: frame - 8,
    fps,
    config: { damping: 32, mass: 1.1, stiffness: 70 },
  });
  const lineY = interpolate(lineRise, [0, 1], [30, 0]);
  const lineOpacity = interpolate(frame, [6, 26], [0, 1], {
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [30, 52], [0, 1], {
    extrapolateRight: "clamp",
  });
  const pulse = 1 + 0.012 * Math.sin(frame * 0.14);

  return (
    <AbsoluteFill
      style={{
        background: "#ffffff",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* gold sparkle drift above the logo */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {SPARKLES.map((p, i) => {
          const pFrame = Math.max(0, frame - p.delay);
          const s = spring({
            frame: pFrame,
            fps,
            config: { damping: 30, mass: 1.5, stiffness: 50 },
          });
          const px = Math.max(
            -440,
            Math.min(440, Math.cos(p.angle) * p.distance * s)
          );
          const py = Math.sin(p.angle) * p.distance * s - 330;
          const sparkOpacity = interpolate(pFrame, [0, 14, 55], [0, 0.85, 0], {
            extrapolateRight: "clamp",
          });
          return (
            <svg
              key={i}
              width={p.size}
              height={p.size}
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                transform: `translate(${px}px, ${py}px) rotate(${s * 25}deg)`,
                opacity: sparkOpacity,
              }}
            >
              <path
                d="M12 1.6l3.1 6.9 7.3.8-5.5 5 1.6 7.3L12 17.9l-6.5 3.7 1.6-7.3-5.5-5 7.3-.8z"
                fill={theme.gold}
              />
            </svg>
          );
        })}
      </AbsoluteFill>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 56,
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        <Img
          src={staticFile("brand/logo-mark.png")}
          style={{
            width: 860,
            height: "auto",
            transform: `scale(${logoScale})`,
          }}
        />

        <h1
          style={{
            fontSize: 118,
            fontWeight: 800,
            color: theme.logoBlack,
            margin: 0,
            letterSpacing: -1,
            transform: `translateY(${lineY}px)`,
            opacity: lineOpacity,
          }}
        >
          For everyone.
        </h1>

        <div
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: "#4b5563",
            letterSpacing: 1,
            transform: `translateY(${lineY}px)`,
            opacity: lineOpacity,
          }}
        >
          North Alabama Heating &amp; Air
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            opacity: ctaOpacity,
            transform: `scale(${pulse})`,
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: theme.logoRed,
              letterSpacing: 2,
            }}
          >
            256-534-2941
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: theme.logoBlue,
              letterSpacing: 1,
            }}
          >
            northalabamahvac.com
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
