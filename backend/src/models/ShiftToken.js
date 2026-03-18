const mongoose = require("mongoose");

const ShiftTokenSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    shiftId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

ShiftTokenSchema.index({ eventId: 1, shiftId: 1, expiresAt: -1 });

module.exports = mongoose.model("ShiftToken", ShiftTokenSchema);
