/**
 * Server-side access to the static World Cup dataset in public/data.
 * Only import this from server components (it reads from disk).
 */
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const EDITIONS_DIR = path.join(DATA_DIR, "editions");

export interface EditionSummary {
  year: number;
  id: string;
  name: string;
  host: string | null;
  winner: string | null;
  runnerUp: string | null;
  thirdPlace: string | null;
  topScorer: TopScorer | null;
  startDate: string | null;
  endDate: string | null;
  stats: EditionStats;
}

export interface EditionStats {
  matches: number;
  goals: number;
  teams: number;
  stadiums: number;
  attendance: number | null;
  averageAttendance: number | null;
}

export interface TopScorer {
  name: string;
  goals: number | null;
  team: string | null;
  playerId: string | null;
}

export interface AwardRow {
  award: string;
  playerId: string | null;
  player: string;
  teamId: string | null;
  team: string | null;
  shared: boolean;
}

export interface TeamRef {
  id: string | null;
  name: string;
  code: string | null;
  confederation?: string;
  region?: string;
  flagCode: string | null;
  historical?: boolean;
  formerName?: string | null;
  position?: number;
}

export interface SquadPlayer {
  playerId: string | null;
  name: string;
  shirt: number | null;
  position: string | null;
  positionName: string | null;
}

export interface Squad extends TeamRef {
  players: SquadPlayer[];
}

export interface MatchSide {
  id: string;
  name: string;
  code?: string;
  confederation?: string;
  region?: string;
  flagCode?: string | null;
  historical?: boolean;
  formerName?: string | null;
  score: number | null;
}

export interface KnockoutMatch {
  id: string;
  year?: number;
  date: string | null;
  time?: string | null;
  stage: string;
  group: string | null;
  round?: number | null;
  stageLabel?: string | null;
  home: MatchSide;
  away: MatchSide;
  score: string | null;
  scoreRegularTime?: string | null;
  scoreEt?: string | null;
  scorePen?: string | null;
  decidedAfterExtraTime?: boolean;
  decidedByPenalties?: boolean;
  venue?: { name: string; city: string; country?: string } | null;
  attendance?: number | null;
  referee?: { name: string; country?: string } | null;
}

export interface WorldCupEdition extends EditionSummary {
  groups: unknown[];
  finalTable: TeamRef[];
  squads: Squad[];
  awards: AwardRow[];
  matches: KnockoutMatch[];
}

export interface DatasetIndex {
  generated: string;
  coverage: { from: number; to: number; editions: number };
  stats: {
    matches: number;
    goals: number;
    teams: number;
    stadiums: number;
    players: number;
    goalsPerMatch?: number;
  };
  editions: EditionSummary[];
}

let indexCache: DatasetIndex | null = null;

export function getIndex(): DatasetIndex {
  if (indexCache) return indexCache;
  const raw = fs.readFileSync(path.join(DATA_DIR, "index.json"), "utf8");
  const parsed = JSON.parse(raw) as DatasetIndex;
  indexCache = parsed;
  return parsed;
}

export function listEditions(): EditionSummary[] {
  return [...getIndex().editions].sort((a, b) => b.year - a.year);
}

export function isValidYear(year: number): boolean {
  return Number.isInteger(year) && getIndex().editions.some((e) => e.year === year);
}

export function getEdition(year: number): WorldCupEdition | null {
  const file = path.join(EDITIONS_DIR, `${year}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as WorldCupEdition;
}

/** Knockout rounds in draw order, skipping rounds this edition never played. */
export const KNOCKOUT_ROUNDS: { stage: string; label: string }[] = [
  { stage: "R32", label: "Round of 32" },
  { stage: "R16", label: "Round of 16" },
  { stage: "QUARTER_FINAL", label: "Quarter-finals" },
  { stage: "SEMI_FINAL", label: "Semi-finals" },
  { stage: "THIRD_PLACE", label: "Third place" },
  { stage: "FINAL", label: "Final" },
  { stage: "FINAL_ROUND", label: "Final round (decisive group)" },
];

export function knockoutByRound(edition: WorldCupEdition): { stage: string; label: string; matches: KnockoutMatch[] }[] {
  return KNOCKOUT_ROUNDS.map((round) => ({
    ...round,
    matches: edition.matches
      .filter((m) => m.stage === round.stage)
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")),
  })).filter((round) => round.matches.length > 0);
}

/** Official best player: the Golden Ball winner (FIFA has awarded it since 1978). */
export function bestPlayer(edition: WorldCupEdition): {
  player: string;
  team: string | null;
  award: string;
  official: boolean;
} | null {
  const order = ["Golden Ball", "Silver Ball", "Bronze Ball"];
  for (const award of order) {
    const row = edition.awards.find((a) => a.award === award);
    if (row) return { player: row.player, team: row.team, award, official: award === "Golden Ball" };
  }
  if (edition.topScorer) {
    return {
      player: edition.topScorer.name,
      team: edition.topScorer.team,
      award: "Top scorer",
      official: false,
    };
  }
  return null;
}

export function awardRows(edition: WorldCupEdition, names: string[]): AwardRow[] {
  return names.map((name) => edition.awards.find((a) => a.award === name)).filter((a): a is AwardRow => Boolean(a));
}
