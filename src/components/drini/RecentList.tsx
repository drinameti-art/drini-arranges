import { useState } from "react";
import { Plus } from "lucide-react";
import { recentArrangements } from "./data";

export function RecentList() {
  const [selected, setSelected] = useState("folk");
  return (
    <aside className="space-y-4">
      <button className="btn btn-ink w-full"><Plus className="h-4 w-4" />New arrangement</button>
      <p className="label-caps px-1 pt-2">Recent</p>
      <ul className="space-y-2">
        {recentArrangements.map((a) => (
          <li key={a.id}>
            <button
              onClick={() => setSelected(a.id)}
              className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${selected === a.id ? "border-primary/40 bg-paper shadow-sm" : "border-transparent hover:bg-paper"}`}
            >
              <p className={`text-sm font-medium ${selected === a.id ? "text-primary" : "text-ink"}`}>{a.title}</p>
              <p className="mt-0.5 text-xs text-graphite">{a.meta}</p>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
