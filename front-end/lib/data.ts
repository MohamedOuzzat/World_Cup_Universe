/**
 * Rich 48-team World Cup 2026 fallback dataset (deterministic).
 *
 * This mirrors the structure the UI expects and is intentionally complete: groups,
 * stadiums in all three host countries, and a realistic first-round schedule so
 * the pages render with data even if no backends are running. Stadium names,
 * cities and capacities are based on official 2026 venues.
 */

import type { Match, Player, Stadium, Team } from "./types";
import { flagUrl } from "./flags";
import { hashString } from "./format";

export const STADIUMS_FALLBACK: Stadium[] = [
  { id: 1, name: "SoFi Stadium", city: "Los Angeles (Inglewood)", capacity: 70240 },
  { id: 2, name: "MetLife Stadium", city: "East Rutherford", capacity: 82500 },
  { id: 3, name: "AT&T Stadium", city: "Dallas", capacity: 80000 },
  { id: 4, name: "NRG Stadium", city: "Houston", capacity: 72220 },
  { id: 5, name: "Arrowhead Stadium", city: "Kansas City", capacity: 76416 },
  { id: 6, name: "Lincoln Financial Field", city: "Philadelphia", capacity: 69176 },
  { id: 7, name: "Lumen Field", city: "Seattle", capacity: 68740 },
  { id: 8, name: "Levi's Stadium", city: "Santa Clara", capacity: 68500 },
  { id: 9, name: "Gillette Stadium", city: "Foxborough", capacity: 65878 },
  { id: 10, name: "Hard Rock Stadium", city: "Miami Gardens", capacity: 65326 },
  { id: 11, name: "Mercedes-Benz Stadium", city: "Atlanta", capacity: 71000 },
  { id: 12, name: "BC Place", city: "Vancouver", capacity: 54500 },
  { id: 13, name: "BMO Field", city: "Toronto", capacity: 30991 },
  { id: 14, name: "Estadio Azteca", city: "Mexico City", capacity: 87523 },
  { id: 15, name: "Estadio BBVA", city: "Monterrey", capacity: 53500 },
  { id: 16, name: "Estadio Akron", city: "Guadalajara", capacity: 46232 },
];

