const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 280 },
    meta: { type: Object, default: {} },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);