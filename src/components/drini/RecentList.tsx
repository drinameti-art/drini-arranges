import { Plus } from "lucide-react";
import { relativeDay, useLibrary, type SavedScore } from "./library";
import { keyName, optionLabel, useLang } from "@/lib/i18n";

type Props = { selectedId: string | null; onOpen: (s: SavedScore) => void; onNew: () => void };

export function RecentList({ selectedId, onOpen, onNew }: Props) {
  const library = useLibrary();
  const { t, lang } = useLang();
  return (
    <aside className="space-y-4">
      <button className="btn btn-ink w-full" onClick={onNew}><Plus className="h-4 w-4" />{t("recent.new")}</button>
      <p className="label-caps px-1 pt-2">{t("recent.title")}</p>
      {library.length === 0 ? (
        <p className="px-1 text-sm leading-relaxed text-graphite">{t("recent.empty")}</p>
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
