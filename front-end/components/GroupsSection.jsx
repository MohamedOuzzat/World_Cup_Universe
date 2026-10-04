import { groups } from "@/data/wc26";

export default function GroupsSection() {
  return (
    <section id="groups" className="alt">
      <div className="head">
        <h2>Group stage preview</h2>
      </div>
      <div className="groups">
        {Object.entries(groups).map(([k, v]) => (
          <div key={k} className="card">
            <h3>Group {k}</h3>
            {v.map((t) => {
              const space = t.indexOf(" ");
              return (
                <div key={t} className="row">
                  <span>{t.slice(0, space)}</span>
                  <span>{t.slice(space + 1)}</span>
                  <em>0 pts</em>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
