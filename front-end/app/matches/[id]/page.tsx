"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Match } from "@/lib/types";
import { fetchMatch } from "@/lib/api";
import { formatDateTime, stageLabel } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [match, setMatch] = useState<Match | null>(null);
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      const m = await fetchMatch(id);
      setMatch(m.data);
      setLive(m.live);
    })();
  }, [id]);

  if (!match) {
    return <div className="card text-muted">Loading match...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </h1>
          <p className="text-muted">
            {formatDateTime(match.dateTime)} · {match.groupName ? `Group ${match.groupName}` : stageLabel(match.stage)} · {match.status}
          </p>
        </div>
        <StatusBadge live={live} />
      </div>
      <div className="card flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          <div className="flex flex-col items-center gap-3">
            {match.homeTeam.flagUrl && <img src={match.homeTeam.flagUrl} alt="" className="h-14 w-20 rounded-md object-cover shadow-lg" />}
            <span className="font-display text-2xl sm:text-3xl">{match.homeTeam.name}</span>
          </div>
          <div className="flex flex-col items-center">
            {match.homeScore !== null && match.awayScore !== null ? (
              <span className="font-display text-5xl tabular-nums sm:text-6xl">
                {match.homeScore} - {match.awayScore}
              </span>
            ) : (
              <span className="rounded-full bg-white/10 px-6 py-2 text-lg font-medium uppercase">VS</span>
            )}
            <span className="mt-2 text-xs text-muted uppercase">{match.status}</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            {match.awayTeam.flagUrl && <img src={match.awayTeam.flagUrl} alt="" className="h-14 w-20 rounded-md object-cover shadow-lg" />}
            <span className="font-display text-2xl sm:text-3xl">{match.awayTeam.name}</span>
          </div>
        </div>
        {match.stadium && (
          <p className="text-sm text-muted">
            {match.stadium.name}, {match.stadium.city}
            {match.attendance ? ` · ${match.attendance.toLocaleString("en-GB")} attendance` : ""}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {match.goals && match.goals.length > 0 && (
          <div className="card flex flex-col gap-3">
            <h2 className="text-xl font-black">Goals</h2>
            <div className="flex flex-col divide-y divide-border/60 text-sm">
              {match.goals.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-2">
                  <span>
                    {g.scorer} {g.penalty ? "(P)" : ""} {g.ownGoal ? "(OG)" : ""}
                  </span>
                  <span className="text-muted">
                    {g.teamName} · {g.minute}'
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {match.manOfTheMatch && (
          <div className="card flex flex-col gap-2">
            <h2 className="text-xl font-black">Man of the Match</h2>
            <p className="font-display text-lg">{match.manOfTheMatch.name}</p>
            <p className="text-sm text-muted">{match.manOfTheMatch.teamName}</p>
          </div>
        )}
      </div>
    </div>
  );
}