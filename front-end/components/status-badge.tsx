"use client";

export function StatusBadge({ live, fallbackText = "Fallback" }: { live: boolean; fallbackText?: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${live ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
      {live ? "Live" : fallbackText}
    </span>
  );
}