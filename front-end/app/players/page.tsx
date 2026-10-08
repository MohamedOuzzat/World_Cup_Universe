"use client";

import { useEffect, useMemo, useState } from "react";
import type { Player, Team } from "@/lib/types";
import { fetchPlayers, fetchTeams } from "@/lib/api";
import { confederationOf, CONFEDERATIONS } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [live, setLive] = useState(true);
  const [query, setQuery] = useState("");
  const [teamId, setTeamId] = useState<number | "ALL">("ALL");
  const [conf, setConf] = useState<(typeof CONFEDERATIONS)[number]>("All");

  useEffect(() => {
    (async () => {
      const [p, t] = await Promise.all([fetchPlayers(), fetchTeams()]);
      setPlayers(p.data);
      setTeams(t.data);
      setLive(p.live && t.live);
    })();
  }, []);

  const teamMap = useMemo(() => new Map(teams.map((x) => [x.id, x])), [teams]);

  const filtered = useMemo(() => {
    return players
      .filter((pl) => teamId === "ALL" || pl.teamId === teamId)
      .filter((pl) => {
        const team = teamMap.get(pl.teamId);
        return conf === "All" || (team && confederationOf(team.country) === conf);
      })
      .filter((pl) => pl.name.toLowerCase().includes(query.toLowerCase()) || pl.teamName.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 200);
  }, [players, teamId, conf, query, teamMap]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Players</h1>
          <p className="text-muted">Curated roster snapshot (fallback until Java seeds players)</p>
        </div>
        <StatusBadge live={live} />
      </div>
      <div className="card flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search player..."
            className="w-full rounded-full border border-border bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary/50 md:w-64"
          />
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
            className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="ALL">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={conf}
            onChange={(e) => setConf(e.target.value as (typeof CONFEDERATIONS)[number])}
            className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            {CONFEDERATIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <div key={p.id} className="card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg">{p.name}</span>
                <span className="text-xs text-muted">#{p.shirtNumber ?? "—"}</span>
              </div>
              <div className="flex flex-col text-xs text-muted">
                <span>{p.teamName}</span>
                <span>
                  {p.position} · {p.nationality ?? p.teamName}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full card text-center text-muted">No players found</div>}
        </div>
      </div>
    </div>
  );
}