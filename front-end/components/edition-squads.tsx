"use client";

import { useMemo, useState } from "react";
import type { Squad } from "@/lib/worldcups";
import { flagUrlFromCode } from "@/lib/flags";

const POSITION_ORDER = ["GK", "DF", "MF", "FW"];

function positionLabel(position: string | null, positionName: string | null): string {
  if (positionName) return positionName;
  if (position) return position;
  return "—";
}

export function EditionSquads({ squads }: { squads: Squad[] }) {
  const sorted = useMemo(
    () => [...squads].sort((a, b) => a.name.localeCompare(b.name)),
    [squads],
  );
  const [selected, setSelected] = useState(0);
  const team = sorted[selected];

  const players = useMemo(() => {
    if (!team) return [];
    return [...team.players].sort((a, b) => {
      const pa = POSITION_ORDER.indexOf(a.position ?? "");
      const pb = POSITION_ORDER.indexOf(b.position ?? "");
      const rank = (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      if (rank !== 0) return rank;
      return (a.shirt ?? 999) - (b.shirt ?? 999);
    });
  }, [team]);

  if (!team) return null;

  return (
    <div className="card flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black">Squads</h2>
        <span className="text-xs text-muted">{squads.length} national teams</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sorted.map((squad, i) => (
          <button
            key={squad.id ?? squad.name}
            type="button"
            onClick={() => setSelected(i)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              i === selected
                ? "border-white/40 bg-white/15 text-foreground"
                : "border-border bg-white/5 text-muted hover:bg-white/10"
            }`}
          >
            {flagUrlFromCode(squad.flagCode) && (
              <img src={flagUrlFromCode(squad.flagCode)!} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
            )}
            {squad.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        {flagUrlFromCode(team.flagCode) && (
          <img src={flagUrlFromCode(team.flagCode)!} alt={`${team.name} flag`} className="h-9 w-14 rounded-md object-cover shadow" />
        )}
        <div>
          <div className="font-display text-2xl">{team.name}</div>
          <div className="text-xs text-muted">
            {[team.confederation, team.region, `${team.players.length} players`].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player, i) => (
          <div
            key={`${player.playerId ?? "p"}-${i}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-white/5 px-3 py-2"
          >
            <span className="w-8 shrink-0 text-right font-display text-lg tabular-nums text-secondary">
              {player.shirt ?? "–"}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{player.name}</span>
            <span className="chip !py-0.5 !text-[10px]">{positionLabel(player.position, player.positionName)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
