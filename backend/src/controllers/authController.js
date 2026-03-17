const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Volunteer = require("../models/Volunteer");
const { env } = require("../utils/env");
const { httpError } = require("../utils/httpError");
const { hashPassword, verifyPassword } = require("../services/passwordService");
const {
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
  verifyRefreshTokenHash,
  setRefreshCookie,
  clearRefreshCookie
} = require("../services/tokenService");

function safeUser(u) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    role: u.role
  };
}

async function signup(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ email }).lean();
    if (existing) throw httpError(409, "Email already in use");

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone: phone || "",
      role: "volunteer",
      passwordHash
    });

    await Volunteer.create({ userId: user._id, skills: [], availability: [], totalHours: 0 });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = await hashRefreshToken(refreshToken);
    user.lastLoginAt = new Date();
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.status(201).json({ user: safeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw httpError(401, "Invalid credentials");

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw httpError(401, "Invalid credentials");

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokenHash = await hashRefreshToken(refreshToken);
    user.lastLoginAt = new Date();
    await user.save();

    setRefreshCookie(res, refreshToken);

    res.json({ user: safeUser(user), accessToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) throw httpError(401, "Unauthorized");

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch (e) {
      throw httpError(401, "Unauthorized");
    }

    const user = await User.findById(payload.sub);
    if (!user) throw httpError(401, "Unauthorized");

    const ok = await verifyRefreshTokenHash(token, user.refreshTokenHash);
    if (!ok) throw httpError(401, "Unauthorized");

    const accessToken = signAccessToken(user);

    // rotate refresh token
    const newRefresh = signRefreshToken(user);
    user.refreshTokenHash = await hashRefreshToken(newRefresh);
    await user.save();
    setRefreshCookie(res, newRefresh);

    res.json({ accessToken, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(payload.sub, { $unset: { refreshTokenHash: 1 } });
      } catch (e) {
        // ignore
      }
    }

    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) throw httpError(401, "Unauthorized");

    let volunteer = null;
    if (user.role === "volunteer") {
      volunteer = await Volunteer.findOne({ userId: user._id }).lean();
    }

    res.json({ user: safeUser(user), volunteer });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh, logout, me };
