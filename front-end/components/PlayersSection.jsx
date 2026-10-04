"use client";

import { useState } from "react";
import { players } from "@/data/wc26";
import Chips from "./Chips";

const positions = ["All", "Forward", "Midfielder", "Defender"];

export default function PlayersSection() {
  const [pos, setPos] = useState("All");

  const result = players.filter((p) => pos === "All" || p[3] === pos);

  return (
    <section id="players" className="alt">
      <div className="head">
        <h2>Players to watch</h2>
        <div className="tools">
          <Chips options={positions} current={pos} onChange={setPos} />
        </div>
      </div>
      <div className="grid">
        {result.map((p) => (
          <article key={p[0]} className="card pl" style={{ "--c": p[5] }}>
            <div className="flag">{p[2]}</div>
            <h3>{p[0]}</h3>
            <p>{p[1]}</p>
            <span className="tag">{p[3]}</span>
            <div className="num" aria-hidden="true">
              {p[4]}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
