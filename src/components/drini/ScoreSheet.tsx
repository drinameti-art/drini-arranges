import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { SOUND_FONT_URLS, oneLabelPerInstrument, playbackOptions, withInstruments } from "@/lib/abc-tools";
import { pedalPiano, withCountIn, withoutVoices } from "@/lib/abc-parts";

/** Practice settings for playback: tempo in percent, voices to mute, bars to loop, a count-in bar. */
export type PlayOptions = { tempo?: number; muted?: string[]; loop?: { from: number; to: number } | null; countIn?: boolean };
export type ScoreSheetHandle = { play: (opts?: PlayOptions) => Promise<void>; pause: () => void; resume: () => void; stop: () => void };

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
      const [visual] = abcjs.renderAbc(el.current, oneLabelPerInstrument(withInstruments(abc)), {
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
    async play(opts: PlayOptions = {}) {
      activeStop?.();
      await ready.current; // the score on screen must be rendered before it is played
      const { abcjs, visual, abc: drawn } = state.current;
      if (drawn !== abcNow.current) return;
      if (!abcjs?.synth?.supportsAudio()) return;
      // AudioContext must be created inside the user's click.
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AC();
      await audioContext.resume();

      // what is heard: the score with muted parts taken out and, from the start, a bar of clicks
      const loop = opts.loop && opts.loop.to >= opts.loop.from ? opts.loop : null;
      const countIn = Boolean(opts.countIn) && !loop;
      const factor = Math.min(2, Math.max(0.25, (opts.tempo ?? 100) / 100));
      let audioAbc = withoutVoices(withInstruments(abcNow.current), opts.muted ?? []);
      if (countIn) audioAbc = withCountIn(audioAbc);
      const audioVisual = audioAbc === withInstruments(abcNow.current) ? visual : abcjs.renderAbc("*", audioAbc)[0];
      const msPerMeasure = audioVisual.millisecondsPerMeasure() / factor;
      const loopStart = loop ? ((loop.from - 1) * msPerMeasure) / 1000 : 0;
      const loopEnd = loop ? (loop.to * msPerMeasure) / 1000 : Infinity;

      const clear = () => el.current?.querySelectorAll(".abcjs-playing").forEach((n) => n.classList.remove("abcjs-playing"));
      let synth = new abcjs.synth.CreateSynth();
      const jumpBack = () => {
        synth.seek(loopStart, "seconds");
        timer.setProgress(loopStart, "seconds");
      };
      const timer = new abcjs.TimingCallbacks(visual, {
        qpm: visual.getBpm() * factor,
        extraMeasuresAtBeginning: countIn ? 1 : 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventCallback: (ev: any) => {
          clear();
          if (!ev) {
            if (loop) { jumpBack(); synth.start(); timer.start(); return; }
            onEnded?.();
            return;
          }
          if (loop && ev.milliseconds / 1000 >= loopEnd - 0.005) { jumpBack(); return; }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ev.elements ?? []).flat().forEach((n: any) => n.classList?.add("abcjs-playing"));
        },
      });
      const base = { visualObj: audioVisual, audioContext, millisecondsPerMeasure: msPerMeasure };
      const { soundFontUrl: _drop, ...options } = playbackOptions(audioAbc);
      void _drop;
      // MuseScore sounds first, then Musyng Kite, then abcjs's built-in set if neither can load
      const tries: (string | undefined)[] = [...SOUND_FONT_URLS, undefined];
      for (let i = 0; i < tries.length; i++) {
        const url = tries[i];
        try {
          if (i > 0) synth = new abcjs.synth.CreateSynth();
          await synth.init({
            ...base,
            options: { ...options, sequenceCallback: pedalPiano, ...(url ? { soundFontUrl: new URL(url, window.location.href).href } : {}) },
          });
          await synth.prime();
          break;
        } catch (err) {
          if (i === tries.length - 1) throw err;
        }
      }
      state.current.synth = synth;
      state.current.timer = timer;
      activeStop = () => { synth.stop(); timer.stop(); clear(); onEnded?.(); };
      synth.start();
      timer.start();
      if (loop && loopStart > 0) jumpBack();
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
