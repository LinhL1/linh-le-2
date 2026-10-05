import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useDesktopContext } from "../DesktopContext";
import { BANNER, runCommand, type TerminalLine } from "../terminal/commands";

const PROMPT = "guest@linh-os:~$";
const MAX_LINES = 400;

type Entry = TerminalLine & { id: number; prompt?: boolean };

let nextId = 0;
const withIds = (lines: TerminalLine[], prompt = false): Entry[] => lines.map((l) => ({ ...l, id: nextId++, prompt }));

export function TerminalApp() {
  const { openApp, closeApp, navigate } = useDesktopContext();
  const [entries, setEntries] = useState<Entry[]>(() => withIds(BANNER));
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const historyIndex = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll only the terminal pane; scrollIntoView would also scroll ancestors (bad in 3D).
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = value.trim();
    setValue("");
    historyIndex.current = null;
    if (!input) {
      setEntries((prev) => [...prev, ...withIds([{ text: "" }], true)]);
      return;
    }
    const result = runCommand(input, history);
    setHistory((h) => [...h, input]);

    if (result.action?.type === "clear") {
      setEntries([]);
      return;
    }
    setEntries((prev) => [...prev, ...withIds([{ text: input }], true), ...withIds(result.lines)].slice(-MAX_LINES));

    switch (result.action?.type) {
      case "open":
        openApp(result.action.app);
        break;
      case "exit":
        closeApp("terminal");
        break;
      case "classic":
        navigate("/classic");
        break;
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if (!history.length) return;
    e.preventDefault();
    const current = historyIndex.current ?? history.length;
    const next = e.key === "ArrowUp" ? Math.max(0, current - 1) : current + 1;
    if (next >= history.length) {
      historyIndex.current = null;
      setValue("");
    } else {
      historyIndex.current = next;
      setValue(history[next]);
    }
  };

  return (
    // Clicking anywhere in the pane focuses the prompt, like a real terminal.
    <div
      className="retro-terminal"
      onClick={() => {
        if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
      }}
    >
      <div ref={scrollRef} className="retro-terminal__scroll" role="log" aria-live="polite" aria-label="Terminal output">
        {entries.map((entry) =>
          entry.prompt ? (
            <p key={entry.id} className="retro-terminal__line">
              <span className="retro-terminal__prompt">{PROMPT}</span> {entry.text}
            </p>
          ) : (
            <p key={entry.id} className={`retro-terminal__line is-${entry.kind ?? "output"}`}>
              {entry.href ? (
                <a href={entry.href} target="_blank" rel="noopener noreferrer">
                  {entry.text}
                </a>
              ) : (
                entry.text || " "
              )}
            </p>
          ),
        )}
      </div>
      <form className="retro-terminal__form" onSubmit={submit}>
        <span className="retro-terminal__prompt" aria-hidden="true">
          {PROMPT}
        </span>
        <input
          id="retro-terminal-input"
          ref={inputRef}
          data-autofocus
          className="retro-terminal__input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Terminal command"
        />
      </form>
    </div>
  );
}
