import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "..", "..", "..");
export const CACHE_DIR = path.join(ROOT, "scripts", "dataset", ".cache");
export const OUT_DIR = path.join(ROOT, "front-end", "public", "data");

const OPENFOOTBALL_BASE =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master";
const FJELSTUL_BASE =
  "https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv";

const FJELSTUL_FILES = [
  "award_winners.csv",
  "awards.csv",
  "bookings.csv",
  "confederations.csv",
  "goals.csv",
  "group_standings.csv",
  "groups.csv",
  "host_countries.csv",
  "manager_appointments.csv",
  "managers.csv",
  "matches.csv",
  "penalty_kicks.csv",
  "player_appearances.csv",
  "players.csv",
  "qualified_teams.csv",
  "referee_appearances.csv",
  "referees.csv",
  "squads.csv",
  "substitutions.csv",
  "team_appearances.csv",
  "teams.csv",
  "tournament_stages.csv",
  "tournament_standings.csv",
  "tournaments.csv",
  "stadiums.csv",
];

export async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(url, cachePath, { force = false } = {}) {
  if (!force && (await exists(cachePath))) {
    return readFile(cachePath, "utf8");
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "world-cup-universe-dataset" },
  });
  if (!res.ok) {
    throw new Error(`Failed ${res.status} ${res.statusText} for ${url}`);
  }
  const text = await res.text();
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, text, "utf8");
  return text;
}

export async function loadFjelstul({ force = false } = {}) {
  await mkdir(CACHE_DIR, { recursive: true });
  const out = {};
  for (const file of FJELSTUL_FILES) {
    out[file] = await download(
      `${FJELSTUL_BASE}/${file}`,
      path.join(CACHE_DIR, "fjelstul", file),
      { force }
    );
  }
  return out;
}

export async function loadOpenfootballYear(year, { force = false } = {}) {
  const variants = ["worldcup-full.json", "worldcup.json"];
  for (const variant of variants) {
    try {
      const text = await download(
        `${OPENFOOTBALL_BASE}/${year}/${variant}`,
        path.join(CACHE_DIR, "openfootball", String(year), variant),
        { force }
      );
      if (text && text.trim().startsWith("{")) {
        return JSON.parse(text);
      }
    } catch {
      continue;
    }
  }
  throw new Error(`No openfootball data for ${year}`);
}

export async function writeJson(relativePath, value) {
  const target = path.join(OUT_DIR, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(value), "utf8");
  return target;
}