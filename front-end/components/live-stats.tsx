"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match, Sourced, Team } from "@/lib/types";
import { fetchMatches, fetchTeams } from "@/lib/api";

export function LiveStats() {
  const [teams, setTeams] = useState<Sourced<Team[]>>({ data: [], live: true });
  const [matches, setMatches] = useState<Sourced<Match[]>>({ data: [], live: true });

  useEffect(() => {
    (async () => {
      const [t, m] = await Promise.all([fetchTeams(), fetchMatches()]);
      setTeams(t);
      setMatches(m);
    })();
  }, []);

  const finished = useMemo(() => matches.data.filter((m) => m.status === "FINISHED").length, [matches.data]);
  const scheduled = useMemo(() => matches.data.filter((m) => m.status === "SCHEDULED").length, [matches.data]);
  const live = useMemo(() => matches.data.filter((m) => m.status === "LIVE").length, [matches.data]);
  const groups = useMemo(() => new Set(matches.data.map((m) => m.groupName)).size, [matches.data]);

  const overallLive = teams.live && matches.live;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black sm:text-3xl">Live snapshot</h2>
          <p className="text-muted">Data source: {overallLive ? "Live (Java/Python)" : "Fallback (local)"}</p>
        </div>
        {!overallLive && (
          <span className="chip bg-primary/20 text-primary">Offline — showing fallback dataset</span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="stat">
          <span className="text-sm text-muted">Teams</span>
          <span className="text-3xl font-black">{teams.data.length}</span>
        </div>
        <div className="stat">
          <span className="text-sm text-muted">Matches</span>
          <span className="text-3xl font-black">{matches.data.length}</span>
        </div>
        <div className="stat">
          <span className="text-sm text-muted">Scheduled</span>
          <span className="text-3xl font-black">{scheduled}</span>
        </div>
        <div className="stat">
          <span className="text-sm text-muted">Finished</span>
          <span className="text-3xl font-black">{finished}</span>
        </div>
        <div className="stat">
          <span className="text-sm text-muted">Groups</span>
          <span className="text-3xl font-black">{groups}</span>
        </div>
      </div>
    </section>
  );
}