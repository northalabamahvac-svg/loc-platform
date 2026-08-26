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

const FEATURES = [
  { icon: "⚡", title: "Same-day repairs", sub: "When it can't wait", color: theme.orange },
  { icon: "✓", title: "Free written estimates", sub: "No obligation, ever", color: theme.green },
  { icon: "★", title: "30+ years of trust", sub: "Serving North Alabama", color: theme.blue },
];

export const Scene5Features = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoS = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110 },
  });
  const logoScale = interpolate(logoS, [0, 1], [1.6, 1]);
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: theme.bg0 }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 30%, ${theme.navy}55 0%, transparent 60%)`,
        }}
      />

      <SafeFrame>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 40,
          }}
        >
          {/* Logo */}
          <div
            style={{
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
              background: theme.white,
              padding: "24px 32px",
              borderRadius: 24,
              boxShadow: `0 20px 60px ${theme.navy}88`,
              marginTop: 20,
            }}
          >
            <Img
              src={staticFile("brand/logo-full.png")}
              style={{ width: 460, height: "auto", display: "block" }}
            />
          </div>

          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: theme.text,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginTop: 10,
              opacity: interpolate(frame, [8, 20], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            Why NAHA
          </div>

          {/* Feature lines */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
              width: "100%",
              marginTop: 30,
            }}
          >
            {FEATURES.map((f, i) => {
              const delay = 18 + i * 10;
              const s = spring({
                frame: frame - delay,
                fps,
                config: { damping: 15, stiffness: 130 },
              });
              const x = interpolate(s, [0, 1], [420, 0]);
              const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={i}
                  style={{
                    opacity,
                    transform: `translateX(${x}px)`,
                    background: theme.card,
                    border: `2px solid ${theme.cardBorder}`,
                    borderLeft: `10px solid ${f.color}`,
                    borderRadius: 20,
                    padding: "28px 32px",
                    display: "flex",
                    alignItems: "center",
                    gap: 28,
                  }}
                >
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 20,
                      background: `${f.color}22`,
                      color: f.color,
                      fontSize: 56,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 46,
                        fontWeight: 800,
                        color: theme.white,
                        lineHeight: 1.1,
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 500,
                        color: theme.textMuted,
                        marginTop: 6,
                      }}
                    >
                      {f.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SafeFrame>
    </AbsoluteFill>
  );
};
