"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Team } from "@/lib/types";
import { fetchTeams, fetchTopElo } from "@/lib/api";
import { confederationOf, CONFEDERATIONS, CONFEDERATION_COLORS } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [elo, setElo] = useState<Record<string, number>>({});
  const [live, setLive] = useState(true);
  const [conf, setConf] = useState<(typeof CONFEDERATIONS)[number]>("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const [t, e] = await Promise.all([fetchTeams(), fetchTopElo()]);
      setTeams(t.data);
      setLive(t.live && e.live);
      const map: Record<string, number> = {};
      e.data.forEach((x) => (map[x.name] = x.elo));
      setElo(map);
    })();
  }, []);

  const filtered = useMemo(() => {
    return teams
      .filter((team) => conf === "All" || confederationOf(team.country) === conf)
      .filter((team) => team.name.toLowerCase().includes(query.toLowerCase()) || team.country.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (elo[b.name] ?? -1) - (elo[a.name] ?? -1));
  }, [teams, conf, query, elo]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Teams</h1>
          <p className="text-muted">48 qualified nations · Elo blends model + fallback</p>
        </div>
        <StatusBadge live={live} />
      </div>
      <div className="card flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {CONFEDERATIONS.map((c) => (
              <button
                key={c}
                onClick={() => setConf(c)}
                className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition ${
                  conf === c ? "border-white/40 bg-white/15" : "border-border bg-white/5 text-muted hover:bg-white/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team or country..."
            className="w-full rounded-full border border-border bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary/50 md:w-72"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((team) => {
            const c = confederationOf(team.country);
            const color = CONFEDERATION_COLORS[c] ?? "#b9aee8";
            return (
              <Link key={team.id} href={`/teams/${team.id}`} className="card flex flex-col gap-3 hover:scale-[1.01]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {team.flagUrl && <img src={team.flagUrl} alt="" className="h-6 w-9 rounded-sm object-cover shadow-sm" />}
                    <span className="font-display text-lg">{team.name}</span>
                  </div>
                  <span className="text-xs text-muted" style={{ color }}>
                    {c}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex flex-col text-xs text-muted">
                    <span>FIFA #{team.fifaRanking ?? "—"}</span>
                    <span>{team.country}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted">Elo</span>
                    <span className="font-display text-xl tabular-nums">{elo[team.name] ? Math.round(elo[team.name]) : "—"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && <div className="col-span-full card text-center text-muted">No teams match filters</div>}
        </div>
      </div>
    </div>
  );
}