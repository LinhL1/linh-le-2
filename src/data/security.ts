// Cybersecurity framing for the retro desktop (About window + `security` terminal command).
// Every highlight is pulled from existing entries in experience.ts / projects.ts so the
// wording stays in one place — only the short `tag` labels are new.
//
// TODO(linh): add anything not yet in the repo — certifications, CTFs/labs, security
// coursework or tools you've used, and a sentence on what kind of security role you're
// aiming for. Nothing below claims more than the existing entries say.
import { experiences } from "./experience";
import { projects } from "./projects";

// From Linh's own brief for this redesign.
export const securityIntro = "Background in full-stack, pivoting to cyber";

export interface SecurityHighlight {
  title: string;
  subtitle: string;
  detail: string;
  tag: string;
  link?: string;
}

const fromExperience = (role: string, company: string, tag: string): SecurityHighlight | null => {
  const item = experiences.find((e) => e.role === role && e.company === company);
  return item ? { title: item.company, subtitle: item.role, detail: item.description, tag } : null;
};

const fromProject = (title: string, tag: string): SecurityHighlight | null => {
  const item = projects.find((p) => p.title === title);
  return item ? { title: item.title, subtitle: item.type, detail: item.description, tag, link: item.link } : null;
};

export const securityHighlights: SecurityHighlight[] = [
  fromExperience("Grant Writer", "Project Safeweb", "research"),
  fromExperience("Grant Writing & Technical Intern", "IN Network", "policy"),
  fromExperience("Systems Automation/Software Development Intern", "IN Network", "digital safety"),
  fromProject("PhishSTX", "detection"),
  fromProject("INformed", "awareness"),
].filter((h): h is SecurityHighlight => h !== null);

/** Used to badge security-relevant entries in the retro Experience / Projects windows. */
export const isSecurityHighlight = (title: string, subtitle?: string) =>
  securityHighlights.some((h) => h.title === title && (subtitle === undefined || h.subtitle === subtitle));
