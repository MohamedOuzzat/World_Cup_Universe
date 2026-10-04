"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAIHealth, fetchModelInfo } from "@/lib/api";

export function HomeHero() {
  const [health, setHealth] = useState<{ status: string; model_loaded: boolean } | null>(null);
  const [model, setModel] = useState<{ name: string | null; trained_at: string | null } | null>(null);
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      const h = await fetchAIHealth();
      const m = await fetchModelInfo();
      setHealth(h.data);
      setModel(m.data ? { name: m.data.name, trained_at: m.data.trained_at } : null);
      setLive(h.live && m.live);
    })();
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface-alt via-surface to-surface p-8 shadow-card sm:p-10">
      <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-6">
          <div className="chip w-fit bg-white/10 text-white">FIFA World Cup 2026</div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
            One hub for teams, matches, and <span className="text-primary">venue-neutral</span> predictions
          </h1>
          <p className="max-w-2xl text-lg text-muted sm:text-xl">
            Explore the 48-team tournament with resilient data from Java (matches/teams/stadiums/players) and explainable
            ML predictions from Python. Falls back gracefully if backends are offline.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/matches" className="btn-primary">
              View Matches
            </Link>
            <Link href="/predict" className="btn-ghost">
              Try Predictions
            </Link>
            <Link href="/model" className="btn-ghost">
              Model Stats
            </Link>
          </div>
        </div>
        <div className="card flex min-w-[18rem] flex-col gap-4 bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">AI Service</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${live ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
              {live ? "Live" : "Fallback"}
            </span>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Status</span>
              <span className="font-medium">{health?.status ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Model loaded</span>
              <span className="font-medium">{health?.model_loaded ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Model</span>
              <span className="font-medium truncate">{model?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Trained</span>
              <span className="font-medium">{model?.trained_at ? new Date(model.trained_at).toLocaleDateString("en-GB") : "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}