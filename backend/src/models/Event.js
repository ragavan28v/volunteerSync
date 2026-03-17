const mongoose = require("mongoose");

const ShiftSchema = new mongoose.Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    requiredVolunteers: { type: Number, default: 1, min: 1 },
    requiredSkills: { type: [String], default: [] }
  },
  { _id: true }
);

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 5000 },
    location: { type: String, trim: true, maxlength: 240 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    requiredVolunteers: { type: Number, default: 1, min: 1 },
    requiredSkills: { type: [String], default: [] },
    shifts: { type: [ShiftSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);
