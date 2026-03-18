const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const compression = require("compression");
const morgan = require("morgan");

const { env } = require("./utils/env");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const eventRoutes = require("./routes/eventRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const hoursRoutes = require("./routes/hoursRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(hpp());
  app.use(mongoSanitize());
  app.use(compression());
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (req, res) => res.json({ ok: true }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === "production" ? 50 : 200,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/volunteers", volunteerRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/assignments", assignmentRoutes);
  app.use("/api/hours", hoursRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/attendance", attendanceRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

