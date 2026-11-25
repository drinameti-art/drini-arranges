import { useCallback, useEffect, useRef, useState } from "react";
import { analyseMelody, toMono, type Melody } from "@/lib/melody";

export type RecorderStatus = "idle" | "recording" | "analysing" | "done" | "error";

const MAX_SECONDS = 30;
const STORE_KEY = "drini:melody";

/** Save the last melody so the Studio can pick it up after the /record screen. */
export function storeMelody(m: Melody | null) {
  try {
    if (m) sessionStorage.setItem(STORE_KEY, JSON.stringify({ text: m.text, key: m.key, bpm: m.bpm, names: m.names }));
    else sessionStorage.removeItem(STORE_KEY);
  } catch {
    // storage unavailable: the Studio will just ask for a new recording
  }
}

const ENSEMBLE_KEY = "drini:ensemble";

export function storeEnsemble(e: string) {
  try { sessionStorage.setItem(ENSEMBLE_KEY, e); } catch { /* ignore */ }
}

export function loadEnsemble(): string | null {
  try { return sessionStorage.getItem(ENSEMBLE_KEY); } catch { return null; }
}

export type StoredMelody = Pick<Melody, "text" | "key" | "bpm" | "names">;

export function loadMelody(): StoredMelody | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as StoredMelody) : null;
  } catch {
    return null;
  }
}

/** Records from the microphone (or reads an uploaded file) and turns it into notes, tempo and key. */
export function useMelodyRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);
  const [melody, setMelody] = useState<Melody | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const rec = useRef<{ recorder?: MediaRecorder; stream?: MediaStream; timer?: number; chunks: Blob[] }>({ chunks: [] });

  const cleanup = () => {
    window.clearInterval(rec.current.timer);
    rec.current.stream?.getTracks().forEach((t) => t.stop());
    rec.current = { chunks: [] };
  };
  useEffect(() => cleanup, []);

  const analyse = useCallback(async (blob: Blob) => {
    setStatus("analysing");
    setError(null);
    try {
      const buf = await blob.arrayBuffer();
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const audio = await ctx.decodeAudioData(buf);
      void ctx.close();
      const channels = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i));
      // let the "Listening…" state paint before the (short) analysis runs
      await new Promise((r) => setTimeout(r, 30));
      const m = analyseMelody(toMono(channels), audio.sampleRate);
      if (m.notes.length < 2) {
        setMelody(null);
        setError("I couldn't hear a clear melody. Try humming a little louder, one note at a time, somewhere quiet.");
        setStatus("error");
        return;
      }
      setMelody(m);
      storeMelody(m);
      setStatus("done");
    } catch {
      setMelody(null);
      setError("I couldn't read that audio. Try another recording or an MP3, WAV or M4A file.");
      setStatus("error");
    }
  }, []);

  const stop = useCallback(() => {
    const r = rec.current.recorder;
    if (r && r.state !== "inactive") r.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setFileName(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser can't record audio. Upload a recording instead.");
      setStatus("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const recorder = new MediaRecorder(stream);
      rec.current = { recorder, stream, chunks: [] };
      recorder.ondataavailable = (e) => { if (e.data.size) rec.current.chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(rec.current.chunks, { type: recorder.mimeType || "audio/webm" });
        cleanup();
        void analyse(blob);
      };
      recorder.start();
      setSeconds(0);
      setStatus("recording");
      const began = Date.now();
      rec.current.timer = window.setInterval(() => {
        const s = Math.floor((Date.now() - began) / 1000);
        setSeconds(s);
        if (s >= MAX_SECONDS) stop();
      }, 250);
    } catch {
      cleanup();
      setError("I need permission to use the microphone. Allow it in your browser, or upload a recording instead.");
      setStatus("error");
    }
  }, [analyse, stop]);

  const upload = useCallback(
    (file: File) => {
      setFileName(file.name);
      void analyse(file);
    },
    [analyse],
  );

  return { status, seconds, melody, error, fileName, start, stop, upload, recording: status === "recording" };
}

export function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
