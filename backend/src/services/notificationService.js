const Notification = require("../models/Notification");
const { emit } = require("./notificationHub");

async function createNotification({ userId, message, meta }) {
  const doc = await Notification.create({ userId, message, meta: meta || {}, read: false });
  emit(userId, "notification", {
    id: String(doc._id),
    message: doc.message,
    meta: doc.meta,
    createdAt: doc.createdAt
  });
  return doc;
}

module.exports = { createNotification };