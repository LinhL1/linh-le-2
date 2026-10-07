import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { projects } from "@/data/projects";
import { Desktop } from "@/retro/desktop/Desktop";

const setup = (props: Partial<Parameters<typeof Desktop>[0]> = {}) => {
  const navigate = vi.fn();
  render(<Desktop mode="2d" navigate={navigate} {...props} />);
  return { navigate };
};

describe("<Desktop />", () => {
  it("opens a window from its icon and moves focus into it", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "About Me" }));
    const dialog = screen.getByRole("dialog", { name: "About Me" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes with the close button and returns focus to the icon", () => {
    setup();
    const icon = screen.getByRole("button", { name: "Experience" });
    icon.focus();
    fireEvent.click(icon);
    fireEvent.click(screen.getByRole("button", { name: "Close Experience" }));
    expect(screen.queryByRole("dialog", { name: "Experience" })).not.toBeInTheDocument();
    expect(icon).toHaveFocus();
  });

  it("closes the focused window with Escape", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Contact" }));
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Contact" }), { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Contact" })).not.toBeInTheDocument();
  });

  it("powers off with Escape when no windows are open", () => {
    const onPowerOff = vi.fn();
    setup({ onPowerOff });
    fireEvent.keyDown(screen.getByRole("button", { name: "About Me" }), { key: "Escape" });
    expect(onPowerOff).toHaveBeenCalledTimes(1);
  });

  it("runs terminal commands, including opening other windows", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Terminal" }));
    const input = screen.getByRole("textbox", { name: "Terminal command" });
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "projects 1" } });
    fireEvent.submit(input);
    expect(within(screen.getByRole("log")).getByText(new RegExp(projects[0].title))).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "open contact" } });
    fireEvent.submit(input);
    expect(screen.getByRole("dialog", { name: "Contact" })).toBeInTheDocument();
  });

  it("exits 2D mode with the corner × button", () => {
    const onSwitchTo3d = vi.fn();
    setup({ onSwitchTo3d });
    fireEvent.click(screen.getByRole("button", { name: "Exit 2D mode" }));
    expect(onSwitchTo3d).toHaveBeenCalledTimes(1);
  });

  it("exits 2D mode with Escape once no windows are open", () => {
    const onSwitchTo3d = vi.fn();
    setup({ onSwitchTo3d });
    fireEvent.click(screen.getByRole("button", { name: "Contact" }));
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Contact" }), { key: "Escape" });
    expect(onSwitchTo3d).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("button", { name: "About Me" }), { key: "Escape" });
    expect(onSwitchTo3d).toHaveBeenCalledTimes(1);
  });

  it("has no exit button when 3D isn't available", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Exit 2D mode" })).not.toBeInTheDocument();
  });

  it("scrolls window content with the mouse wheel in 3D (Chromium can't inside preserve-3d)", () => {
    render(<Desktop mode="3d" navigate={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "About Me" }));
    const body = screen.getByRole("dialog", { name: "About Me" }).querySelector<HTMLElement>(".retro-window__body")!;
    // jsdom has no layout or stylesheet: fake a scrollable box.
    body.style.overflowY = "auto";
    Object.defineProperty(body, "scrollHeight", { configurable: true, value: 900 });
    Object.defineProperty(body, "clientHeight", { configurable: true, value: 400 });

    const target = body.querySelector("p") ?? body;
    const wheel = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
    target.dispatchEvent(wheel);
    expect(body.scrollTop).toBe(120);
    expect(wheel.defaultPrevented).toBe(true);
  });

  it("leaves wheel scrolling to the browser in 2D", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "About Me" }));
    const body = screen.getByRole("dialog", { name: "About Me" }).querySelector<HTMLElement>(".retro-window__body")!;
    body.style.overflowY = "auto";
    Object.defineProperty(body, "scrollHeight", { configurable: true, value: 900 });
    Object.defineProperty(body, "clientHeight", { configurable: true, value: 400 });

    const wheel = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
    body.dispatchEvent(wheel);
    expect(body.scrollTop).toBe(0);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it("is inert while inactive (3D, zoomed out)", () => {
    const { container } = render(<Desktop mode="3d" active={false} navigate={vi.fn()} />);
    expect(container.querySelector(".retro-desktop")).toHaveAttribute("inert");
  });
});
