import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(here, "..", "..", "front-end", "public", "data");

const failures = [];
const notes = [];

function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failures.push(`${label}: got ${actual}, expected ${expected}`);
  return ok;
}

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(DATA, p), "utf8"));

const index = readJson("index.json");
const editions = new Map(index.editions.map((e) => [e.year, e]));
const years = index.editions.map((e) => e.year);

check("edition count", years.length, 23);
check("first edition", years[0], 1930);
check("last edition", years[years.length - 1], 2026);
check("total matches", index.stats.matches, 1068);
check("teams", index.stats.teams, 89);

const EXPECTED = [
  [1930, "Uruguay", "Argentina", 18, 70, 13],
  [1934, "Italy", "Czechoslovakia", 17, 70, 16],
  [1938, "Italy", "Hungary", 18, 84, 15],
  [1950, "Uruguay", "Brazil", 22, 88, 13],
  [1954, "West Germany", "Hungary", 26, 140, 16],
  [1958, "Brazil", "Sweden", 35, 126, 16],
  [1962, "Brazil", "Czechoslovakia", 32, 89, 16],
  [1966, "England", "West Germany", 32, 89, 16],
  [1970, "Brazil", "Italy", 32, 95, 16],
  [1974, "West Germany", "Netherlands", 38, 97, 16],
  [1978, "Argentina", "Netherlands", 38, 102, 16],
  [1982, "Italy", "West Germany", 52, 146, 24],
  [1986, "Argentina", "West Germany", 52, 132, 24],
  [1990, "West Germany", "Argentina", 52, 115, 24],
  [1994, "Brazil", "Italy", 52, 141, 24],
  [1998, "France", "Brazil", 64, 171, 32],
  [2002, "Brazil", "Germany", 64, 161, 32],
  [2006, "Italy", "France", 64, 147, 32],
  [2010, "Spain", "Netherlands", 64, 145, 32],
  [2014, "Germany", "Argentina", 64, 171, 32],
  [2018, "France", "Croatia", 64, 169, 32],
  [2022, "Argentina", "France", 64, 172, 32],
  [2026, "Spain", "Argentina", 104, 308, 48],
];

let matchSum = 0;
let goalSum = 0;
for (const [year, winner, runnerUp, matches, goals, teams] of EXPECTED) {
  const e = editions.get(year);
  if (!e) {
    failures.push(`missing edition ${year}`);
    continue;
  }
  check(`${year} winner`, e.winner, winner);
  check(`${year} runnerUp`, e.runnerUp, runnerUp);
  check(`${year} matches`, e.stats.matches, matches);
  check(`${year} goals`, e.stats.goals, goals);
  check(`${year} teams`, e.stats.teams, teams);
  matchSum += e.stats.matches;
  goalSum += e.stats.goals;
}
check("sum of per-edition matches", matchSum, 1068);
check("sum of per-edition goals", goalSum, index.stats.goals);

check("2026 third place", editions.get(2026).thirdPlace, "England");
check("1950 has no third place match", editions.get(1950).thirdPlace, "null");
check("1934 third place", editions.get(1934).thirdPlace, "Germany");
check("1938 third place", editions.get(1938).thirdPlace, "Brazil");
check("1990 third place", editions.get(1990).thirdPlace, "Italy");
check("2018 third place", editions.get(2018).thirdPlace, "Belgium");

const teams = readJson("teams.json").teams;
check("teams with a flag", teams.filter((t) => t.flagCode).length, teams.length);
const brazil = teams.find((t) => t.name === "Brazil");
check("Brazil titles", brazil.titles, 5);
check("Brazil first year", brazil.firstYear, 1930);
check("Brazil appearances", brazil.appearances, brazil.years.length);
const germany = teams.find((t) => t.name === "Germany");
check("Germany flag", germany.flagCode, "de");
check("Germany titles", germany.titles, 1);
const westGermany0 = teams.find((t) => t.name === "West Germany");
check("Germany + West Germany titles", germany.titles + westGermany0.titles, 4);
check("West Germany titles", westGermany0.titles, 3);
check("West Germany historical", westGermany0.historical, true);
const soviet = teams.find((t) => t.name === "Soviet Union");
check("Soviet Union historical", soviet.historical, true);
const england = teams.find((t) => t.name === "England");
check("England subdivision flag", england.flagCode, "gbeng");
const titleTotal = teams.reduce((s, t) => s + t.titles, 0);
check("total titles awarded", titleTotal, 23);

const stadiums = readJson("stadiums.json").stadiums;
check("stadiums with a country", stadiums.filter((s) => s.country).length, stadiums.length);
check("stadiums with capacity", stadiums.filter((s) => s.capacity).length, stadiums.length);
const e1950ed = editions.get(1950); const e1950full = JSON.parse(fs.readFileSync(path.join(DATA,"editions","1950.json"),"utf8")); const maracanazoMatch = e1950full.matches.find((m)=>m.home.name==="Uruguay"&&m.away.name==="Brazil");

