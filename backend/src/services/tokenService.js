const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { env } = require("../utils/env");

function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });
}

function signRefreshToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_REFRESH_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  });
}

async function hashRefreshToken(token) {
  return bcrypt.hash(token, 10);
}

async function verifyRefreshTokenHash(token, hash) {
  if (!hash) return false;
  return bcrypt.compare(token, hash);
}

function setRefreshCookie(res, token) {
  const isProd = env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE || isProd,
    domain: env.COOKIE_DOMAIN,
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE || env.NODE_ENV === "production",
    domain: env.COOKIE_DOMAIN,
    path: "/api/auth/refresh"
  });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
  verifyRefreshTokenHash,
  setRefreshCookie,
  clearRefreshCookie
};
