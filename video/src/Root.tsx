import { Composition } from "remotion";
import { NahaLaunch } from "./Video";
import { ForEveryone, FOR_EVERYONE_DURATION } from "./anthem/ForEveryone";
import { WIDTH, HEIGHT, FPS, TOTAL_DURATION } from "./theme";

export const Root = () => {
  return (
    <>
      <Composition
        id="NahaForEveryone"
        component={ForEveryone}
        durationInFrames={FOR_EVERYONE_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="NahaLaunch"
        component={NahaLaunch}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
