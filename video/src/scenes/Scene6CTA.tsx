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

export const Scene6CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Count-up 0 -> 30 across 45 frames
  const yearsProgress = interpolate(frame, [8, 52], [0, 30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const years = Math.floor(yearsProgress);

  const numberSpring = spring({
    frame: frame - 4,
    fps,
    config: { damping: 14, stiffness: 130 },
  });
  const numberScale = interpolate(numberSpring, [0, 1], [1.3, 1]);
  const numberOpacity = interpolate(frame, [4, 14], [0, 1], {
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [16, 26], [0, 1], {
    extrapolateRight: "clamp",
  });

  const logoOpacity = interpolate(frame, [26, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pulse = 1 + 0.03 * Math.sin(frame * 0.25);

  const fadeOut = interpolate(frame, [78, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [30, 44], [0, 1], {
    extrapolateRight: "clamp",
  }) * fadeOut;

  return (
    <AbsoluteFill style={{ background: theme.bg0 }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, ${theme.orange}33 0%, transparent 55%)`,
          opacity: fadeOut,
        }}
      />
      <AbsoluteFill
        style={{
          background: theme.bg0,
          opacity: 1 - fadeOut,
        }}
      />

      <SafeFrame>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            height: "100%",
            paddingTop: 60,
            paddingBottom: 60,
            opacity: fadeOut,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                opacity: logoOpacity * fadeOut,
                background: theme.white,
                padding: "20px 28px",
                borderRadius: 20,
                boxShadow: `0 20px 60px ${theme.navy}88`,
              }}
            >
              <Img
                src={staticFile("brand/logo-full.png")}
                style={{ width: 520, height: "auto", display: "block" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 260,
                fontWeight: 800,
                color: theme.orange,
                lineHeight: 1,
                opacity: numberOpacity,
                transform: `scale(${numberScale})`,
                textShadow: `0 8px 40px ${theme.orange}55`,
              }}
            >
              {years}+
            </div>
            <div
              style={{
                fontSize: 60,
                fontWeight: 800,
                color: theme.white,
                letterSpacing: 2,
                opacity: labelOpacity,
                textAlign: "center",
              }}
            >
              YEARS OF TRUST
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 500,
                color: theme.textMuted,
                opacity: labelOpacity,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Serving North Alabama
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              opacity: ctaOpacity,
              transform: `scale(${pulse})`,
            }}
          >
            <div
              style={{
                fontSize: 68,
                fontWeight: 800,
                color: theme.white,
                letterSpacing: 3,
              }}
            >
              256-534-2941
            </div>
            <div
              style={{
                fontSize: 42,
                fontWeight: 600,
                color: theme.orange,
                letterSpacing: 2,
              }}
            >
              northalabamahvac.com
            </div>
          </div>
        </div>
      </SafeFrame>
    </AbsoluteFill>
  );
};
