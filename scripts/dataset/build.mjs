import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "./lib/csv.mjs";
import { flagForCode, normalizeTeamName, TEAM_OVERRIDES, VENUE_OVERRIDES } from "./lib/flags.mjs";
import { loadFjelstul, loadOpenfootballYear, writeJson, OUT_DIR } from "./lib/sources.mjs";

const MEN_YEARS = [
  1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986,
  1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022,
];
const EXTRA_YEARS = [2026];
const ALL_YEARS = [...MEN_YEARS, ...EXTRA_YEARS];

const STAGE_MAP = new Map([
  ["group stage", "GROUP"],
  ["second group stage", "GROUP"],
  ["final round", "FINAL_ROUND"],
  ["round of 16", "R16"],
  ["round of 32", "R32"],
  ["quarter-finals", "QUARTER_FINAL"],
  ["semi-finals", "SEMI_FINAL"],
  ["third-place match", "THIRD_PLACE"],
  ["final", "FINAL"],
]);

function stageFromFj(fjStage, fjGroup) {
  const code = STAGE_MAP.get((fjStage || "").toLowerCase());
  if (code && code === "GROUP") {
    const round = (fjStage || "").toLowerCase().startsWith("second") ? 2 : 1;
    return { stage: "GROUP", group: fjGroup, round };
  }
  return { stage: code || "GROUP", group: fjGroup === "not applicable" ? null : fjGroup, round: null };
}

function stageFromOf(round) {
  const r = (round || "").toLowerCase();
  const groupMatch = r.match(/group\s+([a-z0-9]+)/);
  if (groupMatch) return { stage: "GROUP", group: `Group ${groupMatch[1].toUpperCase()}`, round: 1 };
  if (r.includes("round of 32")) return { stage: "R32", group: null, round: null };
  if (r.includes("round of 16")) return { stage: "R16", group: null, round: null };
  if (r.includes("quarter")) return { stage: "QUARTER_FINAL", group: null, round: null };
  if (r.includes("third") || r.includes("bronze") || r.includes("play-off for third"))
    return { stage: "THIRD_PLACE", group: null, round: null };
  if (r.includes("semi")) return { stage: "SEMI_FINAL", group: null, round: null };
  if (r.includes("final")) return { stage: "FINAL", group: null, round: null };
  return { stage: "GROUP", group: null, round: null };
}

const int = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const name = (given, family) => {
  const g = (given || "").trim();
  const f = (family || "").trim();
  if (g && f) return `${g} ${f}`;
  return g || f || null;
};

const isNameApplicable = (v) => !!v && v !== "not applicable";

function indexBy(rows, key) {
  const m = new Map();
  for (const r of rows) m.set(r[key], r);
  return m;
}

