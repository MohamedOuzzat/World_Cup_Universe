"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Match } from "@/lib/types";
import { fetchAllHistoricalData } from "@/lib/api";
import { formatDateTime, stageLabel } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

const STAGES = ["GROUP", "R32", "R16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE", "FINAL", "FINAL_ROUND"] as const;

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [live, setLive] = useState(true);
  const [stage, setStage] = useState<string>("ALL");
  const [group, setGroup] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");

  useEffect(() => {
    (async () => {
      const m = await fetchAllHistoricalData();
      setMatches(m.data.matches);
      setLive(m.live);
    })();
  }, []);

  const groups = useMemo(() => Array.from(new Set(matches.map((m) => m.groupName).filter(Boolean))).sort(), [matches]);

  const filtered = useMemo(() => {
    return matches
      .filter((m) => stage === "ALL" || m.stage === stage)
      .filter((m) => group === "ALL" || m.groupName === group)
      .filter((m) => status === "ALL" || m.status === status)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [matches, stage, group, status]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Matches</h1>
          <p className="text-muted">Full tournament schedule (resilient to backend downtime)</p>
        </div>
        <StatusBadge live={live} />
      </div>
      <div className="card flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="ALL">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {stageLabel(s)}
              </option>
            ))}
          </select>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="ALL">All groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                Group {g}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="ALL">All status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="FINISHED">Finished</option>
          </select>
        </div>
        <div className="flex flex-col divide-y divide-border/60">
          {filtered.map((m) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="grid gap-4 px-2 py-4 transition hover:bg-white/5 sm:grid-cols-[auto,1fr,auto] sm:items-center sm:px-4">
              <div className="flex flex-col text-xs text-muted">
                <span>{formatDateTime(m.dateTime)}</span>
                <span>
                  {m.groupName ? `Group ${m.groupName}` : stageLabel(m.stage)} · {m.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {m.homeTeam.flagUrl && <img src={m.homeTeam.flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover" />}
                  <span className="font-display text-lg">{m.homeTeam.name}</span>
                </div>
                <span className="font-display text-2xl tabular-nums">
                  {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg text-right">{m.awayTeam.name}</span>
                  {m.awayTeam.flagUrl && <img src={m.awayTeam.flagUrl} alt="" className="h-5 w-7 rounded-sm object-cover" />}
                </div>
              </div>
              <div className="text-xs text-muted sm:text-right">
                {m.stadium?.name ?? "TBC"}
                {m.stadium?.city ? ` · ${m.stadium.city}` : ""}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <div className="py-6 text-center text-muted">No matches found</div>}
        </div>
      </div>
    </div>
  );
}