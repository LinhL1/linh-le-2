import emailjs from "@emailjs/browser";

// EmailJS sends the message from the browser, so there's no backend. These IDs are public by
// design; abuse is limited from the EmailJS dashboard (allowed origins, rate limits).
const EMAILJS = {
  serviceId: "service_hhcqstc",
  templateId: "template_v3jut8s",
  publicKey: "6c5-lTchA_jm6cYT0",
};

export interface ContactMessage {
  name: string;
  /** Optional reply-to address. */
  email: string;
  message: string;
}

/** Shared by the classic Postcard and the retro Contact app. Rejects if EmailJS fails. */
export async function sendMessage(msg: ContactMessage): Promise<void> {
  await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, { ...msg }, EMAILJS.publicKey);
}
