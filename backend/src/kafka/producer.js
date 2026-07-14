const { Kafka, Partitioners } = require("kafkajs");
const env = require("../config/env");
const logger = require("../utils/logger");

const kafka = new Kafka({ clientId: env.kafka.clientId, brokers: env.kafka.brokers });
const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

let connected = false;
async function connect() {
  if (connected) return;
  await producer.connect();
  connected = true;
  logger.info("Kafka producer connected");
}

// Publishes a notification-worthy event. The API request that triggers
// this (e.g. "like a post") returns to the client immediately — the
// notification itself is created asynchronously by the consumer worker,
// so the request path never blocks on notification delivery and stays
// resilient if Kafka is briefly unavailable (see the try/catch below).
async function publishNotificationEvent(event) {
  try {
    await connect();
    await producer.send({
      topic: env.kafka.notificationsTopic,
      messages: [{ key: event.userId, value: JSON.stringify(event) }],
    });
  } catch (err) {
    // Never let a notification-publish failure break the user's action
    // (e.g. their vote/comment should still succeed even if Kafka is down).
    logger.error("Failed to publish notification event", { error: err.message, event });
  }
}

async function disconnect() {
  if (!connected) return;
  await producer.disconnect();
  connected = false;
}

module.exports = { publishNotificationEvent, connect, disconnect };
