const mongoose = require("mongoose");

const AvailabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true } // "HH:mm"
  },
  { _id: false }
);

const VolunteerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    skills: { type: [String], default: [], index: true },
    availability: { type: [AvailabilitySlotSchema], default: [] },
    totalHours: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Volunteer", VolunteerSchema);
