import { useState, type FormEvent } from "react";
import { contact, socials } from "@/data/profile";
import { sendMessage } from "@/lib/sendMessage";

type SendState = "idle" | "sending" | "sent" | "error";

export function ContactApp() {
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus("Couldn't copy. Select the address instead.");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendState === "sending") return;
    setSendState("sending");
    try {
      await sendMessage({ name: name.trim(), email: email.trim(), message: message.trim() });
      setSendState("sent");
    } catch (err) {
      // EmailJS rejects with { status, text }, e.g. 412 "Gmail_API: Invalid grant" when the
      // Gmail connection in the EmailJS dashboard needs reconnecting.
      console.error("Contact form: send failed", err);
      setSendState("error");
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setSendState("idle");
  };

  return (
    <div className="retro-stack">
      <p className="retro-h">Let's chit-chat</p>
      <p>{contact.blurb}</p>

      <section className="retro-panel" aria-labelledby="contact-message">
        <p id="contact-message" className="retro-kicker">
          Send a message
        </p>
        {sendState === "sent" ? (
          <>
            <p role="status">Message sent. Thanks for the note{name.trim() ? `, ${name.trim()}` : ""}!</p>
            <button type="button" className="retro-btn retro-btn--small" onClick={reset}>
              Send another
            </button>
          </>
        ) : (
          <form className="retro-form" onSubmit={submit}>
            <label className="retro-field">
              <span className="retro-field__label">Name</span>
              <input
                className="retro-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={100}
              />
            </label>
            <label className="retro-field">
              <span className="retro-field__label">Your email (optional, so I can reply)</span>
              <input
                className="retro-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={254}
              />
            </label>
            <label className="retro-field">
              <span className="retro-field__label">Message</span>
              <textarea
                className="retro-input retro-input--area"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hey, how's it going...?"
                rows={4}
                required
                maxLength={5000}
              />
            </label>
            <div className="retro-form__actions">
              <button type="submit" className="retro-btn" disabled={!message.trim() || sendState === "sending"}>
                {sendState === "sending" ? "Sending..." : "Send"}
              </button>
              <span className="retro-small retro-status" role="status">
                {sendState === "error" ? "Couldn't send. Try again, or email me directly below." : ""}
              </span>
            </div>
          </form>
        )}
      </section>

      <section className="retro-panel" aria-labelledby="contact-email">
        <p id="contact-email" className="retro-kicker">
          Email
        </p>
        <p className="retro-email">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </p>
        <button type="button" className="retro-btn retro-btn--small" onClick={copyEmail}>
          Copy address
        </button>
        <span className="retro-small retro-status" role="status">
          {status}
        </span>
      </section>

      <section aria-labelledby="contact-socials">
        <p id="contact-socials" className="retro-kicker">
          Socials
        </p>
        <ul className="retro-list">
          {socials.map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.name} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
