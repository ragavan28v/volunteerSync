const mongoose = require("mongoose");

const HoursLoggedSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      required: true,
      index: true
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
    hours: { type: Number, required: true, min: 0.25, max: 24 },
    verified: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

HoursLoggedSchema.index({ volunteerId: 1, eventId: 1, createdAt: -1 });

module.exports = mongoose.model("HoursLogged", HoursLoggedSchema);
