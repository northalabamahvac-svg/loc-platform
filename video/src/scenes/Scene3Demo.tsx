import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SafeFrame } from "../components/SafeFrame";
import { Cursor, CursorKeyframe } from "../components/Cursor";
import { theme } from "../theme";

const TYPED = "35801";

const CURSOR_KEYFRAMES: CursorKeyframe[] = [
  { frame: 0, x: 980, y: 200 },
  { frame: 22, x: 540, y: 620, click: true },
  { frame: 135, x: 540, y: 620 },
  { frame: 158, x: 540, y: 870, click: true },
  { frame: 240, x: 540, y: 870 },
];

export const Scene3Demo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerIn = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const containerOpacity = interpolate(containerIn, [0, 1], [0, 1]);
  const containerY = interpolate(containerIn, [0, 1], [40, 0]);

  const typeStart = 30;
  const typeEnd = 120;
  const typedChars = Math.max(
    0,
    Math.min(
      TYPED.length,
      Math.floor(interpolate(frame, [typeStart, typeEnd], [0, TYPED.length + 0.5]))
    )
  );
  const typedText = TYPED.slice(0, typedChars);
  const caretBlink = Math.floor((frame / 15) % 2) === 0;
  const inputFocused = frame >= 20 && frame < 155;

  const buttonPress = frame >= 155 && frame < 170;
  const buttonScale = buttonPress ? 0.95 : 1;

  const spinnerVisible = frame >= 158 && frame < 195;
  const spinnerAngle = ((frame - 158) / fps) * 720;

  const resultsStart = 195;
  const results = [
    { icon: "✓", label: "Certified technician", sub: "Available today", color: theme.green },
    { icon: "⚡", label: "Same-day service", sub: "Huntsville & Madison", color: theme.orange },
    { icon: "★", label: "Free written estimate", sub: "No obligation", color: theme.blue },
  ];

  return (
    <AbsoluteFill style={{ background: theme.bg1 }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, ${theme.navy}55 0%, transparent 60%)`,
        }}
      />

      <SafeFrame>
        <div
          style={{
            opacity: containerOpacity,
            transform: `translateY(${containerY}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 44,
            paddingTop: 40,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: theme.orange,
              textAlign: "center",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Free Estimate
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: theme.white,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            Cool relief in
            <br />
            <span style={{ color: theme.blue }}>60 seconds.</span>
          </div>

          {/* Input */}
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: theme.textMuted,
                marginBottom: 16,
                letterSpacing: 1,
              }}
            >
              YOUR ZIP CODE
            </div>
            <div
              style={{
                height: 130,
                background: theme.card,
                border: `4px solid ${inputFocused ? theme.blue : theme.cardBorder}`,
                borderRadius: 22,
                padding: "0 40px",
                display: "flex",
                alignItems: "center",
                fontSize: 56,
                fontWeight: 700,
                color: theme.white,
                letterSpacing: 6,
                boxShadow: inputFocused ? `0 0 40px ${theme.blue}55` : "none",
              }}
            >
              {typedText}
              {inputFocused && (
                <span
                  style={{
                    width: 4,
                    height: 60,
                    background: theme.blue,
                    marginLeft: 6,
                    opacity: caretBlink ? 1 : 0,
                  }}
                />
              )}
            </div>
          </div>

          {/* Button */}
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                height: 130,
                background: theme.orange,
                borderRadius: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                transform: `scale(${buttonScale})`,
                boxShadow: `0 20px 60px ${theme.orange}66`,
                transition: "transform 0.1s",
              }}
            >
              {spinnerVisible ? (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: `6px solid ${theme.white}55`,
                    borderTopColor: theme.white,
                    transform: `rotate(${spinnerAngle}deg)`,
                  }}
                />
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 52,
                      fontWeight: 800,
                      color: theme.white,
                      letterSpacing: 2,
                    }}
                  >
                    GET FREE ESTIMATE
                  </div>
                  <div style={{ fontSize: 44, color: theme.white }}>→</div>
                </>
              )}
            </div>
          </div>

          {/* Results */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              marginTop: 20,
            }}
          >
            {results.map((r, i) => {
              const s = spring({
                frame: frame - resultsStart - i * 10,
                fps,
                config: { damping: 14, stiffness: 130 },
              });
              const opacity = interpolate(
                frame,
                [resultsStart + i * 10, resultsStart + i * 10 + 12],
                [0, 1],
                { extrapolateRight: "clamp" }
              );
              const y = interpolate(s, [0, 1], [40, 0]);
              const scale = interpolate(s, [0, 1], [0.9, 1]);
              return (
                <div
                  key={i}
                  style={{
                    opacity,
                    transform: `translateY(${y}px) scale(${scale})`,
                    background: theme.card,
                    border: `2px solid ${theme.cardBorder}`,
                    borderLeft: `10px solid ${r.color}`,
                    borderRadius: 18,
                    padding: "24px 32px",
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      background: `${r.color}22`,
                      color: r.color,
                      fontSize: 42,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {r.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 38,
                        fontWeight: 700,
                        color: theme.white,
                        lineHeight: 1.1,
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 500,
                        color: theme.textMuted,
                        marginTop: 4,
                      }}
                    >
                      {r.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SafeFrame>

      <Cursor keyframes={CURSOR_KEYFRAMES} />
    </AbsoluteFill>
  );
};
