import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useLang } from "@/lib/i18n";

const STEPS = ["prog.s1", "prog.s2", "prog.s3", "prog.s4", "prog.s5"] as const;

/** Shown while Drini writes an arrangement: a staff that fills with notes and the steps Drini goes through. */
export function DriniProgress() {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 6000);
    return () => clearInterval(id);
  }, []);
  const notes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const ys = [38, 30, 26, 34, 22, 30, 38, 26, 18, 30, 34, 26];
  return (
    <section className="card-paper p-6 md:p-8" aria-live="polite" aria-busy="true">
      <p className="label-caps text-primary">{t("prog.title")}</p>
      <svg viewBox="0 0 600 70" className="mt-5 w-full" aria-hidden>
        {[10, 20, 30, 40, 50].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="currentColor" className="text-border" strokeWidth="1.2" />)}
        {notes.map((i) => (
          <g key={i} className="drini-note" style={{ animationDelay: `${i * 0.35}s` }}>
            <ellipse cx={40 + i * 46} cy={ys[i]} rx="7" ry="5" transform={`rotate(-20 ${40 + i * 46} ${ys[i]})`} className="fill-primary" />
            <line x1={46 + i * 46} x2={46 + i * 46} y1={ys[i]! - 1} y2={ys[i]! - 26} strokeWidth="1.8" className="stroke-primary" />
          </g>
        ))}
      </svg>
      <ol className="mt-6 space-y-2.5">
        {STEPS.map((k, i) => (
          <li key={k} className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${i > step ? "opacity-35" : ""}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${i < step ? "bg-success-soft text-success" : i === step ? "bg-primary text-primary-foreground" : "bg-beige text-graphite"}`}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : <span className="text-[11px] font-semibold">{i + 1}</span>}
            </span>
            <span className={i === step ? "font-medium text-ink" : "text-graphite"}>{t(k)}{i === step ? "…" : ""}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-xs text-graphite">{t("prog.hint")}</p>
    </section>
  );
}