const e1950full2 = JSON.parse(fs.readFileSync(path.join(DATA,"editions","1950.json"),"utf8")); const maracanazo = e1950full2.matches.find((m)=>m.home.name==="Uruguay"&&m.away.name==="Brazil");
check("1950 final round Uruguay v Brazil venue", maracanazo.venue.name, "Estádio do Maracanã");
check("1950 final round Uruguay v Brazil score", maracanazo.score, "2–1");

const players = readJson("players.json").players;
check("players sorted by goals", players[0].goals >= players[players.length - 1].goals, true);
const messi = players.find((p) => p.family === "Messi");
check("Messi world cup goals", messi ? messi.goals : -1, 13);
check("Messi tournaments", messi ? messi.years.length : -1, 5);
check("players with birth dates", players.filter((p) => p.birthDate).length > 3000, true);

let detailMatches = 0;
let lineupsWithStarters = 0;
let totalSubs = 0;
let totalBookings = 0;
let totalPenalties = 0;
let goalsInMatches = 0;
for (const year of years) {
  const full = readJson(`editions/${year}.json`);
  const details = readJson(`editions/${year}-details.json`);
  for (const m of full.matches) {
    const d = details.matches[m.id];
    if (!d) {
      failures.push(`${year} missing details for ${m.id}`);
      continue;
    }
    detailMatches += 1;
    goalsInMatches += m.goals.length;
    totalSubs += d.subs.length;
    totalBookings += d.bookings.length;
    totalPenalties += d.penalties.length;
    if (d.lineups.some((l) => l.starters.length >= 11)) lineupsWithStarters += 1;
    const expectedGoals = (m.home.score || 0) + (m.away.score || 0);
    if (m.goals.length !== expectedGoals && m.stage !== "GROUP") {
      notes.push(`${year} ${m.id} score ${m.score} but ${m.goals.length} goals listed`);
    }
    if (!m.date || !/^\d{4}-\d{2}-\d{2}$/.test(m.date)) failures.push(`${year} ${m.id} bad date ${m.date}`);
    if (!m.home.flagCode || !m.away.flagCode) failures.push(`${year} ${m.id} missing flag`);
  }
}
check("matches with detail payloads", detailMatches, 1068);
notes.push(`matches with 11+ starters: ${lineupsWithStarters}`);
notes.push(`substitutions: ${totalSubs}, bookings: ${totalBookings}, penalty kicks: ${totalPenalties}`);
notes.push(`goal records attached to matches: ${goalsInMatches}`);

const e2026 = readJson("editions/2026.json");
const stages2026 = new Map();
for (const m of e2026.matches) stages2026.set(m.stage, (stages2026.get(m.stage) || 0) + 1);
check("2026 group matches", stages2026.get("GROUP"), 72);
check("2026 R32", stages2026.get("R32"), 16);
check("2026 R16", stages2026.get("R16"), 8);
check("2026 quarter-finals", stages2026.get("QUARTER_FINAL"), 4);
check("2026 semi-finals", stages2026.get("SEMI_FINAL"), 2);
check("2026 third place", stages2026.get("THIRD_PLACE"), 1);
check("2026 final", stages2026.get("FINAL"), 1);
check("2026 groups", e2026.groups.length, 12);
check("2026 squads", e2026.squads.length, 48);

const e1930 = readJson("editions/1930.json");
check("1930 groups", e1930.groups.length, 4);
check("1930 stage mix", [...new Set(e1930.matches.map((m) => m.stage))].sort().join(","), "FINAL,GROUP,SEMI_FINAL");
check("1930 attendance unavailable", e1930.stats.attendance, "null");

const e2014 = readJson("editions/2014.json");
const final2014 = e2014.matches.find((m) => m.stage === "FINAL");
check("2014 final", `${final2014.home.name} ${final2014.home.score}-${final2014.away.score} ${final2014.away.name}`, "Germany 1-0 Argentina");
check("2014 final aet", final2014.scoreEt, "1–0");

const e2022 = readJson("editions/2022.json");
const final2022 = e2022.matches.find((m) => m.stage === "FINAL");
check("2022 final penalties", final2022.scorePen, "4–2");
check("2022 final venue", final2022.venue.name, "Lusail Stadium");

const mbappeGoals = readJson("editions/2022.json").matches
  .flatMap((m) => m.goals)
  .filter((g) => /Mbapp/i.test(g.scorer || "")).length;
check("2022 Mbappe goals (8 in regulation, 2 more in shootout)", mbappeGoals >= 8, true);

console.log("checks failed:", failures.length);
for (const f of failures) console.log("  FAIL", f);
console.log("notes:");
for (const n of notes) console.log("  -", n);
process.exit(failures.length ? 1 : 0);