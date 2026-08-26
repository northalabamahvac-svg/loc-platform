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

const PARTICLES = Array.from({ length: 24 }).map((_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const angle = (i / 24) * Math.PI * 2 + (seed / 233280) * 0.4;
  const distance = 380 + (seed % 260);
  const size = 12 + ((seed * 7) % 22);
  const delay = (seed % 8);
  const color = i % 3 === 0 ? theme.orange : i % 3 === 1 ? theme.blue : theme.white;
  return { angle, distance, size, delay, color };
});

export const Scene2Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 1, stiffness: 110 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [3, 1]);
  const logoOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  const taglineSpring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const taglineY = interpolate(taglineSpring, [0, 1], [80, 0]);
  const taglineOpacity = interpolate(frame, [18, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  const subY = interpolate(subSpring, [0, 1], [50, 0]);
  const subOpacity = interpolate(frame, [30, 44], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: theme.bg0 }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, ${theme.navy}55 0%, transparent 55%)`,
        }}
      />
      {/* Particles */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {PARTICLES.map((p, i) => {
          const pFrame = Math.max(0, frame - p.delay);
          const s = spring({
            frame: pFrame,
            fps,
            config: { damping: 30, mass: 1.4, stiffness: 60 },
          });
          const px = Math.cos(p.angle) * p.distance * s;
          const py = Math.sin(p.angle) * p.distance * s - 100;
          const opacity = interpolate(pFrame, [0, 12, 45], [0, 1, 0], {
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: p.color,
                transform: `translate(${px}px, ${py}px)`,
                opacity,
                boxShadow: `0 0 24px ${p.color}`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      <SafeFrame>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            gap: 50,
          }}
        >
          <div
            style={{
              transform: `scale(${logoScale})`,
              opacity: logoOpacity,
              background: theme.white,
              padding: "36px 48px",
              borderRadius: 32,
              boxShadow: `0 30px 80px ${theme.navy}88`,
            }}
          >
            <Img
              src={staticFile("brand/logo-full.png")}
              style={{ width: 780, height: "auto", display: "block" }}
            />
          </div>

          <div
            style={{
              transform: `translateY(${taglineY}px)`,
              opacity: taglineOpacity,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 62,
                fontWeight: 800,
                color: theme.white,
                lineHeight: 1.15,
                textShadow: "0 4px 20px rgba(0,0,0,0.6)",
              }}
            >
              Honest HVAC Solutions,
              <br />
              <span style={{ color: theme.orange }}>Guided by Faith &amp; Integrity</span>
            </div>
          </div>

          <div
            style={{
              transform: `translateY(${subY}px)`,
              opacity: subOpacity,
              fontSize: 44,
              fontWeight: 500,
              color: theme.text,
              letterSpacing: 2,
            }}
          >
            Service That Speaks For Itself
          </div>
        </div>
      </SafeFrame>
    </AbsoluteFill>
  );
};
