import Link from "next/link";
import { notFound } from "next/navigation";
import {
  bestPlayer,
  getEdition,
  isValidYear,
  knockoutByRound,
  listEditions,
  type KnockoutMatch,
  type WorldCupEdition,
} from "@/lib/worldcups";
import { flagUrl, flagUrlFromCode } from "@/lib/flags";
import { formatDate, formatNumber } from "@/lib/format";
import { EditionSquads } from "@/components/edition-squads";

export const dynamic = "force-static";

export function generateStaticParams() {
  return listEditions().map((edition) => ({ year: String(edition.year) }));
}

function parseNumbers(value: string | null | undefined): [number, number] | null {
  if (!value) return null;
  const nums = value.match(/\d+/g);
  if (!nums || nums.length < 2) return null;
  return [parseInt(nums[0], 10), parseInt(nums[1], 10)];
}

function matchWinner(match: KnockoutMatch): "home" | "away" | null {
  if (match.decidedByPenalties && match.scorePen) {
    const pen = parseNumbers(match.scorePen);
    if (pen) return pen[0] > pen[1] ? "home" : pen[0] < pen[1] ? "away" : null;
  }
  const home = match.home.score;
  const away = match.away.score;
  if (home == null || away == null) return null;
  if (home > away) return "home";
  if (away > home) return "away";
  return null;
}

function TeamLine({ side, winner }: { side: KnockoutMatch["home"]; winner: boolean }) {
  const flag = flagUrlFromCode(side.flagCode);
  return (
    <div className={`flex min-w-0 items-center gap-2 ${winner ? "text-foreground" : "text-muted"}`}>
      {flag && <img src={flag} alt="" className="h-4 w-6 shrink-0 rounded-sm object-cover" />}
      <span className={`truncate text-sm ${winner ? "font-semibold" : ""}`}>{side.name}</span>
      <span className={`ml-auto tabular-nums ${winner ? "font-display text-lg" : "text-sm"}`}>{side.score ?? "–"}</span>
    </div>
  );
}

function KnockoutMatchCard({ match }: { match: KnockoutMatch }) {
  const winner = matchWinner(match);
  return (
    <div className="rounded-2xl border border-border bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>{formatDate(match.date)}</span>
        {match.venue?.city && <span className="truncate">{match.venue.city}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <TeamLine side={match.home} winner={winner === "home"} />
        <TeamLine side={match.away} winner={winner === "away"} />
      </div>
      {(match.decidedByPenalties || match.decidedAfterExtraTime || match.scoreEt) && (
        <div className="mt-2 border-t border-border pt-1.5 text-[10px] text-muted">
          {match.decidedByPenalties && match.scorePen ? `Penalties ${match.scorePen}` : null}
          {match.decidedByPenalties && match.decidedAfterExtraTime ? " · " : null}
          {match.decidedAfterExtraTime ? "After extra time" : null}
        </div>
      )}
    </div>
  );
}

function PodiumCard({
  place,
  team,
  highlight,
}: {
  place: number;
  team: string | null;
  highlight?: boolean;
}) {
  const flag = flagUrl(team);
  const medal = place === 1 ? "text-secondary" : place === 2 ? "text-muted" : "text-accent";
  return (
    <div
      className={`card flex items-center gap-4 ${
        highlight ? "!border-secondary/60 shadow-[0_30px_160px_-50px_rgba(255,200,61,0.65)]" : ""
      }`}
    >
      <span className={`font-display text-4xl leading-none ${medal}`}>{place}</span>
      {flag && <img src={flag} alt="" className="h-9 w-14 rounded-md object-cover shadow" />}
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted">{place === 1 ? "Champions" : place === 2 ? "Runner-up" : "Third place"}</div>
        <div className="font-display truncate text-xl">{team ?? "—"}</div>
      </div>
    </div>
  );
}

function AwardItem({ label, player, team, sub }: { label: string; player: string; team?: string | null; sub?: string | null }) {
  const flag = flagUrl(team);
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-white/5 px-4 py-3">
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <span className="font-display text-lg leading-tight">{player}</span>
      <span className="flex items-center gap-2 text-xs text-muted">
        {flag && <img src={flag} alt="" className="h-3 w-5 rounded-sm object-cover" />}
        {team}
        {sub ? ` · ${sub}` : ""}
      </span>
    </div>
  );
}

