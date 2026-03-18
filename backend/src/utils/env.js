const dotenv = require("dotenv");

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function requiredOrDevDefault(name, devDefault) {
  const value = process.env[name];
  if (value) return value;
  if ((process.env.NODE_ENV || "development") !== "production") return devDefault;
  throw new Error(`Missing env var: ${name}`);
}

const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),

  MONGODB_URI: requiredOrDevDefault(
    "MONGODB_URI",
    "mongodb://127.0.0.1:27017/volunteer_sync"
  ),

  JWT_ACCESS_SECRET: requiredOrDevDefault("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
  JWT_REFRESH_SECRET: requiredOrDevDefault("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  COOKIE_SECURE: String(process.env.COOKIE_SECURE || "false") === "true",
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || "admin@ngo.org",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!",
  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || "NGO Admin"
});

module.exports = { env, required };