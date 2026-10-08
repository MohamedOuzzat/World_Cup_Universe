import Link from "next/link";
import { listEditions, getIndex } from "@/lib/worldcups";
import { flagUrl } from "@/lib/flags";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-static";

export default function WorldCupsPage() {
  const editions = listEditions();
  const index = getIndex();
  const latest = editions[0]?.year;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="chip">1930 – {editions[0]?.year}</span>
        <h1 className="text-3xl font-black sm:text-5xl">Every World Cup</h1>
        <p className="max-w-3xl text-muted">
          {editions.length} editions · {formatNumber(index.stats.matches)} matches · {formatNumber(index.stats.goals)} goals ·{" "}
          {formatNumber(index.stats.players)} players. Pick an edition to see the winner, the best player, the knockout bracket and every
          squad.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {editions.map((edition) => {
          const winnerFlag = flagUrl(edition.winner);
          const runnerFlag = flagUrl(edition.runnerUp);
          return (
            <Link
              key={edition.year}
              href={`/world-cups/${edition.year}`}
              className="card flex flex-col gap-4 hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-4xl leading-none">{edition.year}</div>
                  <div className="mt-1 text-xs text-muted">
                    {formatDate(edition.startDate)} – {formatDate(edition.endDate)}
                  </div>
                </div>
                {edition.year === latest ? (
                  <span className="chip !border-secondary/50 !text-secondary">Latest</span>
                ) : (
                  <span className="chip">{edition.stats.teams} teams</span>
                )}
              </div>

              <div className="text-sm text-muted">{edition.host}</div>

              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  {winnerFlag && <img src={winnerFlag} alt="" className="h-5 w-7 rounded-sm object-cover" />}
                  <span className="text-xs uppercase tracking-wider text-muted">Champions</span>
                  <span className="font-display ml-auto text-right">{edition.winner}</span>
                </div>
                <div className="flex items-center gap-2">
                  {runnerFlag && <img src={runnerFlag} alt="" className="h-5 w-7 rounded-sm object-cover" />}
                  <span className="text-xs uppercase tracking-wider text-muted">Runner-up</span>
                  <span className="ml-auto text-right">{edition.runnerUp}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
                <span>
                  Top scorer: <span className="text-foreground">{edition.topScorer?.name ?? "—"}</span>
                  {edition.topScorer?.goals != null ? ` (${edition.topScorer.goals})` : ""}
                </span>
                <span className="tabular-nums">
                  {edition.stats.matches} matches · {edition.stats.goals} goals
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
