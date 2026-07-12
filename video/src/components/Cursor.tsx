import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type CursorKeyframe = {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
};

export const Cursor: React.FC<{ keyframes: CursorKeyframe[] }> = ({ keyframes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const findSegment = () => {
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (frame >= keyframes[i].frame && frame <= keyframes[i + 1].frame) {
        return [keyframes[i], keyframes[i + 1]] as const;
      }
    }
    if (frame < keyframes[0].frame) {
      return [keyframes[0], keyframes[0]] as const;
    }
    return [keyframes[keyframes.length - 1], keyframes[keyframes.length - 1]] as const;
  };

  const [a, b] = findSegment();
  const span = Math.max(1, b.frame - a.frame);
  const localFrame = frame - a.frame;

  const s = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, mass: 1, stiffness: 90 },
    durationInFrames: span,
  });

  const x = interpolate(s, [0, 1], [a.x, b.x]);
  const y = interpolate(s, [0, 1], [a.y, b.y]);

  const clickKf = keyframes.find((kf) => kf.click && Math.abs(frame - kf.frame) < 12);
  const rippleProgress = clickKf ? (frame - clickKf.frame) / 12 : -1;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 100 }}>
      {clickKf && rippleProgress >= 0 && rippleProgress <= 1 && (
        <div
          style={{
            position: "absolute",
            left: clickKf.x,
            top: clickKf.y,
            width: 60,
            height: 60,
            marginLeft: -30,
            marginTop: -30,
            borderRadius: "50%",
            border: `4px solid rgba(255, 255, 255, ${1 - rippleProgress})`,
            transform: `scale(${0.4 + rippleProgress * 2.4})`,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 32,
          height: 32,
          marginLeft: -16,
          marginTop: -16,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.35)",
          filter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 24,
          height: 24,
          marginLeft: -12,
          marginTop: -12,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      />
    </AbsoluteFill>
  );
};
