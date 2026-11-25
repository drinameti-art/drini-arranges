// Turns a mono recording of one melody line (humming, singing, one instrument)
// into notes, a tempo and a likely key. Pure functions, no dependencies.

export type Note = { midi: number; start: number; dur: number };
export type Melody = { notes: Note[]; bpm: number; key: string; text: string; names: string[] };

const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

export function midiName(m: number) {
  return `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
}

/** YIN pitch estimate for one frame, in Hz, or null when the frame is unvoiced. */
export function detectPitch(frame: Float32Array, sampleRate: number, minHz = 70, maxHz = 1100): number | null {
  const n = frame.length;
  const maxTau = Math.min(Math.floor(sampleRate / minHz), Math.floor(n / 2));
  const minTau = Math.max(2, Math.floor(sampleRate / maxHz));
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < n - maxTau; i++) {
      const diff = frame[i]! - frame[i + tau]!;
      s += diff * diff;
    }
    d[tau] = s;
  }
  // cumulative mean normalised difference
  let running = 0;
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += d[tau]!;
    cmnd[tau] = running > 0 ? (d[tau]! * tau) / running : 1;
  }
  const threshold = 0.15;
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (cmnd[t]! < threshold) {
      while (t + 1 <= maxTau && cmnd[t + 1]! < cmnd[t]!) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) return null;
  // parabolic interpolation around the minimum
  const a = cmnd[tau - 1] ?? cmnd[tau]!;
  const b = cmnd[tau]!;
  const c = cmnd[tau + 1] ?? cmnd[tau]!;
  const denom = a + c - 2 * b;
  const shift = denom !== 0 ? (a - c) / (2 * denom) : 0;
  return sampleRate / (tau + shift);
}

const hzToMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440);

/** Frame-by-frame pitch track → stable notes (seconds). */
export function extractNotes(samples: Float32Array, sampleRate: number): Note[] {
  const win = sampleRate >= 22050 ? 2048 : 1024;
  const hop = win / 4;
  const frameDur = hop / sampleRate;
  // loudness gate relative to the loudest part of the take
  const rms: number[] = [];
  for (let i = 0; i + win <= samples.length; i += hop) {
    let s = 0;
    for (let j = i; j < i + win; j++) s += samples[j]! * samples[j]!;
    rms.push(Math.sqrt(s / win));
  }
  const peak = Math.max(1e-6, ...rms);
  const track: (number | null)[] = [];
  for (let f = 0, i = 0; i + win <= samples.length; f++, i += hop) {
    if (rms[f]! < peak * 0.12) { track.push(null); continue; }
    const hz = detectPitch(samples.subarray(i, i + win), sampleRate);
    track.push(hz ? hzToMidi(hz) : null);
  }
  // median filter (5 frames) to remove octave blips
  const smooth = track.map((v, i) => {
    if (v === null) return null;
    const w = track.slice(Math.max(0, i - 2), i + 3).filter((x): x is number => x !== null).sort((x, y) => x - y);
    return w[Math.floor(w.length / 2)] ?? v;
  });
  // group consecutive frames on the same semitone
  const notes: Note[] = [];
  let cur: { midi: number; startF: number; endF: number; sum: number; count: number } | null = null;
  const flush = () => {
    if (cur && (cur.endF - cur.startF + 1) * frameDur >= 0.09) {
      notes.push({ midi: Math.round(cur.sum / cur.count), start: cur.startF * frameDur, dur: (cur.endF - cur.startF + 1) * frameDur });
    }
    cur = null;
  };
  smooth.forEach((v, f) => {
    if (v === null) { flush(); return; }
    const m = Math.round(v);
    if (cur && Math.abs(m - cur.sum / cur.count) < 0.75) { cur.endF = f; cur.sum += v; cur.count++; }
    else { flush(); cur = { midi: m, startF: f, endF: f, sum: v, count: 1 }; }
  });
  flush();
  // merge a note into the previous one when it repeats the same pitch with almost no gap (vibrato dips)
  const merged: Note[] = [];
  for (const n of notes) {
    const prev = merged[merged.length - 1];
    if (prev && prev.midi === n.midi && n.start - (prev.start + prev.dur) < 0.04) prev.dur = n.start + n.dur - prev.start;
    else merged.push({ ...n });
  }
  return merged;
}

/** Tempo so that the most common note length is a quarter note, kept between 60 and 140 BPM. */
export function estimateBpm(notes: Note[]): number {
  if (!notes.length) return 96;
  const iois = notes.slice(1).map((n, i) => n.start - notes[i]!.start).filter((x) => x > 0.12);
  const src = iois.length ? iois : notes.map((n) => n.dur);
  const sorted = [...src].sort((a, b) => a - b);
  let beat = sorted[Math.floor(sorted.length / 2)] ?? 0.6;
  let bpm = 60 / beat;
  while (bpm < 60) bpm *= 2;
  while (bpm > 140) bpm /= 2;
  return Math.round(bpm);
}

// Krumhansl–Kessler key profiles
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const KEY_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

export function guessKey(notes: Note[]): string {
  const hist = new Array(12).fill(0) as number[];
  for (const n of notes) { const pc = ((n.midi % 12) + 12) % 12; hist[pc] = (hist[pc] ?? 0) + n.dur; }
  const corr = (profile: number[], tonic: number) => {
    const p = profile.map((_, i) => profile[(i - tonic + 12) % 12]!);
    const mx = hist.reduce((s, v) => s + v, 0) / 12;
    const mp = p.reduce((s, v) => s + v, 0) / 12;
    let num = 0, dx = 0, dp = 0;
    for (let i = 0; i < 12; i++) { num += (hist[i]! - mx) * (p[i]! - mp); dx += (hist[i]! - mx) ** 2; dp += (p[i]! - mp) ** 2; }
    return dx && dp ? num / Math.sqrt(dx * dp) : -1;
  };
  let best = { score: -Infinity, name: "C major" };
  for (let t = 0; t < 12; t++) {
    const maj = corr(MAJOR, t), min = corr(MINOR, t);
    if (maj > best.score) best = { score: maj, name: `${KEY_NAMES[t]} major` };
    if (min > best.score) best = { score: min, name: `${KEY_NAMES[t]} minor` };
  }
  return best.name;
}

const LENGTH_WORDS: Record<number, string> = { 1: "eighth", 2: "quarter", 3: "dotted quarter", 4: "half", 6: "dotted half", 8: "whole" };

/** Everything Drini needs: notes with lengths in eighth notes, tempo and key. */
export function analyseMelody(input: Float32Array, inputRate: number): Melody {
  const { samples, sampleRate } = downsample(input, inputRate);
  const notes = extractNotes(samples, sampleRate).slice(0, 64);
  const bpm = estimateBpm(notes);
  const key = guessKey(notes);
  const eighth = 30 / bpm;
  const parts = notes.map((n, i) => {
    const next = notes[i + 1];
    const span = next ? next.start - n.start : n.dur;
    const eighths = Math.min(8, Math.max(1, Math.round(span / eighth)));
    const word = LENGTH_WORDS[eighths] ?? `${eighths} eighths`;
    return `${midiName(n.midi)} (${word})`;
  });
  return {
    notes,
    bpm,
    key,
    text: parts.join(", "),
    names: notes.map((n) => NAMES[((n.midi % 12) + 12) % 12]!.replace("#", "♯").replace(/^([A-G])b$/, "$1♭")),
  };
}

/** Average blocks of samples down to about 11 kHz: plenty for a voice and much faster to analyse. */
export function downsample(samples: Float32Array, sampleRate: number) {
  const factor = Math.max(1, Math.round(sampleRate / 11025));
  if (factor === 1) return { samples, sampleRate };
  const out = new Float32Array(Math.floor(samples.length / factor));
  for (let i = 0; i < out.length; i++) {
    let s = 0;
    for (let j = 0; j < factor; j++) s += samples[i * factor + j] ?? 0;
    out[i] = s / factor;
  }
  return { samples: out, sampleRate: sampleRate / factor };
}

/** Mix any AudioBuffer-like input down to mono. */
export function toMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 1) return channels[0]!;
  const len = channels[0]?.length ?? 0;
  const out = new Float32Array(len);
  for (const ch of channels) for (let i = 0; i < len; i++) out[i] = (out[i] ?? 0) + (ch[i] ?? 0) / channels.length;
  return out;
}
