const { Op } = require("sequelize");
const env = require("../config/env");
const { makeId } = require("../utils/id");
const { signAccessToken, generateRefreshToken, hashToken } = require("../utils/jwt");
const { RefreshToken } = require("../models");

function refreshExpiryDate() {
  return new Date(Date.now() + env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000);
}

// Issues a fresh access token + a brand new refresh token row for the
// user, and sets it as an httpOnly cookie. Called on login AND on every
// successful /refresh (rotation) — each refresh both proves activity and
// slides the 7-day expiry forward, giving the "log out after a week of
// inactivity" behavior the spec asks for.
async function issueSession(user, req, res) {
  const accessToken = signAccessToken(user);
  const { raw, hash } = generateRefreshToken();

  await RefreshToken.create({
    id: makeId("rt"),
    userId: user.id,
    tokenHash: hash,
    expiresAt: refreshExpiryDate(),
    userAgent: req.headers["user-agent"]?.slice(0, 255),
  });

  res.cookie(env.jwt.refreshCookieName, raw, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  return accessToken;
}

// Validates the refresh cookie, rotates it (old one revoked, new one
// issued), and returns a new access token. Rotation means a stolen,
// already-used refresh token is worthless to an attacker.
async function rotateSession(rawToken, req, res) {
  if (!rawToken) return null;
  const hash = hashToken(rawToken);
  const record = await RefreshToken.findOne({
    where: { tokenHash: hash, revokedAt: null, expiresAt: { [Op.gt]: new Date() } },
  });
  if (!record) return null;

  record.revokedAt = new Date();
  await record.save();

  const { User } = require("../models");
  const user = await User.findByPk(record.userId);
  if (!user) return null;

  const accessToken = await issueSession(user, req, res);
  return { accessToken, user };
}

async function revokeSession(rawToken) {
  if (!rawToken) return;
  const hash = hashToken(rawToken);
  await RefreshToken.update({ revokedAt: new Date() }, { where: { tokenHash: hash, revokedAt: null } });
}

// Revokes every active session for a user — used on password change/reset
// so old sessions can't linger after a credential compromise is fixed.
async function revokeAllSessions(userId) {
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } }
  );
}

function clearRefreshCookie(res) {
  res.clearCookie(env.jwt.refreshCookieName, { path: "/api/auth" });
}

module.exports = { issueSession, rotateSession, revokeSession, revokeAllSessions, clearRefreshCookie };
