const logger = require("../utils/logger");

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: "Not found." });
}

// Centralized error handler: never leak stack traces / internals to the
// client, always log the real error server-side.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || (err.name === "SequelizeUniqueConstraintError" ? 409 : 500);
  const message =
    status === 500 ? "Something went wrong. Please try again." : err.message || "Request failed.";

  if (status >= 500) {
    logger.error("Unhandled error", { error: err.message, stack: err.stack, path: req.path });
  }
  res.status(status).json({ error: message });
}

module.exports = { ApiError, notFound, errorHandler };
