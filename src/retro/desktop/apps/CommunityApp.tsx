import { communityIntro, events } from "@/data/events";

export function CommunityApp() {
  return (
    <div className="retro-stack">
      <p className="retro-muted">{communityIntro}</p>
      {events.map((e) => (
        <article key={e.title} className="retro-card">
          <img src={e.image} alt={e.imageAlt} className="retro-card__img" loading="lazy" decoding="async" />
          <div className="retro-card__body">
            <p className="retro-kicker">{e.date}</p>
            <h3 className="retro-entry__title">{e.title}</h3>
            <p className="retro-muted">{[e.role, e.affiliation, e.location].filter(Boolean).join(" · ")}</p>
            <p>{e.description}</p>
            {e.link && (
              <a href={e.link} target="_blank" rel="noopener noreferrer">
                {e.linkLabel ?? "Visit"} ↗
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
