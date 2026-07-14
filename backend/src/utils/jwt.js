const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret); // throws on invalid/expired
}

// Refresh tokens are opaque random strings (not JWTs). We only ever store
// a SHA-256 hash of them, so a leaked DB row can't be replayed as a token.
function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

module.exports = { signAccessToken, verifyAccessToken, generateRefreshToken, hashToken };
