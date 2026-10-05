import { useState } from "react";
import { contact, socials } from "@/data/profile";

export function ContactApp() {
  const [status, setStatus] = useState("");

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus("Couldn't copy. Select the address instead.");
    }
  };

  return (
    <div className="retro-stack">
      <p className="retro-h">Let's chit-chat</p>
      <p>{contact.blurb}</p>

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
