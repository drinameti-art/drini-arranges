import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

export type ScoreSheetHandle = { play: () => Promise<void>; stop: () => void };

type Props = { abc: string; highlightBar?: number; highlightLabel?: string; onEnded?: () => void };

/** Renders ABC notation with abcjs (loaded client-side only) and exposes synth playback. */
export const ScoreSheet = forwardRef<ScoreSheetHandle, Props>(function ScoreSheet(
  { abc, highlightBar, highlightLabel, onEnded },
  ref,
) {
  const el = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = useRef<{ abcjs?: any; visual?: any; synth?: any }>({});

  useEffect(() => {
    let cancelled = false;
    void import("abcjs").then((mod) => {
      const abcjs = mod.default ?? mod;
      if (cancelled || !el.current) return;
      const [visual] = abcjs.renderAbc(el.current, abc, {
        responsive: "resize",
        add_classes: true,
        staffwidth: 760,
        paddingtop: 28,
        foregroundColor: "#17162B",
      });
      state.current = { abcjs, visual };
      if (highlightBar !== undefined) drawHighlight(el.current, highlightBar, highlightLabel ?? "");
    });
    return () => {
      cancelled = true;
      state.current.synth?.stop();
    };
  }, [abc, highlightBar, highlightLabel]);

  useImperativeHandle(ref, () => ({
    async play() {
      const { abcjs, visual } = state.current;
      if (!abcjs?.synth?.supportsAudio()) return;
      const synth = new abcjs.synth.CreateSynth();
      await synth.init({ visualObj: visual, options: { onEnded } });
      await synth.prime();
      state.current.synth = synth;
      synth.start();
    },
    stop() {
      state.current.synth?.stop();
    },
  }));

  return <div ref={el} className="score-sheet w-full" />;
});

function drawHighlight(root: HTMLElement, bar: number, label: string) {
  const svg = root.querySelector("svg");
  if (!svg) return;
  const els = Array.from(svg.querySelectorAll<SVGGraphicsElement>(`.abcjs-m${bar}`));
  if (!els.length) return;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const e of els) {
    const b = e.getBBox();
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.width); y2 = Math.max(y2, b.y + b.height);
  }
  const ns = "http://www.w3.org/2000/svg";
  const rect = document.createElementNS(ns, "rect");
  Object.entries({ x: x1 - 10, y: y1 - 10, width: x2 - x1 + 20, height: y2 - y1 + 20, rx: 8, fill: "#7B1F3A", "fill-opacity": "0.08", stroke: "#7B1F3A", "stroke-opacity": "0.25" })
    .forEach(([k, v]) => rect.setAttribute(k, String(v)));
  const text = document.createElementNS(ns, "text");
  Object.entries({ x: x1 - 8, y: y1 - 16, fill: "#7B1F3A", "font-size": "11", "font-family": "Inter, sans-serif", "font-weight": "600" })
    .forEach(([k, v]) => text.setAttribute(k, String(v)));
  text.textContent = label;
  svg.insertBefore(rect, svg.firstChild);
  svg.appendChild(text);
}