export default async function WorldCupEditionPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const parsed = Number(year);
  if (!isValidYear(parsed)) notFound();
  const edition = getEdition(parsed) as WorldCupEdition;

  const best = bestPlayer(edition);
  const goldenBallOfficial = Boolean(edition.awards.find((a) => a.award === "Golden Ball"));
  const goldenBoot = edition.awards.find((a) => a.award === "Golden Boot");
  const goldenGlove = edition.awards.find((a) => a.award === "Golden Glove");
  const youngPlayer = edition.awards.find((a) => a.award === "Best Young Player");
  const rounds = knockoutByRound(edition);
  const podium = [edition.winner, edition.runnerUp, edition.thirdPlace];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Link href="/world-cups" className="text-sm text-muted transition hover:text-foreground">
          ← All World Cups
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="chip">{edition.host}</span>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">{edition.year} World Cup</h1>
            <p className="mt-1 text-muted">
              {formatDate(edition.startDate)} – {formatDate(edition.endDate)} · {formatNumber(edition.stats.matches)} matches ·{" "}
              {formatNumber(edition.stats.goals)} goals · {edition.stats.teams} teams
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <PodiumCard place={1} team={podium[0]} highlight />
        <PodiumCard place={2} team={podium[1]} />
        <PodiumCard place={3} team={podium[2]} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat">
          <span className="text-xs uppercase tracking-wider text-muted">Matches</span>
          <span className="font-display text-3xl tabular-nums">{formatNumber(edition.stats.matches)}</span>
        </div>
        <div className="stat">
          <span className="text-xs uppercase tracking-wider text-muted">Goals</span>
          <span className="font-display text-3xl tabular-nums">
            {formatNumber(edition.stats.goals)}
            <span className="ml-2 text-sm text-muted">{(edition.stats.goals / Math.max(edition.stats.matches, 1)).toFixed(2)}/match</span>
          </span>
        </div>
        <div className="stat">
          <span className="text-xs uppercase tracking-wider text-muted">Teams</span>
          <span className="font-display text-3xl tabular-nums">{edition.stats.teams}</span>
        </div>
        <div className="stat">
          <span className="text-xs uppercase tracking-wider text-muted">Attendance</span>
          <span className="font-display text-3xl tabular-nums">{edition.stats.attendance ? formatNumber(edition.stats.attendance) : "—"}</span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-black">Best player & awards</h2>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
          <div className="card flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-muted">
              {goldenBallOfficial ? "Golden Ball · tournament best player" : "Best player"}
            </span>
            {best ? (
              <>
                <div className="flex items-center gap-3">
                  {flagUrl(best.team) && <img src={flagUrl(best.team)!} alt="" className="h-9 w-14 rounded-md object-cover shadow" />}
                  <span className="font-display text-3xl">{best.player}</span>
                </div>
                <span className="text-sm text-muted">{best.team}</span>
              </>
            ) : (
              <span className="text-muted">Not awarded</span>
            )}
            {!goldenBallOfficial && best && (
              <p className="border-t border-border pt-3 text-xs text-muted">
                FIFA only created the Golden Ball in 1978, so this edition&apos;s standout is shown from its top scorer instead.
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AwardItem
              label="Golden Boot · top scorer"
              player={goldenBoot?.player ?? edition.topScorer?.name ?? "—"}
              team={goldenBoot?.team ?? edition.topScorer?.team}
              sub={edition.topScorer?.goals != null ? `${edition.topScorer.goals} goals` : null}
            />
            {edition.topScorer && goldenBoot && edition.topScorer.name !== goldenBoot.player && (
              <AwardItem
                label="Top scorer"
                player={edition.topScorer.name}
                team={edition.topScorer.team}
                sub={edition.topScorer.goals != null ? `${edition.topScorer.goals} goals` : null}
              />
            )}
            {goldenGlove && <AwardItem label="Golden Glove · best goalkeeper" player={goldenGlove.player} team={goldenGlove.team} />}
            {youngPlayer && <AwardItem label="Best young player" player={youngPlayer.player} team={youngPlayer.team} />}
            {edition.awards
              .filter((a) => !["Golden Ball", "Golden Boot", "Golden Glove", "Best Young Player"].includes(a.award))
              .slice(0, 6)
              .map((a, i) => (
                <AwardItem key={`${a.award}-${i}`} label={a.award} player={a.player} team={a.team} />
              ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-black">Knockout bracket</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {rounds.map((round) => (
            <div key={round.stage} className="flex min-w-[15rem] flex-1 flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">{round.label}</span>
                <span className="chip !py-0.5 !text-[10px]">{round.matches.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {round.matches.map((match) => (
                  <KnockoutMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {edition.finalTable.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-black">Final standings</h2>
          <div className="card flex flex-col divide-y divide-border/60">
            {edition.finalTable.map((row) => (
              <div key={row.id ?? row.name} className="flex items-center gap-3 py-3">
                <span className="w-6 font-display text-lg tabular-nums text-muted">{row.position}</span>
                {flagUrlFromCode(row.flagCode) && (
                  <img src={flagUrlFromCode(row.flagCode)!} alt="" className="h-5 w-7 rounded-sm object-cover" />
                )}
                <span className="font-display">{row.name}</span>
                {row.confederation && <span className="ml-auto text-xs text-muted">{row.confederation}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <EditionSquads squads={edition.squads} />
    </div>
  );
}
