import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { useEffect, useState } from "react";

let injected = false;

export const useInterFont = () => {
  const [handle] = useState(() => delayRender("Loading Inter font"));

  useEffect(() => {
    if (injected) {
      continueRender(handle);
      return;
    }
    injected = true;

    const style = document.createElement("style");
    const weights = [400, 500, 600, 700, 800];
    style.textContent = weights
      .map(
        (w) => `@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: ${w};
  font-display: block;
  src: url('${staticFile(`fonts/Inter-${w}.ttf`)}') format('truetype');
}`
      )
      .join("\n");
    document.head.appendChild(style);

    Promise.all(
      weights.map((w) =>
        document.fonts.load(`${w} 60px Inter`).catch(() => null)
      )
    )
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [handle]);
};
