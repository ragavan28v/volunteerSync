const jwt = require("jsonwebtoken");
const { env } = require("../utils/env");
const { httpError } = require("../utils/httpError");
const User = require("../models/User");

async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const parts = header.split(" ");
    const scheme = parts[0];
    const token = parts[1];

    if (scheme !== "Bearer" || !token) throw httpError(401, "Unauthorized");

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) throw httpError(401, "Unauthorized");

    req.user = user;
    next();
  } catch (err) {
    next(httpError(401, "Unauthorized"));
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return next(httpError(401, "Unauthorized"));
    if (req.user.role !== role) return next(httpError(403, "Forbidden"));
    next();
  };
}

module.exports = { authRequired, requireRole };