function groupBy(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

async function main() {
  const raw = await loadFjelstul();
  const read = (f) => parseCsv(raw[f]);
  const isMens = (r) => (r.tournament_name || "").includes("Men's");

  const teamsCsv = read("teams.csv");
  const stadiumsCsv = read("stadiums.csv");
  const playersCsv = read("players.csv");
  const matchesCsv = read("matches.csv").filter(isMens);
  const goalsCsv = read("goals.csv").filter(isMens);
  const squadsCsv = read("squads.csv").filter(isMens);
  const appsCsv = read("player_appearances.csv").filter(isMens);
  const bookingsCsv = read("bookings.csv").filter(isMens);
  const subsCsv = read("substitutions.csv").filter(isMens);
  const pensCsv = read("penalty_kicks.csv").filter(isMens);
  const refsCsv = read("referee_appearances.csv").filter(isMens);
  const groupsCsv = read("groups.csv").filter(isMens);
  const gStandCsv = read("group_standings.csv").filter(isMens);
  const fStandCsv = read("tournament_standings.csv").filter(isMens);
  const awardsCsv = read("award_winners.csv").filter(isMens);
  const tourCsv = read("tournaments.csv").filter(isMens);

  const teamById = indexBy(teamsCsv, "team_id");
  const mensTeamIds = new Set(
    teamsCsv.filter((t) => t.mens_team === "1").map((t) => t.team_id)
  );

  const teamByName = new Map();
  for (const t of teamsCsv) {
    if (!mensTeamIds.has(t.team_id)) continue;
    teamByName.set(normalizeTeamName(t.team_name).toLowerCase(), t);
  }

  const stadiumById = indexBy(stadiumsCsv, "stadium_id");

  const stadiumCanonical = new Map();
  const stadiumKey = (nm, city, country) =>
    `${(nm || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "")}|${(city || "").toLowerCase()}|${(country || "").toLowerCase()}`;

  for (const s of stadiumsCsv) {
    const key = stadiumKey(s.stadium_name, s.city_name, s.country_name);
    if (!stadiumCanonical.has(key)) {
      stadiumCanonical.set(key, {
        id: s.stadium_id,
        name: s.stadium_name,
        city: s.city_name,
        country: s.country_name,
        capacity: int(s.stadium_capacity),
        wiki: isNameApplicable(s.stadium_wikipedia_link) ? s.stadium_wikipedia_link : null,
        years: new Set(),
        matches: 0,
      });
    }
  }

  const editions = [];
  const perYear = new Map();
  for (const y of MEN_YEARS) {
    perYear.set(y, {
      matches: matchesCsv.filter((m) => m.tournament_id === `WC-${y}`),
      goals: goalsCsv.filter((m) => m.tournament_id === `WC-${y}`),
      squads: squadsCsv.filter((m) => m.tournament_id === `WC-${y}`),
      apps: appsCsv.filter((m) => m.tournament_id === `WC-${y}`),
      bookings: bookingsCsv.filter((m) => m.tournament_id === `WC-${y}`),
      subs: subsCsv.filter((m) => m.tournament_id === `WC-${y}`),
      pens: pensCsv.filter((m) => m.tournament_id === `WC-${y}`),
      refs: refsCsv.filter((m) => m.tournament_id === `WC-${y}`),
      groups: groupsCsv.filter((m) => m.tournament_id === `WC-${y}`),
      gStand: gStandCsv.filter((m) => m.tournament_id === `WC-${y}`),
      fStand: fStandCsv.filter((m) => m.tournament_id === `WC-${y}`),
      awards: awardsCsv.filter((m) => m.tournament_id === `WC-${y}`),
      tour: tourCsv.find((m) => m.tournament_id === `WC-${y}`) || null,
    });
  }

  const matchesById = new Map();
  const goalsByMatch = groupBy(goalsCsv, (g) => g.match_id);
  const appsByMatch = groupBy(appsCsv, (a) => a.match_id);
  const bookingsByMatch = groupBy(bookingsCsv, (b) => b.match_id);
  const subsByMatch = groupBy(subsCsv, (s) => s.match_id);
  const pensByMatch = groupBy(pensCsv, (p) => p.match_id);
  const refsByMatch = new Map();
  for (const r of refsCsv) {
    if (!refsByMatch.has(r.match_id)) refsByMatch.set(r.match_id, r);
  }

  const ofByYear = new Map();
  for (const y of MEN_YEARS) {
    try {
      ofByYear.set(y, await loadOpenfootballYear(y));
    } catch {
      ofByYear.set(y, null);
    }
  }
  let of2026 = null;
  try {
    of2026 = await loadOpenfootballYear(2026);
  } catch {
    of2026 = null;
  }
  if (!of2026) throw new Error("openfootball 2026 data unavailable");

  const attendanceIndex = new Map();
  const ofMatchIndex = new Map();
  for (const y of ALL_YEARS) {
    const doc = y === 2026 ? of2026 : ofByYear.get(y);
    if (!doc) continue;
    for (const m of doc.matches || []) {
      const key = `${m.date}|${normalizeTeamName(m.team1).toLowerCase()}|${normalizeTeamName(m.team2).toLowerCase()}`;
      ofMatchIndex.set(key, m);
      if (m.attendance) {
        attendanceIndex.set(
          key,
          { attendance: int(m.attendance), referee: (m.referees || [])[0] || null }
        );
      }
    }
  }

  const teamRefs = new Map();
  function teamRef(teamId, fallbackName, fallbackCode) {
    const t = teamById.get(teamId);
    const nm = t ? t.team_name : fallbackName;
    const code = t ? t.team_code : fallbackCode;
    const id = t ? t.team_id : `X-${normalizeTeamName(nm)}`;
    if (!teamRefs.has(id)) {
      const flag = flagForCode(code, nm);
      teamRefs.set(id, {
        id,
        name: nm,
        code: code || null,
        confederation: t ? (t.confederation_code || confedShort(t.confederation_name)) : null,
        region: t ? t.region_name : null,
        flagCode: flag ? flag.flagCode : null,
        historical: flag ? !!flag.historical : false,
        formerName: flag && flag.formerName ? flag.formerName : null,
      });
    }
    return teamRefs.get(id);
  }

  function confedShort(full) {
    if (!full) return null;
    const f = String(full).toLowerCase();
    if (f.includes("african")) return "CAF";
    if (f.includes("american")) return "CONCACAF";
    if (f.includes("south american")) return "CONMEBOL";
    if (f.includes("asian")) return "AFC";
    if (f.includes("oceania")) return "OFC";
    if (f.includes("european")) return "UEFA";
    return null;
  }

  function playerRef(playerId, given, family) {
    return {
      id: playerId || null,
      name: name(given, family),
      given: given || null,
      family: family || null,
    };
  }

  const aggregate = new Map();
  for (const y of MEN_YEARS) {
    const d = perYear.get(y);
    for (const a of d.apps) {
      if (!a.player_id) continue;
      if (!aggregate.has(a.player_id)) {
        aggregate.set(a.player_id, {
          id: a.player_id,
          name: name(a.given_name, a.family_name),
          given: a.given_name || null,
          family: a.family_name || null,
          years: new Set(),
          teams: new Set(),
          starts: 0,
          apps: 0,
          goals: 0,
          positions: new Set(),
        });
      }
      const rec = aggregate.get(a.player_id);
      rec.years.add(y);
      rec.teams.add(a.team_name);
      rec.apps += 1;
      if (a.starter === "1") rec.starts += 1;
      if (a.position_code) rec.positions.add(a.position_code);
    }
    for (const g of d.goals) {
      if (!g.player_id) continue;
      const rec = aggregate.get(g.player_id);
      if (rec) rec.goals += 1;
    }
  }

  const playerById = indexBy(playersCsv, "player_id");

  const squadTournamentYears = new Map();
  for (const s of squadsCsv) {
    if (!s.player_id) continue;
    const y = parseInt((s.tournament_id || "").slice(3), 10);
    if (!Number.isFinite(y)) continue;
    const key = `${s.player_id}|${y}`;
    if (!squadTournamentYears.has(key)) squadTournamentYears.set(key, true);
  }

  for (const y of MEN_YEARS) {
    const d = perYear.get(y);
    const tour = d.tour;
    const matchList = d.matches
      .slice()
      .sort((a, b) => (a.match_date < b.match_date ? -1 : a.match_date > b.match_date ? 1 : a.match_id.localeCompare(b.match_id)))
      .map((m) => {
        const key = `${m.match_date}|${normalizeTeamName(m.home_team_name).toLowerCase()}|${normalizeTeamName(m.away_team_name).toLowerCase()}`;
        const of = ofMatchIndex.get(key) || null;
        const ofAttendance = attendanceIndex.get(key) || null;
        const stageInfo = stageFromFj(m.stage_name, m.group_name);
        const home = teamRef(m.home_team_id, m.home_team_name, m.home_team_code);
        const away = teamRef(m.away_team_id, m.away_team_name, m.away_team_code);
        const venueSrc = stadiumById.get(m.stadium_id);
        let venue = null;
        if (venueSrc) {
          const vkey = stadiumKey(venueSrc.stadium_name, venueSrc.city_name, venueSrc.country_name);
          const canon = stadiumCanonical.get(vkey);
          if (canon) {
            canon.years.add(y);
            canon.matches += 1;
            venue = canon;
          }
        }
        const refRow = refsByMatch.get(m.match_id);
        const goals = (goalsByMatch.get(m.match_id) || [])
          .slice()
          .sort((a, b) => {
            const am = int(a.minute_regulation) ?? 999;
            const bm = int(b.minute_regulation) ?? 999;
            return am - bm;
          })
          .map((g) => ({
            teamId: g.team_id,
            team: g.team_name,
            playerId: g.player_id || null,
            scorer: name(g.given_name, g.family_name),
            minute: int(g.minute_regulation),
            minuteLabel: g.minute_label || null,
            stoppage: int(g.minute_stoppage),
            period: g.match_period || null,
            ownGoal: g.own_goal === "1",
            penalty: g.penalty === "1",
          }));

        return {
          id: m.match_id,
          year: y,
          date: m.match_date,
          time: m.match_time || null,
          stage: stageInfo.stage,
          group: stageInfo.group,
          round: stageInfo.round,
          stageLabel: m.stage_name || null,
          replayed: m.replayed === "1",
          replayOf: m.replay === "1" ? m.match_id : null,
          home: { ...home, score: int(m.home_team_score) },
          away: { ...away, score: int(m.away_team_score) },
          score: m.score || null,
          scoreRegularTime:
            m.extra_time === "1"
              ? `${m.home_team_score}–${m.away_team_score}`
              : null,
          scoreEt:
            m.extra_time === "1" ? `${m.home_team_score}–${m.away_team_score}` : null,
          scorePen: m.penalty_shootout === "1" ? m.score_penalties : null,
          decidedAfterExtraTime: m.extra_time === "1",
          decidedByPenalties: m.penalty_shootout === "1",
          result: m.result || null,
          venue: venue ? { stadiumId: venue.id, name: venue.name, city: venue.city, country: venue.country } : null,
          attendance: ofAttendance ? ofAttendance.attendance : null,
          referee: refRow
            ? { name: name(refRow.given_name, refRow.family_name), country: refRow.country_name || null }
            : ofAttendance && ofAttendance.referee
              ? { name: ofAttendance.referee.name || null, country: ofAttendance.referee.country || null }
              : null,
          goals,
        };
      });

    const details = {};
    for (const m of matchList) {
      const lineups = {};
      for (const a of appsByMatch.get(m.id) || []) {
        if (!lineups[a.team_id]) {
          lineups[a.team_id] = { teamId: a.team_id, team: a.team_name, starters: [], bench: [] };
        }
        const entry = {
          playerId: a.player_id || null,
          name: name(a.given_name, a.family_name),
          shirt: int(a.shirt_number),
          position: a.position_code || null,
        };
        if (a.starter === "1") lineups[a.team_id].starters.push(entry);
        else lineups[a.team_id].bench.push(entry);
      }
      const subs = (subsByMatch.get(m.id) || []).map((s) => ({
        teamId: s.team_id,
        team: s.team_name,
        minute: int(s.minute_regulation),
        minuteLabel: s.minute_label || null,
        on: name(s.coming_on, "") || null,
        off: name(s.going_off, "") || null,
        onId: null,
        playerId: s.player_id || null,
      }));
      const bookings = (bookingsByMatch.get(m.id) || []).map((b) => ({
        teamId: b.team_id,
        team: b.team_name,
        playerId: b.player_id || null,
        player: name(b.given_name, b.family_name),
        shirt: int(b.shirt_number),
        minute: int(b.minute_regulation),
        minuteLabel: b.minute_label || null,
        yellow: b.yellow_card === "1",
        red: b.red_card === "1",
        secondYellow: b.second_yellow_card === "1",
        sendingOff: b.sending_off === "1",
      }));
      const penalties = (pensByMatch.get(m.id) || []).map((p) => ({
        teamId: p.team_id,
        team: p.team_name,
        playerId: p.player_id || null,
        player: name(p.given_name, p.family_name),
        shirt: int(p.shirt_number),
        minute: int(p.minute_regulation),
        converted: p.converted === "1",
      }));
      details[m.id] = {
        lineups: Object.values(lineups),
        subs,
        bookings,
        penalties,
      };
    }

    const groups = d.groups.map((g) => {
      const rows = d.gStand.filter(
        (s) => s.group_name === g.group_name && s.stage_name === g.stage_name
      );
      return {
        name: g.group_name,
        round: (g.stage_name || "").toLowerCase().startsWith("second") ? 2 : 1,
        teamCount: int(g.count_teams),
        table: rows
          .slice()
          .sort((a, b) => int(a.position) - int(b.position))
          .map((r) => {
            const t = teamRef(r.team_id, r.team_name, r.team_code);
            return {
              ...t,
              position: int(r.position),
              played: int(r.played),
              wins: int(r.wins),
              draws: int(r.draws),
              losses: int(r.losses),
              goalsFor: int(r.goals_for),
              goalsAgainst: int(r.goals_against),
              goalDifference: int(r.goal_difference),
              points: int(r.points),
              advanced: r.advanced === "1",
            };
          }),
      };
    });

    const squads = [];
    const byTeam = groupBy(d.squads, (s) => s.team_id);
    for (const [tid, rows] of byTeam) {
      const first = rows[0];
      const t = teamRef(tid, first.team_name, first.team_code);
      squads.push({
        ...t,
        players: rows
          .slice()
          .sort((a, b) => (int(a.shirt_number) ?? 99) - (int(b.shirt_number) ?? 99))
          .map((s) => ({
            playerId: s.player_id || null,
            name: name(s.given_name, s.family_name),
            shirt: int(s.shirt_number),
            position: s.position_code || null,
            positionName: s.position_name || null,
          })),
      });
    }

    const awards = d.awards.map((a) => {
      const t = a.team_id ? teamRef(a.team_id, a.team_name, a.team_code) : null;
      return {
        award: a.award_name,
        playerId: a.player_id || null,
        player: name(a.given_name, a.family_name),
        teamId: t ? t.id : null,
        team: t ? t.name : a.team_name || null,
        shared: a.shared === "1",
      };
    });

    const finalTable = d.fStand
      .slice()
      .sort((a, b) => int(a.position) - int(b.position))
      .map((r, i) => {
        const t = teamRef(r.team_id, r.team_name, r.team_code);
        return { ...t, position: int(r.position) || i + 1 };
      });

    const goalsTotal = matchList.reduce((sum, m) => {
      return sum + (m.home.score || 0) + (m.away.score || 0);
    }, 0);
    const attendanceTotal = matchList.reduce((s, m) => s + (m.attendance || 0), 0);
    const goldenBoot = awards.find((a) => a.award === "Golden Boot") || null;

    const winnerName = tour ? tour.winner : null;
    const runnerUp = finalTable.find((r) => r.position === 2) || null;

    const edition = {
      year: y,
      id: `WC-${y}`,
      name: tour ? tour.tournament_name : `${y} FIFA World Cup`,
      host: tour ? tour.host_country : null,
      startDate: tour ? tour.start_date : null,
      endDate: tour ? tour.end_date : null,
      winner: winnerName,
      runnerUp: runnerUp ? runnerUp.name : null,
      thirdPlace: (() => {
        const tp = matchList.find((m) => m.stage === "THIRD_PLACE");
        if (!tp || tp.home.score === null || tp.away.score === null) return null;
        return tp.home.score > tp.away.score ? tp.home.name : tp.away.name;
      })(),
      topScorer: goldenBoot ? { name: goldenBoot.player, goals: null, team: goldenBoot.team, playerId: goldenBoot.playerId } : null,
      stats: {
        matches: matchList.length,
        goals: goalsTotal,
        teams: new Set(matchList.flatMap((m) => [m.home.id, m.away.id])).size,
        stadiums: new Set(matchList.filter((m) => m.venue).map((m) => m.venue.stadiumId)).size,
        attendance: attendanceTotal || null,
        averageAttendance: matchList.filter((m) => m.attendance).length
          ? Math.round(attendanceTotal / matchList.filter((m) => m.attendance).length)
          : null,
      },
      groups,
      finalTable,
      squads,
      awards,
      matches: matchList,
    };

    editions.push(edition);
    matchesById.set(y, { edition, details });
  }

  const y2026 = build2026(of2026, { teamRef, teamRefs, stadiumCanonical, stadiumKey, stadiumById });
  editions.push(y2026.edition);
  matchesById.set(2026, y2026);

  editions.sort((a, b) => a.year - b.year);

  const teams = [...teamRefs.values()].map((t) => t);
  const teamsOutRef = new Map(teams.map((t) => [t.name, t]));
  const playerList = [...aggregate.values()]
    .map((p) => {
      const meta = playerById.get(p.id);
      return {
        id: p.id,
        name: p.name,
        given: p.given,
        family: p.family,
        birthDate: meta && isNameApplicable(meta.birth_date) ? meta.birth_date : null,
        positions: [...p.positions].sort(),
        years: [...p.years].sort((a, b) => a - b),
        teams: [...p.teams].sort(),
        appearances: p.apps,
        starts: p.starts,
        goals: p.goals,
        wiki: meta && isNameApplicable(meta.player_wikipedia_link) ? meta.player_wikipedia_link : null,
      };
    })
    .sort((a, b) => b.goals - a.goals || b.appearances - a.appearances);

  const stadiums = [...stadiumCanonical.values()]
    .map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      country: s.country,
      capacity: s.capacity,
      years: [...s.years].sort((a, b) => a - b),
      matches: s.matches,
      wiki: s.wiki,
    }))
    .sort((a, b) => b.matches - a.matches || (b.capacity || 0) - (a.capacity || 0));

  const titlesByTeam = new Map();
  const bestByTeam = new Map();
  for (const e of editions) {
    const ft = e.finalTable || [];
    const champ = ft.find((r) => r.position === 1);
    if (champ) {
      titlesByTeam.set(champ.id, (titlesByTeam.get(champ.id) || 0) + 1);
    } else if (e.winner) {
      const w = teamsOutRef.get(e.winner);
      if (w) titlesByTeam.set(w.id, (titlesByTeam.get(w.id) || 0) + 1);
    }
    ft.forEach((r) => {
      const prev = bestByTeam.get(r.id);
      if (!prev || r.position < prev) bestByTeam.set(r.id, r.position);
    });
    if (!ft.length && e.winner) {
      const w = teamsOutRef.get(e.winner);
      if (w) bestByTeam.set(w.id, 1);
    }
    if (!ft.length && e.runnerUp) {
      const ru = teamsOutRef.get(e.runnerUp);
      if (ru && !bestByTeam.has(ru.id)) bestByTeam.set(ru.id, 2);
    }
  }

  const appearancesByTeam = new Map();
  for (const e of editions) {
    const seen = new Set();
    for (const m of e.matches) {
      for (const side of [m.home, m.away]) {
        if (seen.has(side.id)) continue;
        seen.add(side.id);
        const list = appearancesByTeam.get(side.id) || [];
        list.push(e.year);
        appearancesByTeam.set(side.id, list);
      }
    }
  }

  const teamsOut = teams.map((t) => {
    const years = appearancesByTeam.get(t.id) || [];
    const sortedYears = [...new Set(years)].sort((a, b) => a - b);
    return {
      ...t,
      titles: titlesByTeam.get(t.id) || 0,
      bestFinish: bestByTeam.get(t.id) || null,
      appearances: sortedYears.length,
      years: sortedYears,
      firstYear: sortedYears[0] || null,
      lastYear: sortedYears[sortedYears.length - 1] || null,
    };
  }).sort((a, b) => b.titles - a.titles || b.appearances - a.appearances || a.name.localeCompare(b.name));

  const totals = editions.reduce(
    (acc, e) => {
      acc.matches += e.stats.matches;
      acc.goals += e.stats.goals;
      return acc;
    },
    { matches: 0, goals: 0 }
  );

  const index = {
    generated: new Date().toISOString().slice(0, 10),
    sources: {
      matches: "openfootball/worldcup.json",
      players: "Fjelstul World Cup Database (2022)",
    },
    coverage: { from: 1930, to: 2026, editions: editions.length },
    stats: {
      matches: totals.matches,
      goals: totals.goals,
      teams: teamsOut.length,
      stadiums: stadiums.length,
      players: playerList.length,
      goalsPerMatch: Number((totals.goals / totals.matches).toFixed(2)),
    },
    editions: editions.map((e) => ({
      year: e.year,
      id: e.id,
      name: e.name,
      host: e.host,
      winner: e.winner,
      runnerUp: e.runnerUp,
      thirdPlace: e.thirdPlace,
      topScorer: e.topScorer,
      startDate: e.startDate,
      endDate: e.endDate,
      stats: e.stats,
    })),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  await writeJson("index.json", index);
  await writeJson("teams.json", { teams: teamsOut });
  await writeJson("stadiums.json", { stadiums });
  await writeJson("players.json", { players: playerList });

  for (const [year, payload] of matchesById) {
    await writeJson(`editions/${year}.json`, payload.edition);
    await writeJson(`editions/${year}-details.json`, { year, matches: payload.details });
  }

  const report = {
    editions: editions.length,
    matches: totals.matches,
    goals: totals.goals,
    teams: teamsOut.length,
    stadiums: stadiums.length,
    players: playerList.length,
    perYear: editions.map((e) => `${e.year}: ${e.stats.matches}m ${e.stats.goals}g ${e.stats.teams}t ${e.host || "?"} winner=${e.winner}`),
    missingFlags: teamsOut.filter((t) => !t.flagCode).map((t) => `${t.name}(${t.code})`),
    stadiumsWithoutCapacity: stadiums.filter((s) => !s.capacity).length,
    editionsWithoutAttendance: editions.filter((e) => !e.stats.attendance).map((e) => e.year),
  };
  console.log(JSON.stringify(report, null, 2));
}

