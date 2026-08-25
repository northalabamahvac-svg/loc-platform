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
  const delay = 4 + (seed % 6);
  return { angle, distance, size, delay };
});

// Closing card, Coke-style: clean white field, the NAHA mark slamming in,
// "For everyone." underneath, then phone + URL. No fade to black — the
// spot ends holding on the brand.
export const FinaleBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slam = spring({
    frame,
    fps,
    config: { damping: 13, mass: 0.9, stiffness: 160 },
  });
  const logoScale = interpolate(slam, [0, 1], [2.1, 1]);
  const logoOpacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateRight: "clamp",
  });

  const lineSpring = spring({
    frame: frame - 14,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 180 },
  });
  const lineY = interpolate(lineSpring, [0, 1], [60, 0]);
  const lineOpacity = interpolate(frame, [14, 24], [0, 1], {
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [34, 48], [0, 1], {
    extrapolateRight: "clamp",
  });
  const pulse = 1 + 0.015 * Math.sin(frame * 0.18);

  return (
    <AbsoluteFill
      style={{
        background: "#ffffff",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* gold sparkle burst behind the logo */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {SPARKLES.map((p, i) => {
          const pFrame = Math.max(0, frame - p.delay);
          const s = spring({
            frame: pFrame,
            fps,
            config: { damping: 26, mass: 1.3, stiffness: 70 },
          });
          const px = Math.max(
            -440,
            Math.min(440, Math.cos(p.angle) * p.distance * s)
          );
          const py = Math.sin(p.angle) * p.distance * s - 330;
          const sparkOpacity = interpolate(pFrame, [0, 10, 40], [0, 0.9, 0], {
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
            opacity: logoOpacity,
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
