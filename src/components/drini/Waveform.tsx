const HEIGHTS = [30, 55, 40, 80, 62, 95, 70, 45, 85, 60, 35, 72, 90, 50, 66, 40, 78, 58, 88, 44, 30, 64, 82, 52, 38, 70, 92, 60, 42, 76, 54, 34, 68, 86, 48, 30];

export function Waveform({ animated = true, bars = 36, className = "h-14" }: { animated?: boolean; bars?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-[3px] ${className}`} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-primary ${animated ? "wave-bar" : ""}`}
          style={{ height: `${HEIGHTS[i % HEIGHTS.length]}%`, animationDelay: `${(i % 9) * 0.09}s` }}
        />
      ))}
    </div>
  );
}
