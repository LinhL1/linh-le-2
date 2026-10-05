export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  description: string;
}

// Rendered in array order (newest first) by the classic ExperienceSection and the retro desktop.
export const experiences: ExperienceItem[] = [
  {
    role: "Systems Automation/Software Development Intern",
    company: "IN Network",
    period: "JUN 2026 — PRESENT",
    description:
      "Led a media literacy web app from concept to launch after spotting a gap in youth digital-safety education. Reworked our internship review process for 500+ applicants, cutting manual review time by 60%.",
  },
  {
    role: "Tech Program Instructor/Program Counselor",
    company: "Kids in Tech",
    period: "NOV 2025 — PRESENT",
    description:
      "Design, iterate, and lead curriculum for 4 cohorts of Boston-area middle schoolers. Covered STEM, Robotics, and web dev.",
  },
  {
    role: "Grant Writing & Technical Intern",
    company: "IN Network",
    period: "JAN 2026 — MAY 2026",
    description:
      "Supported grant research. Authored cybersecurity-focused policy briefs and contributed to funding initiatives. Developed an interactive media literacy web app using React.",
  },
  {
    role: "Grant Writer",
    company: "Project Safeweb",
    period: "AUG 2025 — JAN 2026",
    description:
      "Researched grants and cybersecurity organizations to support partnerships and funding opportunities.",
  },
  {
    role: "Front-end Developer",
    company: "Building-U",
    period: "AUG 2024 — AUG 2025",
    description:
      "Prototyped an interactive admin dashboard with senior developers, translating stakeholder needs into a working product. Ran 20+ peer code reviews.",
  },
  {
    role: "Video Production",
    company: "Malden City Hall",
    period: "SUMMER 2023 — 2024",
    description:
      "Produced short/long-form media for the City of Malden, including interviews and community projects. Managed filming and editing (Final Cut Pro).",
  },
];
