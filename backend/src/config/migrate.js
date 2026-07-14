// Simple startup migration: creates tables if they don't exist yet.
// For a production system you'd swap this for umzug/sequelize-cli
// migrations, but `sync` is sufficient and safe here since it never
// drops or alters existing tables/columns.
const { sequelize } = require("../models");
const logger = require("../utils/logger");

async function migrate() {
  await sequelize.authenticate();
  logger.info("Database connection established.");
  await sequelize.sync(); // no `alter`/`force` — additive only, safe to run every boot
  logger.info("Database schema is up to date.");
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error("Migration failed", { error: err.message });
      process.exit(1);
    });
}

module.exports = migrate;
