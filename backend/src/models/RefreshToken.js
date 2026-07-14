const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// The access token is a short-lived, self-contained (stateless) JWT.
// The refresh token is the only server-side session state we keep, and
// it exists purely to implement "log out after 7 days of inactivity" and
// to allow revocation (logout / password change / reset). It does not
// make the API stateful in the request-handling sense: no session data
// is held in memory, every server instance can validate a request from
// the DB + JWT alone, and any instance can serve any request.
const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    userId: { type: DataTypes.STRING(64), allowNull: false },
    tokenHash: { type: DataTypes.STRING(128), allowNull: false },
    // Sliding expiry: pushed forward by JWT_REFRESH_EXPIRES_DAYS every
    // time the token is used to mint a new access token.
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "refresh_tokens",
    indexes: [{ fields: ["userId"] }, { fields: ["tokenHash"] }],
  }
);

module.exports = RefreshToken;
