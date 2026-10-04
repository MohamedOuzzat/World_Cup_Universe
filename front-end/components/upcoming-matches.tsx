"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Match } from "@/lib/types";
import { fetchMatches } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function UpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      const m = await fetchMatches();
      setMatches(m.data);
      setLive(m.live);
    })();
  }, []);

  const upcoming = useMemo(
    () => [...matches].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()).slice(0, 6),
    [matches],
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black sm:text-3xl">Upcoming & next fixtures</h2>
          <p className="text-muted">{live ? "Live from Java API" : "Fallback schedule"}</p>
        </div>
        <Link href="/matches" className="btn-ghost">
          All matches
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {upcoming.map((m) => (
          <Link key={m.id} href={`/matches/${m.id}`} className="card flex flex-col gap-4 hover:scale-[1.01]">
            <div className="flex items-center justify-between">
              <span className="chip">{m.groupName ? `Group ${m.groupName}` : m.stage}</span>
              <span className="text-xs text-muted">{formatDateTime(m.dateTime)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  {m.homeTeam.flagUrl && <img src={m.homeTeam.flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover shadow-sm" />}
                  <span className="font-display text-lg">{m.homeTeam.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {m.awayTeam.flagUrl && <img src={m.awayTeam.flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover shadow-sm" />}
                  <span className="font-display text-lg">{m.awayTeam.name}</span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-center gap-1">
                {m.status === "FINISHED" && m.homeScore !== null && m.awayScore !== null ? (
                  <span className="font-display text-3xl tabular-nums">
                    {m.homeScore} - {m.awayScore}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase">{m.status}</span>
                )}
                {m.stadium && <span className="text-xs text-muted">{m.stadium.city}</span>}
              </div>
            </div>
          </Link>
        ))}
        {upcoming.length === 0 && <div className="card col-span-full text-center text-muted">No matches found</div>}
      </div>
    </section>
  );
}