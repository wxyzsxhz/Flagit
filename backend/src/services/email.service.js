const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../utils/logger");

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: { user: env.smtp.user, pass: env.smtp.password },
});

async function sendPasswordResetEmail(toEmail, username, resetLink) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <h2>Reset your Flag Nation password</h2>
      <p>Hi ${escapeHtml(username)},</p>
      <p>We received a request to reset your password. Click the button below to
      choose a new one. This link expires in ${env.resetTokenExpiresMin} minutes.</p>
      <p style="margin:24px 0">
        <a href="${resetLink}" style="background:#111;color:#fff;padding:12px 20px;
        border-radius:8px;text-decoration:none;display:inline-block">Reset password</a>
      </p>
      <p>If you didn't request this, you can safely ignore this email — your
      password won't change.</p>
      <p style="color:#888;font-size:12px">Link not working? Copy and paste this
      URL into your browser:<br>${resetLink}</p>
    </div>`;

  await transporter.sendMail({
    from: env.smtp.from,
    to: toEmail,
    subject: "Reset your Flag Nation password",
    html,
  });
  logger.info("Password reset email sent", { to: toEmail });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

module.exports = { sendPasswordResetEmail };
