const { verifyAccessToken } = require("../utils/jwt");
const { User } = require("../models");

// Stateless auth: the access token's signature + expiry is all that's
// checked here — no DB/session lookup on the hot path. Revocation (logout,
// password change) is handled at the refresh-token layer, not here, which
// is the standard short-lived-access/long-lived-refresh tradeoff: a
// revoked user stays "logged in" for at most one access-token lifetime
// (JWT_ACCESS_EXPIRES_IN, default 15 min).
function requireAuth() {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) return res.status(401).json({ error: "Authentication required." });

      const payload = verifyAccessToken(token);
      const user = await User.findByPk(payload.sub);
      if (!user) return res.status(401).json({ error: "Account no longer exists." });

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired session." });
    }
  };
}

// Attaches req.user if a valid token is present, but never rejects the
// request — for endpoints that are public but personalize when logged in
// (e.g. GET /posts showing "did I already vote on this").
function optionalAuth() {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (!token) return next();
      const payload = verifyAccessToken(token);
      const user = await User.findByPk(payload.sub);
      if (user) req.user = user;
    } catch {
      // ignore invalid token on optional routes
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth };
