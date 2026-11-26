import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, ChevronDown, Download, Pause, Play, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Check as CheckItem } from "@/lib/abc-check";
import { ScoreSheet, type ScoreSheetHandle } from "./ScoreSheet";
import { COPYRIGHT, downloadAbc, downloadMidi, downloadMusicXml, fileSlug, printScore } from "@/lib/abc-tools";
import { checkLabel, keyName, useLang } from "@/lib/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Score } from "./useDrini";

type Props = {
  score: Score;
  checks: CheckItem[];
  draft: number;
  refreshing: boolean;
  onTranspose: (semitones: number, label: string) => void;
};

const steps = [
  { n: 1, label: "step.up1" },
  { n: -1, label: "step.down1" },
  { n: 2, label: "step.up2" },
  { n: -2, label: "step.down2" },
  { n: 12, label: "step.up12" },
  { n: -12, label: "step.down12" },
] as const;

export function ScoreCard({ score, checks, draft, refreshing, onTranspose }: Props) {
  const [started, setStarted] = useState(false);
  const sheet = useRef<ScoreSheetHandle>(null);
  const [playing, setPlaying] = useState(false);
  const { t, lang } = useLang();

  // A new score replaces the old one: stop playback and start fresh next time.
  useEffect(() => {
    setPlaying(false);
    setStarted(false);
  }, [score.abc]);

  const toggle = async () => {
    if (playing) { sheet.current?.pause(); setPlaying(false); return; }
    setPlaying(true);
    if (started) sheet.current?.resume();
    else { setStarted(true); await sheet.current?.play(); }
  };

  const midi = async () => {
    try {
      await downloadMidi(score.abc, fileSlug(score.title));
      toast(t("dl.midiDone"));
    } catch {
      toast(t("dl.failed"));
    }
  };

  const musicXml = async () => {
    try {
      await downloadMusicXml(score.abc, score.title, fileSlug(score.title));
      toast(t("dl.xmlDone"));
    } catch {
      toast(t("dl.failed"));
    }
  };

  const metaLine = [t("score.by"), keyName(score.key, lang), score.meter, t("score.bars", { n: score.bars })].filter(Boolean).join(" · ");
  const print = () => void printScore(score.title, metaLine, score.abc);

  const highlights = score.notes.map((n) => ({ bar: n.bar, label: t("score.note", { n: n.bar }) }));

  return (
    <section id="score" className={`print-area scroll-mt-20 card-paper p-5 transition-opacity md:p-6 ${refreshing ? "opacity-50" : ""}`}>
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-2xl text-ink">
            {score.title}
            {score.example && <span className="pill bg-beige font-sans text-xs font-medium text-graphite">{t("score.example")}</span>}
          </h2>
          <p className="mt-1 text-sm text-graphite">
            {[t("score.by"), keyName(score.key, lang), score.meter, t("score.bars", { n: score.bars }), t("score.draft", { n: draft })].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button className="btn btn-primary min-w-28" onClick={toggle} aria-pressed={playing}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? t("score.pause") : t("score.play")}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn btn-ghost" disabled={refreshing}><ArrowUpDown className="h-4 w-4" />{t("score.transpose")}<ChevronDown className="h-3.5 w-3.5 opacity-60" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{t("score.now", { key: keyName(score.key, lang) })}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {steps.map((st) => (
                <DropdownMenuItem key={st.n} onSelect={() => onTranspose(st.n, t(st.label))}>
                  {t(st.label)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn btn-ghost"><Download className="h-4 w-4" />{t("score.download")}<ChevronDown className="h-3.5 w-3.5 opacity-60" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onSelect={print}>{t("dl.pdf")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void musicXml()}>{t("dl.xml")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void midi()}>{t("dl.midi")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => downloadAbc(score.abc, fileSlug(score.title))}>{t("dl.abc")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="score-scroll mt-5 overflow-x-auto rounded-2xl border border-border bg-paper px-2 py-3">
        <div className="min-w-[680px]">
          <ScoreSheet ref={sheet} abc={score.abc} highlights={highlights} onEnded={() => { setPlaying(false); setStarted(false); }} />
          <p className="mt-2 pb-1 text-center font-sans text-[11px] tracking-wide text-graphite">{COPYRIGHT}</p>
        </div>
      </div>

      <div className="no-print mt-4 flex flex-wrap gap-2">
        {checks.map((c) =>
          c.ok ? (
            <span key={c.label} className="pill bg-success-soft text-success"><Check className="h-3.5 w-3.5" />{checkLabel(c.label, lang)}</span>
          ) : (
            <span key={c.label} className="pill bg-warning-soft text-warning"><AlertTriangle className="h-3.5 w-3.5" />{checkLabel(c.label, lang)}</span>
          ),
        )}
        {score.notes.map((n) => (
          <span key={`${n.bar}-${n.text}`} className="pill bg-warning-soft text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />{t("score.notePill", { n: n.bar, text: n.text })}
          </span>
        ))}
      </div>
    </section>
  );
}
