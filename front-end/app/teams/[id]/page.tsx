"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import { fetchMatches, fetchTeam, fetchTopElo } from "@/lib/api";
import { confederationOf } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [team, setTeam] = useState<Team | null>(null);
  const [elo, setElo] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, e, m] = await Promise.all([fetchTeam(id), fetchTopElo(), fetchMatches()]);
      setTeam(t.data);
      setLive(t.live && e.live && m.live);
      setElo(e.data.find((x) => x.name === t.data?.name)?.elo ?? null);
      setMatches(m.data.filter((mm) => mm.homeTeam.id === id || mm.awayTeam.id === id));
    })();
  }, [id]);

  if (!team) {
    return <div className="card text-muted">Loading team...</div>;
  }

  const conf = confederationOf(team.country);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {team.flagUrl && <img src={team.flagUrl} alt="" className="h-12 w-16 rounded-md object-cover shadow-lg" />}
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">{team.name}</h1>
            <p className="text-muted">
              {team.country} · {conf} · FIFA #{team.fifaRanking ?? "—"}
            </p>
          </div>
        </div>
        <StatusBadge live={live} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat">
          <span className="text-sm text-muted">Elo</span>
          <span className="text-3xl font-black">{elo ? Math.round(elo) : "—"}</span>
        </div>
        <div className="stat">
          <span className="text-sm text-muted">Matches</span>
          <span className="text-3xl font-black">{matches.length}</span>
        </div>
        <div className="stat">
          <span className="text-sm text-muted">Confederation</span>
          <span className="text-2xl font-black">{conf}</span>
        </div>
      </div>
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-black">Fixtures</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((m) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="card flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{m.groupName ? `Group ${m.groupName}` : m.stage}</span>
                <span>{new Date(m.dateTime).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-display text-lg ${m.homeTeam.id === team.id ? "text-secondary" : ""}`}>{m.homeTeam.name}</span>
                <span className="text-2xl font-black tabular-nums">
                  {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                </span>
                <span className={`font-display text-lg ${m.awayTeam.id === team.id ? "text-secondary" : ""}`}>{m.awayTeam.name}</span>
              </div>
              <div className="text-xs text-muted">{m.stadium?.name ?? "TBC"}</div>
            </Link>
          ))}
          {matches.length === 0 && <div className="col-span-full card text-muted">No fixtures recorded</div>}
        </div>
      </section>
    </div>
  );
}