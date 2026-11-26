import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { withInstruments } from "@/lib/abc-tools";

export type ScoreSheetHandle = { play: () => Promise<void>; pause: () => void; resume: () => void; stop: () => void };

// Only one score plays at a time: starting one silences any older player (a previous draft, the upload preview…).
let activeStop: (() => void) | null = null;

export type Highlight = { bar: number; label: string };
type Props = { abc: string; highlights?: Highlight[]; onEnded?: () => void };

/** Renders ABC notation with abcjs (loaded client-side only) and exposes synth playback. */
export const ScoreSheet = forwardRef<ScoreSheetHandle, Props>(function ScoreSheet(
  { abc, highlights = [], onEnded },
  ref,
) {
  const el = useRef<HTMLDivElement>(null);
  const highlightKey = highlights.map((h) => `${h.bar}:${h.label}`).join("|");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = useRef<{ abcjs?: any; visual?: any; synth?: any; timer?: any; abc?: string }>({});
  const ready = useRef<Promise<void>>(Promise.resolve());
  const abcNow = useRef(abc);
  abcNow.current = abc;

  useEffect(() => {
    let cancelled = false;
    ready.current = import("abcjs").then((mod) => {
      const abcjs = mod.default ?? mod;
      if (cancelled || !el.current) return;
      const [visual] = abcjs.renderAbc(el.current, withInstruments(abc), {
        responsive: "resize",
        add_classes: true,
        staffwidth: 760,
        paddingtop: 28,
        foregroundColor: "#17162B",
      });
      // keep a running player if only the highlights changed; anything else starts fresh
      const old = state.current;
      if (old.abc !== abc) { old.synth?.stop(); old.timer?.stop(); }
      state.current = old.abc === abc ? { ...old, abcjs, visual } : { abcjs, visual, abc };
      for (const h of highlights) drawHighlight(el.current, h.bar, h.label);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abc, highlightKey]);

  useImperativeHandle(ref, () => ({
    async play() {
      activeStop?.();
      await ready.current; // the score on screen must be rendered before it is played
      const { abcjs, visual, abc: drawn } = state.current;
      if (drawn !== abcNow.current) return;
      if (!abcjs?.synth?.supportsAudio()) return;
      // AudioContext must be created inside the user's click.
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AC();
      await audioContext.resume();
      const clear = () => el.current?.querySelectorAll(".abcjs-playing").forEach((n) => n.classList.remove("abcjs-playing"));
      const timer = new abcjs.TimingCallbacks(visual, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventCallback: (ev: any) => {
          clear();
          if (!ev) { onEnded?.(); return; }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ev.elements ?? []).flat().forEach((n: any) => n.classList?.add("abcjs-playing"));
        },
      });
      const synth = new abcjs.synth.CreateSynth();
      await synth.init({ visualObj: visual, audioContext, millisecondsPerMeasure: visual.millisecondsPerMeasure() });
      await synth.prime();
      state.current.synth = synth;
      state.current.timer = timer;
      activeStop = () => { synth.stop(); timer.stop(); clear(); onEnded?.(); };
      synth.start();
      timer.start();
    },
    pause() {
      state.current.synth?.pause();
      state.current.timer?.pause();
    },
    resume() {
      state.current.synth?.resume();
      state.current.timer?.start();
    },
    stop() {
      state.current.synth?.stop();
      state.current.timer?.stop();
    },
  }));

  // Leaving the page or replacing the score stops its sound.
  useEffect(() => () => { state.current.synth?.stop(); state.current.timer?.stop(); }, []);
  useEffect(() => { state.current.synth?.stop(); state.current.timer?.stop(); }, [abc]);

  return <div ref={el} className="score-sheet w-full" />;
});

/** Draws a soft burgundy box around one bar (1-based) across all staves, with a small label. */
function drawHighlight(root: HTMLElement, bar: number, label: string) {
  const svg = root.querySelector("svg");
  if (!svg || bar < 1) return;
  const idx = bar - 1;
  // abcjs numbers measures from 0: "abcjs-mm{n}" counts through the whole tune, "abcjs-m{n}" restarts on each line.
  // only notes and rests: staff lines and text can carry measure classes too and would stretch the box over the whole system
  const pick = (cls: string) => Array.from(svg.querySelectorAll<SVGGraphicsElement>(`.abcjs-note.${cls}, .abcjs-rest.${cls}`));
  let els = pick(`abcjs-mm${idx}`);
  if (!els.length) els = pick(`abcjs-m${idx}`);
  if (!els.length) return;
  // If the bar sits on a later line, only box the elements on the first line it appears on.
  const lineOf = (e: Element) => /abcjs-l(\d+)/.exec(e.getAttribute("class") ?? "")?.[1];
  const firstLine = lineOf(els[0]!);
  if (firstLine !== undefined) els = els.filter((e) => lineOf(e) === firstLine);
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const e of els) {
    const b = e.getBBox();
    if (!b.width && !b.height) continue;
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.width); y2 = Math.max(y2, b.y + b.height);
  }
  if (!Number.isFinite(x1)) return;
  const ns = "http://www.w3.org/2000/svg";
  const rect = document.createElementNS(ns, "rect");
  rect.setAttribute("class", "drini-hl");
  Object.entries({ x: x1 - 10, y: y1 - 10, width: x2 - x1 + 20, height: y2 - y1 + 20, rx: 8, fill: "#7B1F3A", "fill-opacity": "0.08", stroke: "#7B1F3A", "stroke-opacity": "0.25" })
    .forEach(([k, v]) => rect.setAttribute(k, String(v)));
  const text = document.createElementNS(ns, "text");
  text.setAttribute("class", "drini-hl");
  Object.entries({ x: x1 - 8, y: y1 - 16, fill: "#7B1F3A", "font-size": "11", "font-family": "Inter, sans-serif", "font-weight": "600" })
    .forEach(([k, v]) => text.setAttribute(k, String(v)));
  text.textContent = label;
  svg.insertBefore(rect, svg.firstChild);
  svg.appendChild(text);
}
