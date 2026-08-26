import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SafeFrame } from "../components/SafeFrame";
import { theme } from "../theme";

export const Scene1Hook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slam = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.9, stiffness: 200 },
  });
  const scale = interpolate(slam, [0, 1], [2, 1]);
  const rot = interpolate(slam, [0, 1], [-6, 0]);

  const fadeOut = interpolate(frame, [72, 88], [1, 0], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 6], [0, 1], {
    extrapolateRight: "clamp",
  }) * fadeOut;

  const glowPulse = 0.5 + 0.5 * Math.sin(frame * 0.15);

  return (
    <AbsoluteFill style={{ background: theme.bg0 }}>
      {/* radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 55%, ${theme.orange}44 0%, ${theme.orange}00 45%)`,
          opacity: 0.6 + glowPulse * 0.4,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, ${theme.blue}22 0%, transparent 55%)`,
        }}
      />
      <SafeFrame>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            gap: 40,
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: theme.orange,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity,
            }}
          >
            Alabama Summer
          </div>
          <h1
            style={{
              fontSize: 140,
              fontWeight: 800,
              color: theme.white,
              textAlign: "center",
              lineHeight: 1.02,
              margin: 0,
              transform: `scale(${scale}) rotate(${rot}deg)`,
              opacity,
              textShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            AC out.
            <br />
            <span style={{ color: theme.orange }}>House hot.</span>
          </h1>
          <div
            style={{
              fontSize: 52,
              fontWeight: 500,
              color: theme.text,
              textAlign: "center",
              opacity: opacity * 0.9,
            }}
          >
            Now what?
          </div>
        </div>
      </SafeFrame>
    </AbsoluteFill>
  );
};
