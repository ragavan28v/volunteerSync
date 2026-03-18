const mongoose = require("mongoose");

const AuditEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, maxlength: 40 },
    at: { type: Date, default: Date.now },
    meta: { type: Object, default: {} }
  },
  { _id: false }
);

const AttendanceSchema = new mongoose.Schema(
  {
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "Volunteer", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true, unique: true },
    shiftId: { type: mongoose.Schema.Types.ObjectId, index: true },

    shiftStart: { type: Date, required: true },
    shiftEnd: { type: Date, required: true },

    checkInAt: { type: Date },
    checkOutAt: { type: Date },
    checkInMethod: { type: String, enum: ["token", "manual"], default: "token" },

    minutes: { type: Number, default: 0 },
    hours: { type: Number, default: 0 },

    flags: { type: [String], default: [] },
    verified: { type: Boolean, default: false, index: true },

    audit: { type: [AuditEventSchema], default: [] }
  },
  { timestamps: true }
);

AttendanceSchema.index({ eventId: 1, createdAt: -1 });
AttendanceSchema.index({ volunteerId: 1, createdAt: -1 });

module.exports = mongoose.model("Attendance", AttendanceSchema);
