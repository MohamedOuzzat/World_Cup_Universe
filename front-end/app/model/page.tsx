"use client";

import { useEffect, useState } from "react";
import { fetchModelInfo, fetchAIHealth } from "@/lib/api";
import type { ModelInfo } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { formatPercent, formatNumber } from "@/lib/format";

export default function ModelPage() {
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, h] = await Promise.all([fetchModelInfo(), fetchAIHealth()]);
      setModel(m.data);
      setLive(m.live && h.live);
    })();
  }, []);

  const metricKeys = model ? Object.keys(model.metrics) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Model & Statistics</h1>
          <p className="text-muted">Chrono-evaluated 1X2 classifier · Deterministic, venue-neutral</p>
        </div>
        <StatusBadge live={live} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat">
          <span className="text-sm text-muted">Model</span>
          <span className="truncate text-xl font-black">{model?.name ?? "—"}</span>
        </div>
        <div className="stat">
          <span className="text-sm text-muted">Trained at</span>
          <span className="text-xl font-black">{model?.trained_at ? new Date(model.trained_at).toLocaleString("en-GB") : "—"}</span>
        </div>
        <div className="stat">
          <span className="text-sm text-muted">Train / Test</span>
          <span className="text-xl font-black tabular-nums">
            {formatNumber(model?.n_train)} / {formatNumber(model?.n_test)}
          </span>
        </div>
        <div className="stat">
          <span className="text-sm text-muted">Features</span>
          <span className="text-xl font-black tabular-nums">{formatNumber(model?.n_features)}</span>
        </div>
      </div>
      {metricKeys.length > 0 && (
        <div className="card flex flex-col gap-4">
          <h2 className="text-2xl font-black">Holdout metrics</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metricKeys.map((k) => (
              <div key={k} className="card flex flex-col gap-2 bg-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg">{k}</span>
                  <span className="text-xs text-muted">Holdout</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted">Acc</span>
                    <span className="font-display text-lg">{formatPercent(model!.metrics[k].accuracy, 1)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted">Bal Acc</span>
                    <span className="font-display text-lg">{formatPercent(model!.metrics[k].balanced_accuracy, 1)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted">Log loss</span>
                    <span className="font-display text-lg tabular-nums">{model!.metrics[k].log_loss.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {model?.baseline && (
        <div className="card flex flex-col gap-2">
          <h2 className="text-xl font-black">Majority baseline</h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-muted">
              Accuracy: <span className="text-foreground">{formatPercent(model.baseline.accuracy, 1)}</span>
            </span>
            <span className="text-muted">
              Balanced: <span className="text-foreground">{formatPercent(model.baseline.balanced_accuracy, 1)}</span>
            </span>
            <span className="text-muted">
              Log loss: <span className="text-foreground tabular-nums">{model.baseline.log_loss.toFixed(3)}</span>
            </span>
          </div>
        </div>
      )}
      {model?.top_ratings && model.top_ratings.length > 0 && (
        <div className="card flex flex-col gap-3">
          <h2 className="text-xl font-black">Top Elo (trained)</h2>
          <div className="flex flex-col divide-y divide-border/60 text-sm">
            {model.top_ratings.map((r, i) => (
              <div key={r.team} className="flex items-center justify-between py-2">
                <span>
                  {i + 1}. {r.team}
                </span>
                <span className="font-display tabular-nums">{Math.round(r.elo)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {model?.feature_columns && model.feature_columns.length > 0 && (
        <div className="card flex flex-col gap-3">
          <h2 className="text-xl font-black">Feature columns</h2>
          <div className="flex flex-wrap gap-2">
            {model.feature_columns.map((f) => (
              <span key={f} className="chip bg-white/5">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
      {!model && (
        <div className="card text-center text-muted">
          No model info available. Train the Python model (`py -m app.ml.train`) and ensure the AI service is running on port 8000.
        </div>
      )}
    </div>
  );
}