require("dotenv").config();

function required(name, fallback) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  db: {
    host: required("DB_HOST", "localhost"),
    port: parseInt(process.env.DB_PORT || "3306", 10),
    name: required("DB_NAME", "flag_nation"),
    user: required("DB_USER", "flag_app"),
    password: required("DB_PASSWORD", ""),
  },

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresDays: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || "7", 10),
    refreshCookieName: process.env.REFRESH_COOKIE_NAME || "fn_refresh",
  },

  resetTokenExpiresMin: parseInt(process.env.RESET_TOKEN_EXPIRES_MIN || "30", 10),

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: (process.env.SMTP_SECURE || "true") === "true",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM || `"Flag Nation" <${process.env.SMTP_USER}>`,
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    clientId: process.env.KAFKA_CLIENT_ID || "flag-nation-backend",
    notificationsTopic: process.env.KAFKA_NOTIFICATIONS_TOPIC || "notifications",
    groupId: process.env.KAFKA_GROUP_ID || "flag-nation-notifications-worker",
  },

  dailyLoginKarma: parseInt(process.env.DAILY_LOGIN_KARMA || "5", 10),
};
