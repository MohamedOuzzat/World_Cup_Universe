import type { Metadata } from "next";
import { HomeHero } from "@/components/home-hero";
import { LiveStats } from "@/components/live-stats";
import { UpcomingMatches } from "@/components/upcoming-matches";
import { TopElo } from "@/components/top-elo";

export const metadata: Metadata = {
  title: "World Cup 2026 Hub — Home",
};

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <HomeHero />
      <LiveStats />
      <UpcomingMatches />
      <TopElo />
    </div>
  );
}