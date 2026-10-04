import {
  MATCHES_FALLBACK,
  PLAYERS_FALLBACK,
  STADIUMS_FALLBACK,
  TEAMS_FALLBACK,
} from "./data";
import type {
  EloTeam,
  Match,
  ModelInfo,
  Player,
  PredictionResponse,
  Sourced,
  Stadium,
  Team,
} from "./types";

/** Base URLs for the two backends. */
export const JAVA_API_BASE = process.env.NEXT_PUBLIC_JAVA_API ?? "http://localhost:8080";
export const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API ?? "http://localhost:8000";

/** Generic fetch with abort + timeout + JSON coercion. */
async function fetchWithTimeout<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      // Some endpoints return empty bodies on 204; fall through
      return {} as T;
    }
  } finally {
    clearTimeout(timeout);
  }
}

function withFallback<T>(data: T, live: boolean, error?: unknown): Sourced<T> {
  const msg = error instanceof Error ? error.message : error ? String(error) : undefined;
  return { data, live, error: msg };
}

export async function fetchMatches(): Promise<Sourced<Match[]>> {
  try {
    const data = await fetchWithTimeout<Match[]>(`${JAVA_API_BASE}/api/matches`);
    return withFallback(data, true);
  } catch (error) {
    return withFallback(MATCHES_FALLBACK, false, error);
  }
}

export async function fetchMatch(id: number): Promise<Sourced<Match | null>> {
  try {
    const data = await fetchWithTimeout<Match>(`${JAVA_API_BASE}/api/matches/${id}`);
    return withFallback(data, true);
  } catch (error) {
    const match = MATCHES_FALLBACK.find((m) => m.id === id) ?? null;
    return withFallback(match, false, error);
  }
}

export async function fetchMatchesByStage(stage: string): Promise<Sourced<Match[]>> {
  try {
    const data = await fetchWithTimeout<Match[]>(`${JAVA_API_BASE}/api/matches/by-stage?stage=${stage}`);
    return withFallback(data, true);
  } catch (error) {
    const matches = MATCHES_FALLBACK.filter((m) => m.stage === stage);
    return withFallback(matches, false, error);
  }
}

export async function fetchMatchesByGroup(group: string): Promise<Sourced<Match[]>> {
  try {
    const data = await fetchWithTimeout<Match[]>(`${JAVA_API_BASE}/api/matches/by-group?groupName=${group}`);
    return withFallback(data, true);
  } catch (error) {
    const matches = MATCHES_FALLBACK.filter((m) => m.groupName === group);
    return withFallback(matches, false, error);
  }
}

export async function fetchMatchesByStatus(status: string): Promise<Sourced<Match[]>> {
  try {
    const data = await fetchWithTimeout<Match[]>(`${JAVA_API_BASE}/api/matches/by-status?status=${status}`);
    return withFallback(data, true);
  } catch (error) {
    const matches = MATCHES_FALLBACK.filter((m) => m.status === status);
    return withFallback(matches, false, error);
  }
}

export async function fetchTeams(): Promise<Sourced<Team[]>> {
  try {
    const data = await fetchWithTimeout<Team[]>(`${JAVA_API_BASE}/api/teams`);
    return withFallback(data, true);
  } catch (error) {
    return withFallback(TEAMS_FALLBACK, false, error);
  }
}

export async function fetchTeam(id: number): Promise<Sourced<Team | null>> {
  try {
    const data = await fetchWithTimeout<Team>(`${JAVA_API_BASE}/api/teams/${id}`);
    return withFallback(data, true);
  } catch (error) {
    const team = TEAMS_FALLBACK.find((t) => t.id === id) ?? null;
    return withFallback(team, false, error);
  }
}

export async function fetchStadiums(): Promise<Sourced<Stadium[]>> {
  try {
    const data = await fetchWithTimeout<Stadium[]>(`${JAVA_API_BASE}/api/stadiums`);
    return withFallback(data, true);
  } catch (error) {
    return withFallback(STADIUMS_FALLBACK, false, error);
  }
}

export async function fetchPlayers(): Promise<Sourced<Player[]>> {
  try {
    const data = await fetchWithTimeout<Player[]>(`${JAVA_API_BASE}/api/players`);
    return withFallback(data, true);
  } catch (error) {
    return withFallback(PLAYERS_FALLBACK, false, error);
  }
}

export async function fetchAIHealth(): Promise<Sourced<{ status: string; model_loaded: boolean }>> {
  try {
    const data = await fetchWithTimeout<{ status: string; model_loaded: boolean }>(`${AI_API_BASE}/health`);
    return withFallback(data, true);
  } catch (error) {
    return withFallback({ status: "unavailable", model_loaded: false }, false, error);
  }
}

export async function fetchModelInfo(): Promise<Sourced<ModelInfo | null>> {
  try {
    const data = await fetchWithTimeout<ModelInfo>(`${AI_API_BASE}/model`);
    return withFallback(data, true);
  } catch (error) {
    return withFallback(null, false, error);
  }
}

export async function fetchAITeams(): Promise<Sourced<string[]>> {
  try {
    const data = await fetchWithTimeout<string[]>(`${AI_API_BASE}/teams`);
    return withFallback(data, true);
  } catch (error) {
    return withFallback(TEAMS_FALLBACK.map((t) => t.name), false, error);
  }
}

export async function fetchSeasons(): Promise<Sourced<string[]>> {
  try {
    const data = await fetchWithTimeout<string[]>(`${AI_API_BASE}/seasons`);
    return withFallback(data, true);
  } catch (error) {
    return withFallback(["2026", "2024", "2022", "2021", "2020"], false, error);
  }
}

export async function predictMatch(
  homeTeam: string,
  awayTeam: string,
  neutral: boolean = true,
): Promise<Sourced<PredictionResponse | null>> {
  try {
    const data = await fetchWithTimeout<PredictionResponse>(`${AI_API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ home_team: homeTeam, away_team: awayTeam, neutral }),
    });
    return withFallback(data, true);
  } catch (error) {
    return withFallback(null, false, error);
  }
}

export async function fetchTopElo(): Promise<Sourced<EloTeam[]>> {
  const model = await fetchModelInfo();
  if (model.data?.top_ratings) {
    return withFallback(model.data.top_ratings.map((t) => ({ name: t.team, elo: t.elo })), model.live, model.error);
  }
  const elo: EloTeam[] = TEAMS_FALLBACK.map((t) => ({
    name: t.name,
    elo: 1500 + (10 - (t.fifaRanking ?? 50) / 10),
  }));
  return withFallback(elo.sort((a, b) => b.elo - a.elo).slice(0, 20), false, model.error);
}