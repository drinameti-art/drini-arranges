import { Music2, Plus } from "lucide-react";
import { DEMOS } from "./demo";
import { relativeDay, useLibrary, type SavedScore } from "./library";
import { keyName, optionLabel, useLang } from "@/lib/i18n";

type Props = {
  selectedId: string | null; onOpen: (s: SavedScore) => void; onNew: () => void;
  /** Open a ready-made example (no AI, not saved). */
  onExample?: (abc: string) => void;
};

const EXAMPLES = ["quartet", "pianostrings", "satb", "solopiano"] as const;

export function RecentList({ selectedId, onOpen, onNew, onExample }: Props) {
  const library = useLibrary();
  const { t, lang } = useLang();
  return (
    <aside className="space-y-4">
      <button className="btn btn-ink w-full" onClick={onNew}><Plus className="h-4 w-4" />{t("recent.new")}</button>
      <p className="label-caps px-1 pt-2">{t("recent.title")}</p>
      {library.length === 0 ? (
        <div className="space-y-5">
          <p className="px-1 text-sm leading-relaxed text-graphite">{t("recent.empty")}</p>
          <div className="rounded-2xl border border-border bg-paper p-4">
            <p className="label-caps">{t("recent.how")}</p>
            <ol className="mt-3 space-y-3">
              {(["recent.step1", "recent.step2", "recent.step3"] as const).map((k, i) => (
                <li key={k} className="flex gap-3 text-sm leading-snug text-ink">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{i + 1}</span>
                  {t(k)}
                </li>
              ))}
            </ol>
          </div>
          {onExample && (
            <div>
              <p className="label-caps px-1">{t("recent.examples")}</p>
              <ul className="mt-2 space-y-1.5">
                {EXAMPLES.map((id) => (
                  <li key={id}>
                    <button onClick={() => onExample(DEMOS[id]!.abc)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-paper">
                      <Music2 className="h-4 w-4 text-primary" />{optionLabel(DEMOS[id]!.label, lang)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {library.slice(0, 8).map((a) => {
            const on = a.id === selectedId;
            return (
              <li key={a.id}>
                <button
                  onClick={() => onOpen(a)}
                  className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${on ? "border-primary/40 bg-paper shadow-sm" : "border-transparent hover:bg-paper"}`}
                >
                  <p className={`text-sm font-medium ${on ? "text-primary" : "text-ink"}`}>{a.title}</p>
                  <p className="mt-0.5 text-xs text-graphite">{[relativeDay(a.createdAt), keyName(a.key, lang), optionLabel(a.ensemble, lang)].filter(Boolean).join(" · ")}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
