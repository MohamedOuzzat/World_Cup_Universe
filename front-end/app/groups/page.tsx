"use client";

import { useEffect, useMemo, useState } from "react";
import type { Team } from "@/lib/types";
import { fetchMatches, fetchTeams } from "@/lib/api";
import { GROUPS_FALLBACK } from "@/lib/data";
import { confederationOf, CONFEDERATION_COLORS } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default function GroupsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, m] = await Promise.all([fetchTeams(), fetchMatches()]);
      setTeams(t.data);
      setLive(t.live && m.live);
    })();
  }, []);

  const teamMap = useMemo(() => new Map(teams.map((x) => [x.name, x])), [teams]);

  const groups = useMemo(() => {
    const base = GROUPS_FALLBACK;
    return Object.entries(base).map(([letter, list]) => ({
      letter,
      teams: list.map((fallback) => teamMap.get(fallback.name) ?? fallback),
    }));
  }, [teamMap]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Groups</h1>
          <p className="text-muted">FIFA World Cup 2026 · 12 groups of 4</p>
        </div>
        <StatusBadge live={live} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <div key={g.letter} className="card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl">Group {g.letter}</span>
            </div>
            <div className="flex flex-col divide-y divide-border/60">
              {g.teams.map((t) => {
                const c = confederationOf(t.country);
                const color = CONFEDERATION_COLORS[c] ?? "#b9aee8";
                return (
                  <div key={t.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {t.flagUrl && <img src={t.flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover" />}
                      <span className="font-medium">{t.name}</span>
                    </div>
                    <span className="text-xs" style={{ color }}>
                      {c}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}