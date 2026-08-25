import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { PhotoScene } from "./PhotoScene";
import { FinaleBeat } from "./FinaleBeat";
import { useInterFont } from "../components/Fonts";

const fontFamily =
  'Inter, "Helvetica Neue", "Segoe UI", Roboto, system-ui, -apple-system, sans-serif';

const SCENE = 156; // 5.2s per photo scene, two supers each
const FINALE = 210; // 7s closing card
const XFADE = 18; // 0.6s crossfade between scenes

// 5 scenes + finale, minus the 5 overlapping crossfades = 900 frames (30s)
export const FOR_EVERYONE_DURATION = SCENE * 5 + FINALE - XFADE * 5;

// NAHA anthem modeled on Coca-Cola "For Everyone", cut as a continuous
// montage: photos drift under a consistent dark grade, "For the ..."
// supers dissolve in rhythm, every scene change is a crossfade — no hard
// cuts, no solid-color cards.
export const ForEveryone = () => {
  useInterFont();
  const transition = (
    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: XFADE })}
    />
  );
  return (
    <AbsoluteFill style={{ background: "#0a101a", fontFamily }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhotoScene
            src="brand/project-1.webp"
            motion="in"
            durationInFrames={SCENE}
            superOutEarly={22}
            lines={[
              { text: ["For the", "100° Julys."] },
              { text: ["For the", "frozen Januarys."], fontSize: 94 },
            ]}
          />
        </TransitionSeries.Sequence>
        {transition}
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhotoScene
            src="brand/project-5.webp"
            motion="out"
            durationInFrames={SCENE}
            superInDelay={14}
            superOutEarly={22}
            lines={[
              { text: ["For the", "2 a.m. breakdowns."], fontSize: 88 },
              { text: ["For the", "just-moved-in."] },
            ]}
          />
        </TransitionSeries.Sequence>
        {transition}
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhotoScene
            src="brand/project-3.webp"
            motion="in"
            durationInFrames={SCENE}
            superInDelay={14}
            superOutEarly={22}
            lines={[
              { text: ["For the", "family cookouts."], fontSize: 94 },
              { text: ["For the", "works-from-home."], fontSize: 90 },
            ]}
          />
        </TransitionSeries.Sequence>
        {transition}
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhotoScene
            src="brand/project-4.webp"
            motion="out"
            durationInFrames={SCENE}
            focus="50% 40%"
            superInDelay={14}
            superOutEarly={22}
            lines={[
              { text: ["For the", "grandparents’ place."], fontSize: 84 },
              { text: ["For the", "sleeps-best-cold."], fontSize: 92 },
            ]}
          />
        </TransitionSeries.Sequence>
        {transition}
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhotoScene
            src="brand/project-2.webp"
            motion="in"
            durationInFrames={SCENE}
            superInDelay={14}
            superOutEarly={22}
            lines={[
              { text: ["For the", "30-year customers."], fontSize: 88 },
              { text: ["For every home", "in the Valley."], fontSize: 94 },
            ]}
          />
        </TransitionSeries.Sequence>
        {transition}
        <TransitionSeries.Sequence durationInFrames={FINALE}>
          <FinaleBeat />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
