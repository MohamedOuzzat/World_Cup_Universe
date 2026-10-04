"use client";

import { useEffect, useState } from "react";
import { fetchAITeams, fetchAIHealth, predictMatch } from "@/lib/api";
import type { PredictionResponse } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { formatPercent } from "@/lib/format";

export default function PredictPage() {
  const [teams, setTeams] = useState<string[]>([]);
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [neutral, setNeutral] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, h] = await Promise.all([fetchAITeams(), fetchAIHealth()]);
      setTeams(t.data);
      setLive(t.live && h.live);
      if (t.data.length >= 2) {
        setHome(t.data[0]);
        setAway(t.data[1]);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!home || !away || home === away) return;
    setLoading(true);
    setError(undefined);
    setResult(null);
    const res = await predictMatch(home, away, neutral);
    setLive(res.live);
    setResult(res.data);
    setError(res.error);
    setLoading(false);
  }

  function outcomeLabel(o: string) {
    if (o === "HOME_WIN") return "Home win (H)";
    if (o === "AWAY_WIN") return "Away win (A)";
    return "Draw (D)";
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Predictions</h1>
          <p className="text-muted">Venue-neutral 1X2 from the Python ML service (falls back if model unavailable)</p>
        </div>
        <StatusBadge live={live} />
      </div>
      <div className="card flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase text-muted">Home</label>
              <select
                value={home}
                onChange={(e) => setHome(e.target.value)}
                className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase text-muted">Away</label>
              <select
                value={away}
                onChange={(e) => setAway(e.target.value)}
                className="rounded-full border border-border bg-white/5 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                {teams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase text-muted">Venue</label>
              <label className="flex items-center gap-2 rounded-full border border-border bg-white/5 px-4 py-2 text-sm">
                <input type="checkbox" checked={neutral} onChange={(e) => setNeutral(e.target.checked)} />
                Neutral venue (recommended)
              </label>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary self-start md:self-end">
            {loading ? "Predicting..." : "Predict"}
          </button>
        </form>
        {error && <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">{error}</div>}
        {result && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-white/5 p-8 text-center">
              <div className="chip bg-white/10">Prediction</div>
              <h2 className="font-display text-3xl sm:text-4xl">{outcomeLabel(result.predicted_outcome)}</h2>
              <p className="text-muted">
                {result.home_team} vs {result.away_team} · Confidence {formatPercent(result.confidence, 1)}
              </p>
              <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
                <div className="stat items-center text-center">
                  <span className="text-xs text-muted">Home win</span>
                  <span className="font-display text-2xl">{formatPercent(result.probabilities.HOME_WIN, 1)}</span>
                </div>
                <div className="stat items-center text-center">
                  <span className="text-xs text-muted">Draw</span>
                  <span className="font-display text-2xl">{formatPercent(result.probabilities.DRAW, 1)}</span>
                </div>
                <div className="stat items-center text-center">
                  <span className="text-xs text-muted">Away win</span>
                  <span className="font-display text-2xl">{formatPercent(result.probabilities.AWAY_WIN, 1)}</span>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card flex flex-col gap-2 text-sm">
                <h3 className="text-lg font-black">Ratings</h3>
                <div className="flex justify-between">
                  <span className="text-muted">{result.home_team} Elo</span>
                  <span className="font-display tabular-nums">{Math.round(result.ratings.home_elo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{result.away_team} Elo</span>
                  <span className="font-display tabular-nums">{Math.round(result.ratings.away_elo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Elo difference</span>
                  <span className="font-display tabular-nums">{Math.round(result.ratings.elo_difference)}</span>
                </div>
              </div>
              <div className="card flex flex-col gap-2 text-sm">
                <h3 className="text-lg font-black">Model</h3>
                <div className="flex justify-between">
                  <span className="text-muted">Name</span>
                  <span className="truncate">{result.model.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Trained at</span>
                  <span>{result.model.trained_at ? new Date(result.model.trained_at).toLocaleString("en-GB") : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Teams recognized</span>
                  <span>{result.teams_recognized ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {!result && !error && (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted">
            Submit a fixture to see probabilities, Elo and confidence.
          </div>
        )}
      </div>
    </div>
  );
}