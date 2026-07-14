const { Sequelize } = require("sequelize");
const env = require("./env");
const logger = require("../utils/logger");

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: "mysql",
  logging: env.nodeEnv === "development" ? (msg) => logger.debug(msg) : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    // We use uuid strings as primary keys (id) throughout, matching the
    // frontend's existing string-id data model (u1, p1, c1, ...).
    timestamps: true,
  },
});

module.exports = sequelize;
