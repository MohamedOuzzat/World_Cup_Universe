"use client";

import { useState } from "react";
import { teams } from "@/data/wc26";
import Chips from "./Chips";

const confs = ["All", "UEFA", "CONMEBOL", "CAF", "CONCACAF"];

export default function TeamsSection() {
  const [conf, setConf] = useState("All");
  const [q, setQ] = useState("");

  const result = teams.filter(
    (t) =>
      (conf === "All" || t[2] === conf) &&
      t[0].toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section id="teams">
      <div className="head">
        <h2>Teams</h2>
        <div className="tools">
          <input
            className="search"
            type="search"
            placeholder="Search a team"
            aria-label="Search teams"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Chips options={confs} current={conf} onChange={setConf} />
        </div>
      </div>
      <div className="grid">
        {result.length === 0 ? (
          <div className="empty">
            No team matches &quot;{q}&quot;. Try another name or clear the
            filter.
          </div>
        ) : (
          result.map((t) => (
            <article key={t[0]} className="card" style={{ "--c": t[4] }}>
              <div className="flag">{t[1]}</div>
              <h3>{t[0]}</h3>
              <p>{t[2]}</p>
              <div className="stars" aria-label={`${t[3]} titles`}>
                {t[3] ? "★".repeat(t[3]) : ""}
              </div>
              <span className="tag">
                {t[3]} {t[3] === 1 ? "title" : "titles"}
              </span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
