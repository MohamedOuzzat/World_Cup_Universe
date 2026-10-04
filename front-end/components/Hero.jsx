export default function Hero() {
  return (
    <header className="hero">
      <svg className="pitch" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#fff" strokeWidth="3" aria-hidden="true">
        <rect x="20" y="20" width="760" height="460" />
        <line x1="400" y1="20" x2="400" y2="480" />
        <circle cx="400" cy="250" r="70" />
        <rect x="20" y="150" width="120" height="200" />
        <rect x="660" y="150" width="120" height="200" />
      </svg>
      <svg className="ball" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="#fff7ec" stroke="#1a1040" strokeWidth="3" />
        <polygon points="50,30 68,43 61,64 39,64 32,43" fill="#1a1040" />
        <g stroke="#1a1040" strokeWidth="3">
          <path d="M50 30V4M68 43l24-8M61 64l15 20M39 64L24 84M32 43L8 35" />
        </g>
      </svg>
      <div className="big disp" aria-hidden="true">
        26<span>26</span>
      </div>
      <h1>Every team, player and stadium in one place.</h1>
      <p>
        Explore the biggest World Cup ever: three host nations, forty-eight
        teams and a trophy everyone wants to lift.
      </p>
      <a className="btn" href="#teams">Explore teams</a>
      <a className="btn o" href="#stadiums">See stadiums</a>
      <div className="stats">
        <div className="stat"><b>48</b><small>Teams</small></div>
        <div className="stat"><b>104</b><small>Matches</small></div>
        <div className="stat"><b>16</b><small>Host cities</small></div>
      </div>
    </header>
  );
}
