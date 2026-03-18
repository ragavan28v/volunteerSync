const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      required: true,
      index: true
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    shiftId: { type: mongoose.Schema.Types.ObjectId, index: true },
    shiftStart: { type: Date, required: true, index: true },
    shiftEnd: { type: Date, required: true, index: true },
    role: { type: String, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ["assigned", "accepted", "completed", "cancelled"],
      default: "assigned",
      index: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

AssignmentSchema.index({ volunteerId: 1, shiftStart: 1, shiftEnd: 1 });

module.exports = mongoose.model("Assignment", AssignmentSchema);
