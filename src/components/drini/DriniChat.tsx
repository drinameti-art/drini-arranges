import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Spark } from "./Logo";
import type { Msg } from "./useDrini";

export function DriniChat({ msgs, busy, onSend }: { msgs: Msg[]; busy: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msgs, busy]);

  const send = (t: string) => {
    const v = t.trim();
    if (!v || busy) return;
    setText("");
    onSend(v);
  };

  return (
    <aside className="flex h-full min-h-[520px] flex-col rounded-[20px] bg-ink p-4 text-cream">
      <div className="flex items-center gap-3 border-b border-cream/10 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary"><Spark className="h-4 w-4" /></div>
        <div>
          <p className="font-display text-lg font-semibold leading-tight">Drini</p>
          <p className="text-xs text-cream/60">Your arranging assistant</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-4 lg:max-h-[560px]">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.from === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-ink-soft text-cream"}`}>
              {m.text}
            </p>
          </div>
        ))}
        {busy && <p className="w-fit rounded-2xl rounded-bl-md bg-ink-soft px-3.5 py-2.5 text-sm text-cream/60">Drini is writing…</p>}
        <div ref={end} />
      </div>

      <div className="flex flex-wrap gap-2 pb-3">
        {["Yes, smooth it", "Keep the leap", "Add fingering"].map((q) => (
          <button key={q} disabled={busy} onClick={() => send(q)} className="pill disabled:opacity-50 min-h-9 border border-cream/20 text-cream/90 transition-colors hover:border-gold hover:text-gold">{q}</button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-center gap-2 rounded-xl bg-ink-soft p-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask Drini to change something…"
          aria-label="Message Drini"
          className="min-h-11 flex-1 bg-transparent px-2.5 text-sm text-cream placeholder:text-cream/45 focus:outline-none"
        />
        <button type="submit" disabled={busy} aria-label="Send" className="flex disabled:opacity-50 h-11 w-11 items-center justify-center rounded-[10px] bg-primary text-primary-foreground hover:bg-primary-hover">
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
