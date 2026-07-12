import { Composition } from "remotion";
import { NahaLaunch } from "./Video";
import { WIDTH, HEIGHT, FPS, TOTAL_DURATION } from "./theme";

export const Root = () => {
  return (
    <>
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
