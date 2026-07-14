const app = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");
const migrate = require("./config/migrate");
const { connect: connectKafkaProducer } = require("./kafka/producer");

async function start() {
  // Runs schema sync before accepting traffic so the container is never
  // "up" without a usable database underneath it (important for the
  // Docker healthcheck / orchestration to behave correctly).
  await migrate();

  // Best-effort: the API should still serve requests even if Kafka isn't
  // reachable yet at boot (see producer.js — publish failures are caught).
  connectKafkaProducer().catch((err) =>
    logger.warn("Kafka producer could not connect at startup, will retry lazily", { error: err.message })
  );

  const server = app.listen(env.port, () => {
    logger.info(`Flag Nation API listening on port ${env.port}`, { env: env.nodeEnv });
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  logger.error("Failed to start server", { error: err.message, stack: err.stack });
  process.exit(1);
});
