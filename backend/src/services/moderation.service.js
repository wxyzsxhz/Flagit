// Server-side content moderation. This is the authoritative check — the
// frontend's own `moderate()` is only a UX nicety and must never be
// trusted, since any client can bypass it and call the API directly.

const BAD_WORDS = ["fuck", "shit", "bitch", "asshole", "cunt", "faggot", "nigger", "retard"];
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+?\d[\d\s\-().]{7,})/;
// Blocks @mentions in any form: @username, @ username, @@username, etc.
// Users must not be able to mention/tag other users in posts or comments.
const MENTION_RE = /@\s*[a-z0-9_.]{1,32}/i;

function moderate(text) {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, reason: "Content cannot be empty." };
  }
  const lower = text.toLowerCase();

  for (const w of BAD_WORDS) {
    if (lower.includes(w)) return { ok: false, reason: "Contains disallowed language." };
  }
  if (MENTION_RE.test(text)) {
    return { ok: false, reason: "Mentioning other users (@username) isn't allowed." };
  }
  if (EMAIL_RE.test(text)) {
    return { ok: false, reason: "Please remove email addresses." };
  }
  if (PHONE_RE.test(text)) {
    return { ok: false, reason: "Please remove phone numbers." };
  }
  return { ok: true, cleaned: text.trim() };
}

module.exports = { moderate };