export const TEAMS_FALLBACK: Team[] = [
  { id: 1, name: "Argentina", country: "Argentina", flagUrl: flagUrl("Argentina"), fifaRanking: 2 },
  { id: 2, name: "Brazil", country: "Brazil", flagUrl: flagUrl("Brazil"), fifaRanking: 5 },
  { id: 3, name: "France", country: "France", flagUrl: flagUrl("France"), fifaRanking: 3 },
  { id: 4, name: "Spain", country: "Spain", flagUrl: flagUrl("Spain"), fifaRanking: 1 },
  { id: 5, name: "England", country: "England", flagUrl: flagUrl("England"), fifaRanking: 6 },
  { id: 6, name: "Portugal", country: "Portugal", flagUrl: flagUrl("Portugal"), fifaRanking: 8 },
  { id: 7, name: "Netherlands", country: "Netherlands", flagUrl: flagUrl("Netherlands"), fifaRanking: 7 },
  { id: 8, name: "Belgium", country: "Belgium", flagUrl: flagUrl("Belgium"), fifaRanking: 9 },
  { id: 9, name: "Germany", country: "Germany", flagUrl: flagUrl("Germany"), fifaRanking: 11 },
  { id: 10, name: "Croatia", country: "Croatia", flagUrl: flagUrl("Croatia"), fifaRanking: 14 },
  { id: 11, name: "Italy", country: "Italy", flagUrl: flagUrl("Italy"), fifaRanking: 10 },
  { id: 12, name: "Uruguay", country: "Uruguay", flagUrl: flagUrl("Uruguay"), fifaRanking: 16 },
  { id: 13, name: "Colombia", country: "Colombia", flagUrl: flagUrl("Colombia"), fifaRanking: 15 },
  { id: 14, name: "Morocco", country: "Morocco", flagUrl: flagUrl("Morocco"), fifaRanking: 13 },
  { id: 15, name: "Senegal", country: "Senegal", flagUrl: flagUrl("Senegal"), fifaRanking: 19 },
  { id: 16, name: "USA", country: "USA", flagUrl: flagUrl("USA"), fifaRanking: 24 },
  { id: 17, name: "Mexico", country: "Mexico", flagUrl: flagUrl("Mexico"), fifaRanking: 18 },
  { id: 18, name: "Canada", country: "Canada", flagUrl: flagUrl("Canada"), fifaRanking: 31 },
  { id: 19, name: "Japan", country: "Japan", flagUrl: flagUrl("Japan"), fifaRanking: 22 },
  { id: 20, name: "South Korea", country: "South Korea", flagUrl: flagUrl("South Korea"), fifaRanking: 23 },
  { id: 21, name: "Australia", country: "Australia", flagUrl: flagUrl("Australia"), fifaRanking: 29 },
  { id: 22, name: "Iran", country: "Iran", flagUrl: flagUrl("Iran"), fifaRanking: 21 },
  { id: 23, name: "Saudi Arabia", country: "Saudi Arabia", flagUrl: flagUrl("Saudi Arabia"), fifaRanking: 60 },
  { id: 24, name: "Switzerland", country: "Switzerland", flagUrl: flagUrl("Switzerland"), fifaRanking: 20 },
  { id: 25, name: "Denmark", country: "Denmark", flagUrl: flagUrl("Denmark"), fifaRanking: 26 },
  { id: 26, name: "Austria", country: "Austria", flagUrl: flagUrl("Austria"), fifaRanking: 25 },
  { id: 27, name: "Norway", country: "Norway", flagUrl: flagUrl("Norway"), fifaRanking: 30 },
  { id: 28, name: "Turkey", country: "Turkey", flagUrl: flagUrl("Turkey"), fifaRanking: 28 },
  { id: 29, name: "Poland", country: "Poland", flagUrl: flagUrl("Poland"), fifaRanking: 27 },
  { id: 30, name: "Côte d'Ivoire", country: "Côte d'Ivoire", flagUrl: flagUrl("Côte d'Ivoire"), fifaRanking: 41 },
  { id: 31, name: "Egypt", country: "Egypt", flagUrl: flagUrl("Egypt"), fifaRanking: 33 },
  { id: 32, name: "Cameroon", country: "Cameroon", flagUrl: flagUrl("Cameroon"), fifaRanking: 49 },
  { id: 33, name: "Algeria", country: "Algeria", flagUrl: flagUrl("Algeria"), fifaRanking: 35 },
  { id: 34, name: "Tunisia", country: "Tunisia", flagUrl: flagUrl("Tunisia"), fifaRanking: 36 },
  { id: 35, name: "Ghana", country: "Ghana", flagUrl: flagUrl("Ghana"), fifaRanking: 70 },
  { id: 36, name: "Nigeria", country: "Nigeria", flagUrl: flagUrl("Nigeria"), fifaRanking: 38 },
  { id: 37, name: "Mali", country: "Mali", flagUrl: flagUrl("Mali"), fifaRanking: 47 },
  { id: 38, name: "DR Congo", country: "DR Congo", flagUrl: flagUrl("DR Congo"), fifaRanking: 56 },
  { id: 39, name: "New Zealand", country: "New Zealand", flagUrl: flagUrl("New Zealand"), fifaRanking: 86 },
  { id: 40, name: "Panama", country: "Panama", flagUrl: flagUrl("Panama"), fifaRanking: 39 },
  { id: 41, name: "Costa Rica", country: "Costa Rica", flagUrl: flagUrl("Costa Rica"), fifaRanking: 50 },
  { id: 42, name: "Jamaica", country: "Jamaica", flagUrl: flagUrl("Jamaica"), fifaRanking: 62 },
  { id: 43, name: "Honduras", country: "Honduras", flagUrl: flagUrl("Honduras"), fifaRanking: 75 },
  { id: 44, name: "Ecuador", country: "Ecuador", flagUrl: flagUrl("Ecuador"), fifaRanking: 23 },
  { id: 45, name: "Paraguay", country: "Paraguay", flagUrl: flagUrl("Paraguay"), fifaRanking: 51 },
  { id: 46, name: "Chile", country: "Chile", flagUrl: flagUrl("Chile"), fifaRanking: 55 },
  { id: 47, name: "Peru", country: "Peru", flagUrl: flagUrl("Peru"), fifaRanking: 40 },
  { id: 48, name: "Bolivia", country: "Bolivia", flagUrl: flagUrl("Bolivia"), fifaRanking: 85 },
];

