/**
 * One-shot repair pass over the generated dataset in front-end/public/data.
 *
 *  1. Strips the "not applicable" placeholder that leaked out of the Fjelstul
 *     CSVs into player/scorer/award names.
 *  2. Fills `topScorer.goals` for the 1930-2022 editions by tallying the goals
 *     already recorded on each match (the builder only ever wrote the winner).
 *  3. Rewrites the 2026 edition: proper-cases the openfootball surnames,
 *     restores accents from players.json where a unique match exists, adds the
 *     official award list, the top-4 final table and normalised squad names.
 *  4. Re-syncs index.json with the repaired per-edition top scorer.
 *
 * Idempotent: safe to run more than once. Run with:
 *   node scripts/dataset/fix.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA_DIR = path.join(ROOT, "front-end", "public", "data");
const EDITIONS_DIR = path.join(DATA_DIR, "editions");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v), "utf8");

const NOT_APPLICABLE = /^\s*not applicable\s+/i;
const NOT_APPLICABLE_END = /\s+not applicable\s*$/i;

function cleanName(value) {
  if (typeof value !== "string") return value;
  let out = value.replace(NOT_APPLICABLE, "").replace(NOT_APPLICABLE_END, "");
  out = out.replace(/\s+/g, " ").trim();
  return out.length ? out : value.trim();
}

function walkStrings(node, fn) {
  if (typeof node === "string") return fn(node);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) node[i] = walkStrings(node[i], fn);
    return node;
  }
  if (node && typeof node === "object") {
    for (const key of Object.keys(node)) node[key] = walkStrings(node[key], fn);
    return node;
  }
  return node;
}

function stripNotApplicable(node) {
  return walkStrings(node, cleanName);
}

/** "Kylian MBAPPE" -> "Kylian Mbappe", "Vinicius Junior" untouched. */
function properCase(value) {
  if (typeof value !== "string" || !value) return value;
  return value
    .split(" ")
    .map((token) => {
      if (token.length > 1 && token === token.toUpperCase() && /[A-Z]/.test(token)) {
        return token.charAt(0) + token.slice(1).toLowerCase();
      }
      return token;
    })
    .join(" ");
}

const foldKey = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

function buildNameIndex(players) {
  const index = new Map();
  for (const p of players) {
    if (!p.name) continue;
    const key = foldKey(p.name);
    if (!key) continue;
    if (index.has(key)) index.set(key, null);
    else index.set(key, p.name);
  }
  return index;
}

function restoreAccents(name, index) {
  const hit = index.get(foldKey(name));
  return hit || name;
}

function tallyGoals(edition) {
  const byId = new Map();
  const byName = new Map();
  for (const m of edition.matches || []) {
    for (const g of m.goals || []) {
      if (g.ownGoal) continue;
      if (g.playerId) byId.set(g.playerId, (byId.get(g.playerId) || 0) + 1);
      const key = foldKey(g.scorer || "");
      if (key) byName.set(key, (byName.get(key) || 0) + 1);
    }
  }
  return { byId, byName };
}

function goalsForTopScorer(edition, topScorer) {
  if (!topScorer) return null;
  const { byId, byName } = tallyGoals(edition);
  if (topScorer.playerId && byId.has(topScorer.playerId)) return byId.get(topScorer.playerId);
  const key = foldKey(topScorer.name || "");
  if (key && byName.has(key)) return byName.get(key);
  return topScorer.goals ?? null;
}

/** Awards for the 2026 edition (FIFA announcement, 19 July 2026). */
const AWARDS_2026 = [
  ["Golden Ball", "Rodri", "Spain"],
  ["Silver Ball", "Lionel Messi", "Argentina"],
  ["Bronze Ball", "Kylian Mbappé", "France"],
  ["Golden Boot", "Kylian Mbappé", "France"],
  ["Silver Boot", "Lionel Messi", "Argentina"],
  ["Bronze Boot", "Jude Bellingham", "England"],
  ["Golden Glove", "Unai Simón", "Spain"],
  ["Best Young Player", "Pau Cubarsí", "Spain"],
];

