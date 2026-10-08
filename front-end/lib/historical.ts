import type { Match, Stadium, Team, Goal, MatchStage } from "./types";
import { flagUrlFromCode } from "./flags";

interface HistoricalMatch {
  id: string;
  year: number;
  date: string;
  time: string | null;
  stage: string;
  group: string | null;
  round: number | null;
  stageLabel: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  home: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  away: any;
  score: string | null;
  decidedAfterExtraTime: boolean;
  decidedByPenalties: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  venue: any;
  attendance: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  referee: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  goals: any[];
}

interface HistoricalEdition {
  year: number;
  matches: HistoricalMatch[];
}

function parseScore(scoreStr: string | null): { home: number | null; away: number | null } {
  if (!scoreStr) return { home: null, away: null };
  const cleaned = scoreStr.replace(/[^0-9\-\(\)]+/g, " ").trim();
  const nums = cleaned.match(/-?\d+/g);
  if (nums && nums.length >= 2) {
    return { home: parseInt(nums[0], 10), away: parseInt(nums[1], 10) };
  }
  return { home: null, away: null };
}

function mapStage(stage: string): MatchStage {
  const s = (stage || "").toUpperCase().replace(/-/g, "_");
  if (s === "R16") return "R16";
  if (s === "R32") return "R32";
  if (s.startsWith("QUARTER")) return "QUARTER_FINAL";
  if (s.startsWith("SEMI")) return "SEMI_FINAL";
  if (s.includes("THIRD")) return "THIRD_PLACE";
  if (s === "FINAL") return "FINAL";
  if (s === "FINAL_ROUND") return "FINAL_ROUND";
  return "GROUP";
}

function mapStatus(match: HistoricalMatch): "FINISHED" | "LIVE" | "SCHEDULED" {
  const score = parseScore(match.score);
  if (score.home !== null && score.away !== null) return "FINISHED";
  const matchDate = new Date(match.date + (match.time ? "T" + match.time : ""));
  const now = Date.now();
  if (Number.isNaN(matchDate.getTime())) return "FINISHED";
  if (matchDate.getTime() < now - 2 * 60 * 60 * 1000) return "FINISHED";
  if (matchDate.getTime() <= now + 5 * 60 * 1000) return "LIVE";
  return "SCHEDULED";
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function teamFromSide(side: { id?: string; name: string; flagCode?: string | null }): Team {
  const numeric = parseInt((side.id || "").replace(/[^0-9]/g, "") || "0", 10) || 0;
  return {
    id: numeric || Math.abs(hash(side.name)),
    name: side.name,
    country: side.name,
    flagUrl: flagUrlFromCode(side.flagCode),
    fifaRanking: null,
  };
}

export async function loadAllHistoricalData() {
  const res = await fetch("/data/index.json");
  const index = await res.json();
  const allMatches: Match[] = [];
  const teamsMap = new Map<string, Team>();
  const stadiumsMap = new Map<string, Stadium>();

  for (const edition of index.editions as { year: number }[]) {
    try {
      const edRes = await fetch(`/data/editions/${edition.year}.json`);
      const ed: HistoricalEdition = await edRes.json();
      for (const m of ed.matches) {
        const home = m.home;
        const away = m.away;
        const venue = m.venue;
        const score = parseScore(m.score);
        const status = mapStatus(m);

        const homeTeam = teamFromSide(home);
        const awayTeam = teamFromSide(away);
        teamsMap.set(homeTeam.name, homeTeam);
        teamsMap.set(awayTeam.name, awayTeam);

        let stadium: Stadium | null = null;
        if (venue) {
          const stadiumKey = `${venue.name}-${venue.city ?? ""}`;
          stadium = {
            id: parseInt((venue.stadiumId || "").replace(/[^0-9]/g, "") || "0", 10) || Math.abs(hash(stadiumKey)),
            name: venue.name,
            city: venue.city,
            capacity: null,
          };
          stadiumsMap.set(stadiumKey, stadium);
        }

        const goals: Goal[] = (m.goals || []).map((g: { teamId?: string; scorer?: string; minute?: number; team?: string; teamName?: string; ownGoal?: boolean; penalty?: boolean }, idx: number) => ({
          id: idx + 1,
          scorer: g.scorer || "",
          minute: g.minute || 0,
          teamId: g.teamId && g.teamId === home.id ? homeTeam.id : awayTeam.id,
          teamName: g.team || g.teamName || "",
          ownGoal: !!g.ownGoal,
          penalty: !!g.penalty,
        }));

        const match: Match = {
          id: parseInt((m.id || "").replace(/[^0-9]/g, "") || "0", 10) || Math.abs(hash(m.id || "")),
          homeTeam,
          awayTeam,
          dateTime: m.time ? new Date(`${m.date}T${m.time}`).toISOString() : new Date(m.date).toISOString(),
          groupName: m.group ? m.group.replace("Group ", "") : "",
          stage: mapStage(m.stage),
          homeScore: score.home,
          awayScore: score.away,
          stadium,
          attendance: m.attendance,
          referee: m.referee?.name || null,
          status,
          goals: goals.length > 0 ? goals : [],
          manOfTheMatch: null,
        };
        allMatches.push(match);
      }
    } catch (e) {
      console.error(`Failed to load edition ${edition.year}:`, e);
    }
  }

  return {
    matches: allMatches,
    teams: Array.from(teamsMap.values()),
    stadiums: Array.from(stadiumsMap.values()),
  };
}