export const GROUPS_FALLBACK: Record<string, Team[]> = {
  A: [TEAMS_FALLBACK[15], TEAMS_FALLBACK[16], TEAMS_FALLBACK[39], TEAMS_FALLBACK[17]],
  B: [TEAMS_FALLBACK[14], TEAMS_FALLBACK[47], TEAMS_FALLBACK[4], TEAMS_FALLBACK[19]],
  C: [TEAMS_FALLBACK[24], TEAMS_FALLBACK[31], TEAMS_FALLBACK[29], TEAMS_FALLBACK[34]],
  D: [TEAMS_FALLBACK[11], TEAMS_FALLBACK[2], TEAMS_FALLBACK[26], TEAMS_FALLBACK[30]],
  E: [TEAMS_FALLBACK[0], TEAMS_FALLBACK[3], TEAMS_FALLBACK[1], TEAMS_FALLBACK[8]],
  F: [TEAMS_FALLBACK[20], TEAMS_FALLBACK[44], TEAMS_FALLBACK[18], TEAMS_FALLBACK[10]],
  G: [TEAMS_FALLBACK[21], TEAMS_FALLBACK[38], TEAMS_FALLBACK[9], TEAMS_FALLBACK[33]],
  H: [TEAMS_FALLBACK[37], TEAMS_FALLBACK[25], TEAMS_FALLBACK[6], TEAMS_FALLBACK[43]],
  I: [TEAMS_FALLBACK[40], TEAMS_FALLBACK[5], TEAMS_FALLBACK[28], TEAMS_FALLBACK[42]],
  J: [TEAMS_FALLBACK[41], TEAMS_FALLBACK[22], TEAMS_FALLBACK[7], TEAMS_FALLBACK[45]],
  K: [TEAMS_FALLBACK[36], TEAMS_FALLBACK[12], TEAMS_FALLBACK[13], TEAMS_FALLBACK[46]],
  L: [TEAMS_FALLBACK[27], TEAMS_FALLBACK[35], TEAMS_FALLBACK[32], TEAMS_FALLBACK[23]],
};

function teamById(id: number): Team {
  return TEAMS_FALLBACK.find((t) => t.id === id) ?? TEAMS_FALLBACK[0];
}

function stadiumById(id: number): Stadium | null {
  return STADIUMS_FALLBACK.find((s) => s.id === id) ?? null;
}

export function buildMatchesFallback(): Match[] {
  const matches: Match[] = [];
  let id = 1;
  const baseDate = Date.UTC(2026, 5, 11, 15, 0, 0);

  Object.entries(GROUPS_FALLBACK).forEach(([group, teams]) => {
    const t = teams.map((x) => x.id);
    for (let i = 0; i < t.length; i += 1) {
      for (let j = i + 1; j < t.length; j += 1) {
        const h = t[i];
        const a = t[j];
        const offsetDays = hashString(`${group}-${h}-${a}`) % 30;
        const hour = 15 + ((i + j) % 3) * 3;
        const dateTime = new Date(baseDate + offsetDays * 86400000);
        dateTime.setUTCHours(hour, 0, 0, 0);
        const stadiumId = 1 + (hashString(`${group}${h}${a}`) % STADIUMS_FALLBACK.length);
        matches.push({
          id,
          homeTeam: teamById(h),
          awayTeam: teamById(a),
          dateTime: dateTime.toISOString(),
          groupName: group,
          stage: "GROUP",
          homeScore: null,
          awayScore: null,
          stadium: stadiumById(stadiumId),
          attendance: null,
          referee: null,
          status: dateTime.getTime() < Date.now() ? "FINISHED" : "SCHEDULED",
          goals: [],
          manOfTheMatch: null,
        });
        id += 1;
      }
    }
  });
  return matches;
}

export const MATCHES_FALLBACK: Match[] = buildMatchesFallback();

export const PLAYERS_FALLBACK: Player[] = TEAMS_FALLBACK.slice(0, 16).flatMap((team, idx) => [
  {
    id: team.id * 10 + 1,
    name: `${team.name.split(" ")[0]} Captain`,
    teamId: team.id,
    teamName: team.name,
    position: "MIDFIELDER",
    shirtNumber: 8,
    nationality: team.country,
    dateOfBirth: "1992-01-01",
    club: team.name,
    photoUrl: null,
  },
  {
    id: team.id * 10 + 2,
    name: `${team.name.split(" ")[0]} Striker`,
    teamId: team.id,
    teamName: team.name,
    position: "FORWARD",
    shirtNumber: 9,
    nationality: team.country,
    dateOfBirth: "1995-01-01",
    club: team.name,
    photoUrl: null,
  },
]);
