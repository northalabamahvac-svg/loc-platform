import { AbsoluteFill, Series } from "remotion";
import { SCENE_DURATIONS, theme } from "./theme";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Intro } from "./scenes/Scene2Intro";
import { Scene3Demo } from "./scenes/Scene3Demo";
import { Scene4Showcase } from "./scenes/Scene4Showcase";
import { Scene5Features } from "./scenes/Scene5Features";
import { Scene6CTA } from "./scenes/Scene6CTA";
import { useInterFont } from "./components/Fonts";

const fontFamily =
  'Inter, "Helvetica Neue", "Segoe UI", Roboto, system-ui, -apple-system, sans-serif';

export const NahaLaunch = () => {
  useInterFont();
  return (
    <AbsoluteFill style={{ background: theme.bg0, fontFamily }}>
      <Series>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.hook}>
          <Scene1Hook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.intro}>
          <Scene2Intro />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.demo}>
          <Scene3Demo />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.showcase}>
          <Scene4Showcase />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.features}>
          <Scene5Features />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_DURATIONS.cta}>
          <Scene6CTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
