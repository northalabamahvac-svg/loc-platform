export const theme = {
  navy: "#003c62",
  navyDeep: "#002540",
  orange: "#ff6900",
  orangeDeep: "#c94b00",
  blue: "#2563eb",
  bg0: "#050a12",
  bg1: "#0a1420",
  bg2: "#111827",
  card: "#1a2434",
  cardBorder: "#2a3547",
  white: "#ffffff",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  green: "#22c55e",
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SCENE_DURATIONS = {
  hook: 90,
  intro: 90,
  demo: 240,
  showcase: 150,
  features: 90,
  cta: 90,
};

export const TOTAL_DURATION = Object.values(SCENE_DURATIONS).reduce(
  (a, b) => a + b,
  0
);

export const SAFE = {
  top: 150,
  bottom: 170,
  side: 60,
};
