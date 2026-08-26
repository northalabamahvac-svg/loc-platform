import { AbsoluteFill } from "remotion";
import { SAFE } from "../theme";

export const SafeFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        paddingTop: SAFE.top,
        paddingBottom: SAFE.bottom,
        paddingLeft: SAFE.side,
        paddingRight: SAFE.side,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
