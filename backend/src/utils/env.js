const dotenv = require("dotenv");

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: required("MONGODB_URI"),

  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  COOKIE_SECURE: String(process.env.COOKIE_SECURE || "false") === "true",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || "admin@ngo.org",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!",
  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || "NGO Admin",
});

module.exports = { env };

