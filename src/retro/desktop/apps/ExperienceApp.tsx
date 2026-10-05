import { experiences } from "@/data/experience";
import { isSecurityHighlight } from "@/data/security";

export function ExperienceApp() {
  return (
    <ol className="retro-timeline">
      {experiences.map((e) => (
        <li key={`${e.company}-${e.role}`}>
          <p className="retro-kicker">{e.period}</p>
          <h3 className="retro-entry__title">
            {e.role}
            {isSecurityHighlight(e.company, e.role) && <span className="retro-tag">security</span>}
          </h3>
          <p className="retro-muted">{e.company}</p>
          <p>{e.description}</p>
        </li>
      ))}
    </ol>
  );
}
