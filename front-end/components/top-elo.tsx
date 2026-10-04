"use client";

import { useEffect, useState } from "react";
import type { EloTeam } from "@/lib/types";
import { fetchTopElo } from "@/lib/api";

export function TopElo() {
  const [elo, setElo] = useState<EloTeam[]>([]);
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      const e = await fetchTopElo();
      setElo(e.data);
      setLive(e.live);
    })();
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black sm:text-3xl">Top Elo ratings</h2>
          <p className="text-muted">{live ? "From trained model (Python)" : "Derived fallback"}</p>
        </div>
      </div>
      <div className="card overflow-hidden p-0">
        <div className="grid grid-cols-[1fr,auto] gap-2 border-b border-border bg-white/5 px-6 py-3 text-xs uppercase tracking-wide text-muted sm:px-8">
          <span>Team</span>
          <span>Elo</span>
        </div>
        <div className="flex flex-col divide-y divide-border/60">
          {elo.map((t, i) => (
            <div key={t.name} className="grid grid-cols-[auto,1fr,auto] items-center gap-4 px-6 py-3 sm:px-8">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-black">{i + 1}</span>
              <span className="font-display text-base sm:text-lg">{t.name}</span>
              <span className="font-display text-lg tabular-nums">{Math.round(t.elo)}</span>
            </div>
          ))}
          {elo.length === 0 && <div className="px-6 py-6 text-center text-muted sm:px-8">No Elo data</div>}
        </div>
      </div>
    </section>
  );
}