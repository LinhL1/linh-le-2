import { useState } from "react";
import { projects } from "@/data/projects";
import { isSecurityHighlight } from "@/data/security";
import { useDesktopContext } from "../DesktopContext";

export function ProjectsApp() {
  const { compact, navigate } = useDesktopContext();
  // On phones the list and the detail view take turns; on larger screens both are shown.
  const [selected, setSelected] = useState<number | null>(compact ? null : 0);
  const project = selected === null ? null : projects[selected];

  const list = (
    <ul className="retro-filelist" aria-label="Projects">
      {projects.map((p, i) => (
        <li key={p.title}>
          <button
            type="button"
            className="retro-filelist__item"
            aria-current={i === selected ? "true" : undefined}
            onClick={() => setSelected(i)}
          >
            <span className="retro-filelist__name">{p.title}</span>
            <span className="retro-filelist__meta">{p.year}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  const detail = project && (
    <article className="retro-stack" aria-live="polite">
      {compact && (
        <button type="button" className="retro-btn retro-btn--small" onClick={() => setSelected(null)}>
          ← All projects
        </button>
      )}
      {project.image && (
        <img src={project.image} alt="" className="retro-card__img retro-card__img--project" loading="lazy" decoding="async" />
      )}
      <div>
        <p className="retro-kicker">
          {project.year} · {project.type}
        </p>
        <h3 className="retro-entry__title">
          {project.title}
          {isSecurityHighlight(project.title) && <span className="retro-tag">security</span>}
        </h3>
      </div>
      <p>{project.description}</p>
      {project.tools && (
        <ul className="retro-chips" aria-label="Tools">
          {project.tools.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      {project.caseStudy && (
        <section className="retro-panel" aria-label="Case study">
          <p className="retro-kicker">Role</p>
          <p>{project.caseStudy.role}</p>
          <p className="retro-kicker">Problem</p>
          <p>{project.caseStudy.problem}</p>
          <p className="retro-kicker">Approach</p>
          <ul className="retro-list retro-list--bullets">
            {project.caseStudy.approach.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="retro-kicker">Impact</p>
          <p>{project.caseStudy.impact}</p>
        </section>
      )}
      {project.link && (
        <a className="retro-btn" href={project.link} target="_blank" rel="noopener noreferrer">
          Open project ↗
        </a>
      )}
    </article>
  );

  return (
    <div className="retro-projects">
      {compact ? (project ? detail : list) : (
        <>
          <div className="retro-projects__list">{list}</div>
          <div className="retro-projects__detail">{detail}</div>
        </>
      )}
      <p className="retro-projects__footer">
        <button type="button" className="retro-link" onClick={() => navigate("/projects")}>
          Browse all projects on the classic site →
        </button>
      </p>
    </div>
  );
}
