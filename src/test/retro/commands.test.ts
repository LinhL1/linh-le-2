import { describe, expect, it } from "vitest";
import { projects } from "@/data/projects";
import { contact } from "@/data/profile";
import { runCommand } from "@/retro/desktop/terminal/commands";

const text = (input: string, history: string[] = []) =>
  runCommand(input, history)
    .lines.map((l) => l.text)
    .join("\n");

describe("terminal commands", () => {
  it("lists commands in help", () => {
    const out = text("help");
    for (const cmd of ["whoami", "security", "projects", "contact", "open <app>", "exit"]) {
      expect(out).toContain(cmd);
    }
  });

  it("is case-insensitive and supports aliases", () => {
    expect(text("HELP")).toEqual(text("help"));
    expect(text("?")).toEqual(text("help"));
  });

  it("reports unknown commands", () => {
    const [line] = runCommand("rm -rf /").lines;
    expect(line.kind).toBe("error");
    expect(line.text).toContain("command not found: rm");
  });

  it("returns nothing for empty input", () => {
    expect(runCommand("   ")).toEqual({ lines: [] });
  });

  it("shows a project by number", () => {
    expect(text("projects 1")).toContain(projects[0].title);
    expect(text(`projects ${projects.length + 1}`)).toContain("no project");
    expect(text("projects abc")).toContain("usage");
  });

  it("lists every project", () => {
    const out = text("projects");
    for (const p of projects) expect(out).toContain(p.title);
  });

  it("includes the security highlights", () => {
    const out = text("security");
    expect(out).toContain("Project Safeweb");
    expect(out).toContain("PhishSTX");
    expect(out).toContain("INformed");
  });

  it("links contact details", () => {
    const lines = runCommand("contact").lines;
    expect(lines.some((l) => l.href === `mailto:${contact.email}`)).toBe(true);
  });

  it("returns actions for open / clear / exit", () => {
    expect(runCommand("open terminal").action).toEqual({ type: "open", app: "terminal" });
    expect(runCommand("open nope").action).toBeUndefined();
    expect(runCommand("clear").action).toEqual({ type: "clear" });
    expect(runCommand("exit").action).toEqual({ type: "exit" });
    expect(runCommand("classic").lines[0].text).toContain("command not found");
  });

  it("maps cat <file> to the matching command", () => {
    expect(text("cat about.txt")).toEqual(text("about"));
    expect(text("cat nothing.txt")).toContain("no such file");
  });

  it("prints history", () => {
    expect(text("history", ["help", "whoami"])).toMatch(/1\s+help\n\s+2\s+whoami/);
  });
});
