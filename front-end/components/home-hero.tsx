"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchAIHealth, fetchModelInfo } from "@/lib/api";

const HERO_SLIDES = [
  { src: "/hero/1986-maradona-hand-of-god.jpg", label: "Maradona's Hand of God, Mexico 1986" },
  { src: "/hero/2026-world-cup-canada.jpg", label: "Canada 2026 — the latest" },
  { src: "/hero/germany-eliminates-argentina.jpg", label: "Germany eliminates Argentina" },
  { src: "/hero/portugal-vs-morocco-2022.jpg", label: "Portugal vs Morocco, Qatar 2022" },
  { src: "/hero/top-11-goals-world-cup.jpg", label: "Top 11 goals of the tournament" },
  { src: "/hero/spain-netherlands.jpg", label: "Spain against the Netherlands" },
  { src: "/hero/spain.jpg", label: "España" },
  { src: "/hero/zidane-vs-brazil.jpg", label: "Zidane vs Brazil" },
  { src: "/hero/2022-films-and-tv-series.jpg", label: "World Cup 2022 on screen" },
  { src: "/hero/moment-41.jpg", label: "World Cup moment" },
  { src: "/hero/moment-42.jpg", label: "World Cup moment" },
  { src: "/hero/moment-43.jpg", label: "World Cup moment" },
  { src: "/hero/moment-44.jpg", label: "World Cup moment" },
  { src: "/hero/moment-45.jpg", label: "World Cup moment" },
  { src: "/hero/moment-46.jpg", label: "World Cup moment" },
  { src: "/hero/moment-47.jpg", label: "World Cup moment" },
];

const ROTATE_MS = 6000;

export function HomeHero() {
  const [health, setHealth] = useState<{ status: string; model_loaded: boolean } | null>(null);
  const [model, setModel] = useState<{ name: string | null; trained_at: string | null } | null>(null);
  const [live, setLive] = useState(true);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    (async () => {
      const h = await fetchAIHealth();
      const m = await fetchModelInfo();
      setHealth(h.data);
      setModel(m.data ? { name: m.data.name, trained_at: m.data.trained_at } : null);
      setLive(h.live && m.live);
    })();
  }, []);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const goTo = useCallback((index: number) => setSlide(index), []);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 shadow-card sm:p-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div aria-hidden="true" className="absolute inset-0">
        {HERO_SLIDES.map((item, index) => (
          <Image
            key={item.src}
            src={item.src}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            quality={55}
            className={`hero-slide object-cover ${index === slide ? "opacity-100" : "opacity-0"}`}
            style={{ transform: index === slide ? "scale(1.12)" : "scale(1)" }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/55 to-surface/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/70 via-transparent to-surface/40" />
      </div>

      <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
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

      <div className="relative mt-8 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {HERO_SLIDES.map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show slide ${index + 1}: ${item.label}`}
              aria-current={index === slide}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === slide ? "w-6 bg-primary" : "w-1.5 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted">{HERO_SLIDES[slide].label}</span>
      </div>
    </section>
  );
}