function build2026(of, { teamRef, teamRefs, stadiumCanonical, stadiumKey }) {
  const y = 2026;
  const matches = [];
  const details = {};

  const resolveTeam = (nameStr) => {
    const key = normalizeTeamName(nameStr).toLowerCase();
    for (const t of teamRefs.values()) {
      if (t.name.toLowerCase() === normalizeTeamName(nameStr).toLowerCase()) return t;
    }
    const override = TEAM_OVERRIDES[key];
    const syntheticId = `X-${key.replace(/[^a-z0-9]+/g, "-")}`;
    const ref = teamRef(syntheticId, nameStr, override ? override.code : null);
    if (override) {
      ref.confederation = override.confederation;
      ref.region = override.region;
      ref.flagCode = override.flagCode;
      ref.historical = false;
      ref.formerName = null;
    }
    return ref;
  };

  for (const m of of.matches || []) {
    const stageInfo = stageFromOf(m.round);
    const home = resolveTeam(m.team1);
    const away = resolveTeam(m.team2);
    const deciding = (m.score && (m.score.et || m.score.ft)) || null;
    const regularTime = (m.score && m.score.ft) || null;
    const score = deciding ? `${deciding[0]}–${deciding[1]}` : null;
    const et = m.score && m.score.et ? `${m.score.et[0]}–${m.score.et[1]}` : null;
    const pen = m.score && m.score.p ? `${m.score.p[0]}–${m.score.p[1]}` : null;

    let venue = null;
    if (m.ground) {
      const parts = String(m.ground).split(",").map((s) => s.trim());
      const rawName = parts[0];
      const rawCity = parts.slice(1).join(", ") || null;
      const override =
        VENUE_OVERRIDES[rawName.toLowerCase().replace(/[^a-z0-9/]+/g, " ").trim()] || null;
      const stadiumName = override ? override.name : rawName;
      const city = override ? override.city : rawCity;
      const country = override ? override.country : null;
      const vkey = stadiumKey(stadiumName, city, country);
      if (!stadiumCanonical.has(vkey)) {
        stadiumCanonical.set(vkey, {
          id: `S-2026-${vkey}`,
          name: stadiumName,
          city,
          country,
          capacity: override ? override.capacity : null,
          wiki: null,
          years: new Set(),
          matches: 0,
        });
      }
      const canon = stadiumCanonical.get(vkey);
      canon.years.add(y);
      canon.matches += 1;
      venue = canon;
    }

    const goals = [];
    (m.goals1 || []).forEach((g) =>
      goals.push({
        teamId: home.id,
        team: home.name,
        playerId: null,
        scorer: g.name || null,
        minute: parseMinute(g.minute),
        minuteLabel: g.minute ? `${g.minute}'` : null,
        stoppage: 0,
        period: null,
        ownGoal: !!g.own_goal,
        penalty: !!g.penalty,
      })
    );
    (m.goals2 || []).forEach((g) =>
      goals.push({
        teamId: away.id,
        team: away.name,
        playerId: null,
        scorer: g.name || null,
        minute: parseMinute(g.minute),
        minuteLabel: g.minute ? `${g.minute}'` : null,
        stoppage: 0,
        period: null,
        ownGoal: !!g.own_goal,
        penalty: !!g.penalty,
      })
    );
    goals.sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));

    const id = `M-${y}-${String(matches.length + 1).padStart(3, "0")}`;
    matches.push({
      id,
      year: y,
      date: m.date,
      time: m.time ? String(m.time).replace(/\s*UTC.*/, "") : null,
      stage: stageInfo.stage,
      group: stageInfo.group,
      round: stageInfo.round,
      stageLabel: m.round || null,
      replayed: false,
      replayOf: null,
      home: { ...home, score: deciding ? deciding[0] : null },
      away: { ...away, score: deciding ? deciding[1] : null },
      score,
      scoreRegularTime: regularTime ? `${regularTime[0]}–${regularTime[1]}` : null,
      scoreEt: et,
      scorePen: pen,
      decidedAfterExtraTime: !!et,
      decidedByPenalties: !!pen,
      result: deciding
        ? deciding[0] > deciding[1]
          ? "home team win"
          : deciding[0] < deciding[1]
            ? "away team win"
            : "draw"
        : null,
      venue: venue ? { stadiumId: venue.id, name: venue.name, city: venue.city, country: venue.country } : null,
      attendance: m.attendance ? int(m.attendance) : null,
      referee: (m.referees || [])[0]
        ? { name: m.referees[0].name || null, country: m.referees[0].country || null }
        : null,
      goals,
    });

    const lineups = [];
    (m.lineup || []).forEach((lu, idx) => {
      const team = idx === 0 ? home : away;
      lineups.push({
        teamId: team.id,
        team: team.name,
        starters: (lu.starter || []).map((p) => ({
          playerId: null,
          name: p.name || null,
          shirt: null,
          position: null,
          captain: !!p.captain,
        })),
        bench: (lu.bench || []).map((p) => ({
          playerId: null,
          name: p.name || null,
          shirt: null,
          position: null,
        })),
      });
    });

    const bookings = [];
    (m.bookings || []).forEach((side, idx) => {
      const team = idx === 0 ? home : away;
      (side || []).forEach((b) => {
        bookings.push({
          teamId: team.id,
          team: team.name,
          playerId: null,
          player: b.name || null,
          shirt: null,
          minute: parseMinute(b.minute),
          minuteLabel: b.minute ? `${b.minute}'` : null,
          yellow: b.type === "Y",
          red: b.type === "R" || b.type === "R2",
          secondYellow: b.type === "R2",
          sendingOff: b.type === "R" || b.type === "R2",
        });
      });
    });

    const subs = [];
    (m.lineup || []).forEach((lu, idx) => {
      const team = idx === 0 ? home : away;
      (lu.subs || []).forEach((s) => {
        subs.push({
          teamId: team.id,
          team: team.name,
          minute: parseMinute(s.minute),
          minuteLabel: s.minute ? `${s.minute}'` : null,
          on: s.on || null,
          off: s.off || null,
          onId: null,
          playerId: null,
        });
      });
    });

    details[id] = { lineups, subs, bookings, penalties: [] };
  }

  const squadsByTeam = new Map();
  for (const m of of.matches || []) {
    const sides = [m.team1, m.team2];
    const lineups = m.lineup || [];
    sides.forEach((sideName, idx) => {
      const t = resolveTeam(sideName);
      if (!squadsByTeam.has(t.id)) squadsByTeam.set(t.id, { team: t, names: new Set() });
      const lu = lineups[idx];
      if (!lu) return;
      (lu.starter || []).forEach((p) => p.name && squadsByTeam.get(t.id).names.add(p.name));
      (lu.bench || []).forEach((p) => p.name && squadsByTeam.get(t.id).names.add(p.name));
    });
  }

  const squads = [...squadsByTeam.entries()].map(([tid, v]) => ({
    ...v.team,
    players: [...v.names].sort().map((n) => ({
      playerId: null,
      name: n,
      shirt: null,
      position: null,
      positionName: null,
    })),
  }));

  const final = matches.find((m) => m.stage === "FINAL") || null;
  const third = matches.find((m) => m.stage === "THIRD_PLACE") || null;
  const winner = final ? (final.home.score > final.away.score ? final.home.name : final.away.name) : null;
  const runnerUp = final ? (final.home.score > final.away.score ? final.away.name : final.home.name) : null;
  const thirdPlace = third ? (third.home.score > third.away.score ? third.home.name : third.away.name) : null;

  const goalsByPlayer = new Map();
  for (const m of matches) {
    for (const g of m.goals) {
      if (!g.scorer) continue;
      const key = `${g.scorer}|${g.teamId}`;
      const rec = goalsByPlayer.get(key) || { scorer: g.scorer, team: g.team, goals: 0 };
      rec.goals += 1;
      goalsByPlayer.set(key, rec);
    }
  }
  const topScorerEntry = [...goalsByPlayer.values()].sort((a, b) => b.goals - a.goals)[0] || null;

  const groupsMap = new Map();
  for (const m of matches) {
    if (m.stage !== "GROUP" || !m.group) continue;
    if (!groupsMap.has(m.group)) groupsMap.set(m.group, new Map());
    const tbl = groupsMap.get(m.group);
    for (const side of [m.home, m.away]) {
      if (!tbl.has(side.id)) {
        tbl.set(side.id, { ...side, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
      }
      const row = tbl.get(side.id);
      row.played += 1;
      row.goalsFor += side.score || 0;
      row.goalsAgainst += side.id === m.home.id ? m.away.score || 0 : m.home.score || 0;
      const hs = m.home.score || 0;
      const as = m.away.score || 0;
      const isHome = side.id === m.home.id;
      if (hs > as) {
        if (isHome) row.wins += 1;
        else row.losses += 1;
      } else if (hs < as) {
        if (isHome) row.losses += 1;
        else row.wins += 1;
      } else row.draws += 1;
    }
  }
  for (const tbl of groupsMap.values()) {
    for (const row of tbl.values()) row.points = row.wins * 3 + row.draws;
  }

  const groups = [...groupsMap.entries()]
    .map(([gname, tbl]) => ({
      name: gname,
      round: 1,
      teamCount: tbl.size,
      table: [...tbl.values()]
        .sort((a, b) => b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) || a.name.localeCompare(b.name))
        .map((row, i) => ({
          ...row,
          position: i + 1,
          goalDifference: row.goalsFor - row.goalsAgainst,
          advanced: i < 2,
        })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const goalsTotal = matches.reduce((s, m) => s + (m.home.score || 0) + (m.away.score || 0), 0);
  const attendanceTotal = matches.reduce((s, m) => s + (m.attendance || 0), 0);
  const dates = matches.map((m) => m.date).sort();

  const edition = {
    year: y,
    id: `WC-${y}`,
    name: "2026 FIFA World Cup",
    host: "Canada, Mexico, United States",
    startDate: dates[0] || null,
    endDate: dates[dates.length - 1] || null,
    winner,
    runnerUp,
    thirdPlace,
    topScorer: topScorerEntry
      ? { name: topScorerEntry.scorer, goals: topScorerEntry.goals, team: topScorerEntry.team, playerId: null }
      : null,
    stats: {
      matches: matches.length,
      goals: goalsTotal,
      teams: new Set(matches.flatMap((m) => [m.home.id, m.away.id])).size,
      stadiums: new Set(matches.filter((m) => m.venue).map((m) => m.venue.stadiumId)).size,
      attendance: attendanceTotal || null,
      averageAttendance: matches.filter((m) => m.attendance).length
        ? Math.round(attendanceTotal / matches.filter((m) => m.attendance).length)
        : null,
    },
    groups,
    finalTable: [],
    squads,
    awards: [],
    matches,
  };

  return { edition, details };
}

function parseMinute(value) {
  if (value === null || value === undefined || value === "") return null;
  const m = String(value).match(/(\d+)/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});