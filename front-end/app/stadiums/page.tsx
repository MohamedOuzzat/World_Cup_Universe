"use client";

import { useEffect, useState } from "react";
import type { Stadium } from "@/lib/types";
import { fetchStadiums } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default function StadiumsPage() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [live, setLive] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await fetchStadiums();
      setStadiums(s.data);
      setLive(s.live);
    })();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Stadiums</h1>
          <p className="text-muted">Host venues across USA, Canada & Mexico</p>
        </div>
        <StatusBadge live={live} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stadiums.map((s) => (
          <div key={s.id} className="card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl">{s.name}</span>
              <span className="text-xs text-muted">{s.city}</span>
            </div>
            <div className="text-sm text-muted">Capacity: {formatNumber(s.capacity)}</div>
          </div>
        ))}
        {stadiums.length === 0 && <div className="col-span-full card text-muted">No stadiums found</div>}
      </div>
    </div>
  );
}