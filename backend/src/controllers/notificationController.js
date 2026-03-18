const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { env } = require("../utils/env");
const { httpError } = require("../utils/httpError");
const { addClient, removeClient, emit } = require("../services/notificationHub");

async function listNotifications(req, res, next) {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const unreadOnly = String(req.query.unread || "").toLowerCase() === "true";

    const filter = { userId: req.user._id };
    if (unreadOnly) filter.read = false;

    const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    res.json({ unreadCount, items });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const doc = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } },
      { new: true }
    ).lean();

    if (!doc) throw httpError(404, "Notification not found");

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    emit(req.user._id, "unread", { unreadCount });

    res.json({ notification: doc, unreadCount });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
    emit(req.user._id, "unread", { unreadCount: 0 });
    res.json({ ok: true, unreadCount: 0 });
  } catch (err) {
    next(err);
  }
}

async function stream(req, res, next) {
  try {
    let user = req.user;

    // EventSource can't send Authorization headers in browsers; allow query token for dev.
    if (!user && req.query.accessToken) {
      const token = String(req.query.accessToken);
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      user = await User.findById(payload.sub).lean();
    }

    if (!user) throw httpError(401, "Unauthorized");

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });

    res.write("event: ready\ndata: {}\n\n");

    addClient(user._id, res);

    const unreadCount = await Notification.countDocuments({ userId: user._id, read: false });
    emit(user._id, "unread", { unreadCount });

    req.on("close", () => {
      removeClient(user._id, res);
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markRead, markAllRead, stream };