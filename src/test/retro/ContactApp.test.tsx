import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ContactApp } from "@/retro/desktop/apps/ContactApp";
import { sendMessage } from "@/lib/sendMessage";

// Each test sets its own implementation. Don't add mockClear/mockReset in a beforeEach: with it,
// Vitest 3.2 reports the rejection the component already handled (failure test) as a test error.
vi.mock("@/lib/sendMessage", () => ({ sendMessage: vi.fn() }));
const send = vi.mocked(sendMessage);

const fill = (fields: Partial<Record<"Name" | "Message", string>> & { email?: string }) => {
  if (fields.Name !== undefined) fireEvent.change(screen.getByLabelText("Name"), { target: { value: fields.Name } });
  if (fields.email !== undefined) fireEvent.change(screen.getByLabelText(/Your email/), { target: { value: fields.email } });
  if (fields.Message !== undefined) fireEvent.change(screen.getByLabelText("Message"), { target: { value: fields.Message } });
};

describe("<ContactApp />", () => {
  it("can't send an empty message", () => {
    render(<ContactApp />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    fill({ Message: "   " });
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("sends the trimmed message and thanks the sender", async () => {
    send.mockResolvedValue();
    render(<ContactApp />);
    fill({ Name: " Ada ", email: "ada@example.com", Message: " hello! " });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Message sent. Thanks for the note, Ada!")).toBeInTheDocument();
    expect(send).toHaveBeenLastCalledWith({ name: "Ada", email: "ada@example.com", message: "hello!" });

    fireEvent.click(screen.getByRole("button", { name: "Send another" }));
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("keeps the draft and points to email when sending fails", async () => {
    send.mockRejectedValue(new Error("network"));
    render(<ContactApp />);
    fill({ Message: "hello" });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/Couldn't send/)).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("hello");
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });
});
