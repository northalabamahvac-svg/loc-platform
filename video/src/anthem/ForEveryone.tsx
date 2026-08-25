import { AbsoluteFill, Series } from "remotion";
import { TextBeat } from "./TextBeat";
import { PhotoBeat } from "./PhotoBeat";
import { FinaleBeat } from "./FinaleBeat";
import { useInterFont } from "../components/Fonts";

const fontFamily =
  'Inter, "Helvetica Neue", "Segoe UI", Roboto, system-ui, -apple-system, sans-serif';

const BEAT = 75; // 2.5s per beat @ 30fps, hard cuts like the reference spot
const FINALE = 150; // 5s closing card

export const FOR_EVERYONE_DURATION = BEAT * 10 + FINALE; // 900 frames = 30s

// NAHA anthem spot modeled on Coca-Cola "For Everyone": ten rapid
// "For the ..." beats alternating the logo's red and blue, three real
// project photos in the mix, closing on the mark itself.
export const ForEveryone = () => {
  useInterFont();
  return (
    <AbsoluteFill style={{ background: "#101010", fontFamily }}>
      <Series>
        <Series.Sequence durationInFrames={BEAT}>
          <TextBeat bg="red" line={["For the", "100° Julys."]} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BEAT}>
          <TextBeat bg="blue" line={["For the", "frozen Januarys."]} fontSize={104} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BEAT}>
          <TextBeat bg="red" line={["For the", "2 a.m. breakdowns."]} fontSize={92} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BEAT}>
          <PhotoBeat
            src="brand/project-1.webp"
            line={["For the", "just-moved-in."]}
            durationInFrames={BEAT}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BEAT}>
          <TextBeat bg="blue" line={["For the", "works-from-home."]} fontSize={98} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BEAT}>
          <TextBeat bg="red" line={["For the", "family cookouts."]} fontSize={104} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BEAT}>
          <PhotoBeat
            src="brand/project-5.webp"
            line={["For the", "grandparents’ place."]}
            fontSize={88}
            durationInFrames={BEAT}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BEAT}>
          <TextBeat bg="blue" line={["For the", "sleeps-best-cold."]} fontSize={100} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BEAT}>
          <TextBeat bg="red" line={["For the", "30-year customers."]} fontSize={92} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={BEAT}>
          <PhotoBeat
            src="brand/project-2.webp"
            line={["For every home", "in the Valley."]}
            durationInFrames={BEAT}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={FINALE}>
          <FinaleBeat />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
