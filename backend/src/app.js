const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const { apiLimiter } = require("./middleware/rateLimiter");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const userRoutes = require("./routes/user.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

// The API sits behind a reverse proxy / load balancer in production,
// so trust the first hop for correct client IPs (rate limiting, logs).
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true, // refresh-token cookie requires this
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(apiLimiter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
// Alias so /api/leaderboard also works (frontend's leaderboard.tsx route).
app.get("/api/leaderboard", (req, res, next) =>
  require("./controllers/user.controller").leaderboard(req, res, next)
);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