function teamRefByName(edition, name) {
  const squad = (edition.squads || []).find((s) => s.name === name);
  if (squad) return { id: squad.id, code: squad.code, flagCode: squad.flagCode, name: squad.name };
  const fromMatch = (edition.matches || [])
    .flatMap((m) => [m.home, m.away])
    .find((t) => t.name === name);
  if (fromMatch) {
    return { id: fromMatch.id, code: fromMatch.code, flagCode: fromMatch.flagCode, name: fromMatch.name };
  }
  return { id: null, code: null, flagCode: null, name };
}

function fix2026(edition, nameIndex) {
  const normalize = (name) => restoreAccents(properCase(cleanName(name)), nameIndex);

  for (const squad of edition.squads || []) {
    for (const p of squad.players || []) p.name = normalize(p.name);
    squad.players.sort((a, b) => a.name.localeCompare(b.name));
  }
  for (const m of edition.matches || []) {
    if (m.referee?.name) m.referee.name = normalize(m.referee.name);
    for (const g of m.goals || []) if (g.scorer) g.scorer = normalize(g.scorer);
  }

  if (edition.topScorer?.name) edition.topScorer.name = normalize(edition.topScorer.name);

  edition.awards = AWARDS_2026.map(([award, player, team]) => {
    const ref = teamRefByName(edition, team);
    return {
      award,
      playerId: null,
      player: normalize(player),
      teamId: ref.id,
      team: ref.name,
      shared: false,
    };
  });

  const podium = [edition.winner, edition.runnerUp, edition.thirdPlace].filter(Boolean);
  const fourth = ["France"].find((n) => !podium.includes(n)) ?? null;
  const order = [...podium, fourth].filter(Boolean);
  edition.finalTable = order.map((name, i) => ({ ...teamRefByName(edition, name), position: i + 1 }));

  return edition;
}

function main() {
  const players = readJson(path.join(DATA_DIR, "players.json")).players;
  const nameIndex = buildNameIndex(players);

  for (const p of players) {
    if (p.name) p.name = cleanName(p.name);
    if (p.given && /^not applicable$/i.test(p.given.trim())) p.given = null;
    else if (p.given) p.given = cleanName(p.given);
    if (p.family) p.family = cleanName(p.family);
  }

  const index = readJson(path.join(DATA_DIR, "index.json"));

  for (const entry of index.editions) {
    const file = path.join(EDITIONS_DIR, `${entry.year}.json`);
    const edition = readJson(file);

    stripNotApplicable(edition);

    if (entry.year === 2026) fix2026(edition, nameIndex);
    else if (edition.topScorer) edition.topScorer.goals = goalsForTopScorer(edition, edition.topScorer);

    writeJson(file, edition);

    if (entry.year !== 2026 && edition.topScorer) {
      entry.topScorer = {
        ...edition.topScorer,
        name: cleanName(edition.topScorer.name),
      };
    } else if (edition.topScorer) {
      entry.topScorer = edition.topScorer;
    }

    const detailsFile = path.join(EDITIONS_DIR, `${entry.year}-details.json`);
    if (fs.existsSync(detailsFile)) {
      const details = readJson(detailsFile);
      stripNotApplicable(details);
      if (entry.year === 2026) {
        for (const match of Object.values(details.matches || {})) {
          for (const lineup of match.lineups || []) {
            for (const list of [lineup.starters, lineup.bench]) {
              for (const p of list || []) p.name = restoreAccents(properCase(cleanName(p.name)), nameIndex);
            }
          }
        }
      }
      writeJson(detailsFile, details);
    }

    console.log(
      `${entry.year}: topScorer=${edition.topScorer ? `${edition.topScorer.name} (${edition.topScorer.goals ?? "?"})` : "n/a"}` +
        `, awards=${(edition.awards || []).length}, finalTable=${(edition.finalTable || []).length}`,
    );
  }

  writeJson(path.join(DATA_DIR, "players.json"), { players });
  writeJson(path.join(DATA_DIR, "index.json"), index);

  const teamsFile = path.join(DATA_DIR, "teams.json");
  const teams = readJson(teamsFile);
  stripNotApplicable(teams);
  writeJson(teamsFile, teams);

  console.log("done");
}

main();
