import myPhoto from "@/assets/me.jpg";
import { bio, funFact, stats } from "@/data/profile";
import { securityHighlights, securityIntro } from "@/data/security";
import { useDesktopContext } from "../DesktopContext";

export function AboutApp() {
  const { openApp } = useDesktopContext();

  return (
    <div className="retro-stack">
      <header className="retro-about__header">
        <img src={myPhoto} alt="Linh Le" className="retro-photo" loading="lazy" decoding="async" />
        <div>
          <p className="retro-kicker">about.txt</p>
          <p className="retro-h">Linh Le</p>
          <p className="retro-lede">{bio.headline}</p>
        </div>
      </header>

      <section className="retro-panel retro-panel--security" aria-labelledby="about-security">
        <h3 id="about-security" className="retro-panel__title">
          <span aria-hidden="true">&gt; </span>security.txt
        </h3>
        <p className="retro-panel__lede">{securityIntro}</p>
        <ul className="retro-list">
          {securityHighlights.map((h) => (
            <li key={`${h.title}-${h.subtitle}`}>
              <span className="retro-tag">{h.tag}</span> <strong>{h.title}</strong>
              <span className="retro-muted"> — {h.subtitle}</span>
              <p className="retro-small">{h.detail}</p>
            </li>
          ))}
        </ul>
        <button type="button" className="retro-btn" onClick={() => openApp("terminal")}>
          Open Terminal
        </button>
      </section>

      {bio.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}

      <dl className="retro-stats">
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>

      <aside className="retro-panel" aria-label={funFact.label}>
        <p className="retro-kicker">{funFact.label}</p>
        <p>
          <strong>{funFact.title}</strong> {funFact.body}{" "}
          <a href={funFact.link} target="_blank" rel="noopener noreferrer">
            Take a peek ↗
          </a>
        </p>
      </aside>
    </div>
  );
}
