import { experiences } from "@/data/experience";
import { events } from "@/data/events";
import { bio, contact, socials, stats } from "@/data/profile";
import { projects } from "@/data/projects";
import { securityHighlights, securityIntro } from "@/data/security";
import { APP_IDS, type AppId } from "../useDesktop";

export type LineKind = "output" | "muted" | "accent" | "error" | "heading";

export interface TerminalLine {
  text: string;
  kind?: LineKind;
  href?: string;
}

export type TerminalAction = { type: "open"; app: AppId } | { type: "clear" } | { type: "exit" };

export interface CommandResult {
  lines: TerminalLine[];
  action?: TerminalAction;
}

const line = (text: string, kind: LineKind = "output", href?: string): TerminalLine => ({ text, kind, href });
const blank = line("");

// File-style aliases so `ls` / `cat about.txt` feel natural.
const FILES: Record<string, string> = {
  "about.txt": "about",
  "security.txt": "security",
  "experience.log": "experience",
  "projects/": "projects",
  "community.md": "community",
  "contact.vcf": "contact",
};

const HELP: [string, string][] = [
  ["help", "show this list"],
  ["whoami", "one-line intro"],
  ["about", "bio and quick facts"],
  ["security", "cybersecurity-related work"],
  ["experience", "work history"],
  ["projects [n]", "list projects, or show project n"],
  ["community", "events I've hosted"],
  ["contact", "email and socials"],
  ["open <app>", `open a window (${APP_IDS.join(", ")})`],
  ["ls / cat <file>", "browse the same info as files"],
  ["history", "previous commands"],
  ["clear", "clear the screen"],
  ["exit", "close the terminal"],
];

const pad = (s: string, n: number) => (s.length >= n ? `${s} ` : s + " ".repeat(n - s.length));

function projectDetail(n: number): TerminalLine[] {
  const p = projects[n - 1];
  if (!p) return [line(`projects: no project #${n} (try 1-${projects.length})`, "error")];
  const out = [line(`${p.title} — ${p.type}`, "heading"), line(p.year, "muted"), line(p.description)];
  if (p.tools?.length) out.push(line(`tools: ${p.tools.join(", ")}`, "muted"));
  if (p.link) out.push(line(p.link, "accent", p.link));
  return out;
}

const COMMANDS: Record<string, (args: string[], history: string[]) => CommandResult> = {
  help: () => ({
    lines: [
      line("available commands:", "heading"),
      ...HELP.map(([cmd, desc]) => line(`  ${pad(cmd, 16)}${desc}`)),
    ],
  }),
  whoami: () => ({ lines: [line("linh le", "heading"), line(bio.headline), line(securityIntro, "accent")] }),
  about: () => ({
    lines: [
      line(bio.headline, "heading"),
      ...bio.paragraphs.flatMap((p) => [line(p), blank]),
      ...stats.map((s) => line(`  ${pad(s.label.toLowerCase(), 13)}${s.value}`)),
    ],
  }),
  security: () => ({
    lines: [
      line(securityIntro, "heading"),
      blank,
      ...securityHighlights.flatMap((h) => [
        line(h.date, "muted"),
        line(`[${h.tag}] ${h.title} — ${h.subtitle}`, "accent"),
        line(`  ${h.detail}`),
        ...(h.link ? [line(`  ${h.link}`, "muted", h.link)] : []),
      ]),
    ],
  }),
  experience: () => ({
    lines: experiences.flatMap((e) => [
      line(`${e.period}`, "muted"),
      line(`  ${e.role} @ ${e.company}`, "heading"),
      line(`  ${e.description}`),
    ]),
  }),
  projects: (args) => {
    if (args[0]) {
      const n = Number.parseInt(args[0], 10);
      if (Number.isNaN(n)) return { lines: [line("usage: projects [number]", "error")] };
      return { lines: projectDetail(n) };
    }
    return {
      lines: [
        ...projects.map((p, i) => line(`  ${pad(String(i + 1).padStart(2, " "), 4)}${p.title} (${p.year}) — ${p.type}`)),
        blank,
        line("type `projects 3` for details, or `open projects`", "muted"),
      ],
    };
  },
  community: () => ({
    lines: events.flatMap((e) => [
      line(`${e.title}`, "heading"),
      line(`  ${[e.role, e.affiliation, e.location, e.date].filter(Boolean).join(" · ")}`, "muted"),
      line(`  ${e.description}`),
      ...(e.link ? [line(`  ${e.link}`, "accent", e.link)] : []),
    ]),
  }),
  contact: () => ({
    lines: [
      line(contact.blurb),
      blank,
      line(`  email     ${contact.email}`, "accent", `mailto:${contact.email}`),
      ...socials.map((s) => line(`  ${pad(s.name.toLowerCase(), 10)}${s.url}`, "accent", s.url)),
    ],
  }),
  open: (args) => {
    const app = args[0]?.toLowerCase();
    if (app && (APP_IDS as readonly string[]).includes(app)) {
      return { lines: [line(`opening ${app}...`, "muted")], action: { type: "open", app: app as AppId } };
    }
    return { lines: [line(`usage: open <${APP_IDS.join("|")}>`, "error")] };
  },
  ls: () => ({ lines: [line(Object.keys(FILES).join("   "))] }),
  cat: (args, history) => {
    const target = FILES[args[0] ?? ""];
    if (!target) return { lines: [line(`cat: ${args[0] ?? ""}: no such file`, "error")] };
    return COMMANDS[target]([], history);
  },
  history: (_args, history) => ({
    lines: history.length ? history.map((h, i) => line(`  ${pad(String(i + 1), 4)}${h}`)) : [line("(empty)", "muted")],
  }),
  clear: () => ({ lines: [], action: { type: "clear" } }),
  exit: () => ({ lines: [], action: { type: "exit" } }),
  sudo: () => ({ lines: [line("permission denied: this incident will be reported ;)", "error")] }),
};

const ALIASES: Record<string, string> = { "?": "help", "man": "help", "logout": "exit", "quit": "exit", "cls": "clear", "project": "projects" };

export function runCommand(input: string, history: string[] = []): CommandResult {
  const [rawCmd, ...args] = input.trim().split(/\s+/);
  if (!rawCmd) return { lines: [] };
  const name = ALIASES[rawCmd.toLowerCase()] ?? rawCmd.toLowerCase();
  const handler = COMMANDS[name];
  if (!handler) return { lines: [line(`command not found: ${rawCmd}. type \`help\``, "error")] };
  return handler(args, history);
}

export const BANNER: TerminalLine[] = [
  line("LINH-OS terminal v1.0", "heading"),
  line(securityIntro, "accent"),
  line("type `help` to see what's here.", "muted"),
];
