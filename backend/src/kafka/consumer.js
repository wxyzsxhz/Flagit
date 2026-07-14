// Standalone worker process (run via `npm run worker`, its own container
// in docker-compose). Subscribes to the notifications topic and turns
// each event into a row in the `notifications` table. Keeping this out
// of the API request path is what "use kafka if necessary" buys us here:
// the notification service can be scaled, restarted, or fail independently
// of the main API, and events aren't lost if it's briefly down (Kafka
// retains them and redelivers on reconnect).
const { Kafka } = require("kafkajs");
const env = require("../config/env");
const logger = require("../utils/logger");
const { makeId } = require("../utils/id");
const { sequelize, Notification } = require("../models");

const kafka = new Kafka({ clientId: `${env.kafka.clientId}-worker`, brokers: env.kafka.brokers });
const consumer = kafka.consumer({ groupId: env.kafka.groupId });

async function handleEvent(event) {
  await Notification.create({
    id: makeId("n"),
    userId: event.userId,
    type: event.type,
    actorId: event.actorId || null,
    actorName: event.actorName || null,
    postId: event.postId || null,
    commentId: event.commentId || null,
    message: event.message,
    meta: event.meta || null,
    read: false,
  });
}

async function run() {
  await sequelize.authenticate();
  await consumer.connect();
  await consumer.subscribe({ topic: env.kafka.notificationsTopic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        await handleEvent(event);
      } catch (err) {
        logger.error("Failed to process notification event", { error: err.message });
        // Intentionally swallow: a poison message shouldn't wedge the consumer.
      }
    },
  });

  logger.info("Notification worker is running", { topic: env.kafka.notificationsTopic });
}

if (require.main === module) {
  run().catch((err) => {
    logger.error("Notification worker crashed", { error: err.message });
    process.exit(1);
  });
}

module.exports = { run };
