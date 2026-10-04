import { stadiums } from "@/data/wc26";

export default function StadiumsSection() {
  return (
    <section id="stadiums">
      <div className="head">
        <h2>Stadiums</h2>
      </div>
      <div className="grid">
        {stadiums.map((s) => (
          <article key={s[0]} className="card stad" style={{ "--c": s[4] }}>
            <div className="art">
              <svg viewBox="0 0 300 130" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
                <ellipse cx="150" cy="70" rx="130" ry="48" />
                <ellipse cx="150" cy="70" rx="95" ry="32" />
                <rect x="105" y="54" width="90" height="32" rx="4" />
              </svg>
            </div>
            <div className="in">
              <h3>{s[0]}</h3>
              <p>{s[1]}</p>
              <div className="cap">
                {s[2].toLocaleString()}
                <small>seats</small>
              </div>
              <div className="bar">
                <i style={{ width: `${(s[2] / 94000) * 100}%` }} />
              </div>
              <span className="tag">{s[3]}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
