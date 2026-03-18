const crypto = require("crypto");
const dayjs = require("dayjs");

const Attendance = require("../models/Attendance");
const ShiftToken = require("../models/ShiftToken");
const Event = require("../models/Event");
const Volunteer = require("../models/Volunteer");
const Assignment = require("../models/Assignment");
const HoursLogged = require("../models/HoursLogged");
const { httpError } = require("../utils/httpError");

const CHECKIN_EARLY_MIN = 30;
const CHECKIN_LATE_MIN = 90;
const CHECKOUT_GRACE_MIN = 180;

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function randomToken() {
  // 6-digit numeric code (easy to type on-site)
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, "0");
}

function roundDownToQuarterHour(minutes) {
  const q = Math.floor(minutes / 15);
  return q * 0.25;
}

async function recomputeTotalHours(volunteerId) {
  const agg = await HoursLogged.aggregate([
    { $match: { volunteerId, verified: true } },
    { $group: { _id: "$volunteerId", total: { $sum: "$hours" } } }
  ]);
  const total = agg[0] ? agg[0].total : 0;
  await Volunteer.findByIdAndUpdate(volunteerId, { totalHours: total });
}

async function issueShiftToken(req, res, next) {
  try {
    const { eventId, shiftId } = req.params;

    const event = await Event.findById(eventId).lean();
    if (!event) throw httpError(404, "Event not found");
    if (String(event.createdBy) !== String(req.user._id)) throw httpError(403, "Forbidden");

    const shift = (event.shifts || []).find((sh) => String(sh._id) === String(shiftId));
    if (!shift) throw httpError(404, "Shift not found");

    const token = randomToken();
    const expiresAt = dayjs().add(5, "minute").toDate();

    await ShiftToken.create({
      eventId: event._id,
      shiftId: shift._id,
      tokenHash: hashToken(token),
      expiresAt,
      createdBy: req.user._id
    });

    res.json({ token, expiresAt });
  } catch (err) {
    next(err);
  }
}

async function checkIn(req, res, next) {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) throw httpError(404, "Volunteer profile not found");

    const assignment = await Assignment.findById(req.body.assignmentId).lean();
    if (!assignment) throw httpError(404, "Assignment not found");
    if (String(assignment.volunteerId) !== String(volunteer._id)) throw httpError(403, "Forbidden");
    if (assignment.status === "cancelled") throw httpError(409, "Assignment cancelled");

    const now = dayjs();
    const start = dayjs(assignment.shiftStart);
    const end = dayjs(assignment.shiftEnd);

    const earliest = start.subtract(CHECKIN_EARLY_MIN, "minute");
    const latest = start.add(CHECKIN_LATE_MIN, "minute");
    if (now.isBefore(earliest) || now.isAfter(latest)) {
      throw httpError(409, "Check-in not allowed at this time");
    }

    let shiftId = assignment.shiftId;
    if (!shiftId) {
      const event = await Event.findById(assignment.eventId).lean();
      const sStart = new Date(assignment.shiftStart).getTime();
      const sEnd = new Date(assignment.shiftEnd).getTime();
      const matched = (event?.shifts || []).find((sh) => new Date(sh.start).getTime() === sStart && new Date(sh.end).getTime() === sEnd);
      if (!matched) throw httpError(409, "No matching shift found for this assignment");
      shiftId = matched._id;
      await Assignment.findByIdAndUpdate(assignment._id, { shiftId });
    }

    const tokenDoc = await ShiftToken.findOne({
      eventId: assignment.eventId,
      shiftId,
      expiresAt: { $gt: new Date() }
    })
      .sort({ expiresAt: -1 })
      .lean();

    if (!tokenDoc) throw httpError(409, "No active check-in code. Ask NGO to show code.");

    const provided = String(req.body.token || "").trim();
    if (hashToken(provided) !== tokenDoc.tokenHash) throw httpError(401, "Invalid check-in code");

    const existing = await Attendance.findOne({ assignmentId: assignment._id });
    if (existing && existing.checkInAt) {
      return res.json({ attendance: existing.toObject() });
    }

    const flags = [];
    if (now.isAfter(start.add(10, "minute"))) flags.push("late_checkin");

    const attendance = existing || new Attendance({
      volunteerId: volunteer._id,
      userId: req.user._id,
      eventId: assignment.eventId,
      assignmentId: assignment._id,
      shiftId,
      shiftStart: assignment.shiftStart,
      shiftEnd: assignment.shiftEnd,
      checkInMethod: "token"
    });

    attendance.checkInAt = new Date();
    attendance.flags = Array.from(new Set([...(attendance.flags || []), ...flags]));
    attendance.audit = (attendance.audit || []).concat([
      { type: "CHECK_IN", at: new Date(), meta: { method: "token" } }
    ]);

    await attendance.save();

    res.status(201).json({ attendance: attendance.toObject() });
  } catch (err) {
    next(err);
  }
}

async function checkOut(req, res, next) {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) throw httpError(404, "Volunteer profile not found");

    const assignment = await Assignment.findById(req.body.assignmentId).lean();
    if (!assignment) throw httpError(404, "Assignment not found");
    if (String(assignment.volunteerId) !== String(volunteer._id)) throw httpError(403, "Forbidden");
    if (assignment.status === "cancelled") throw httpError(409, "Assignment cancelled");

    const attendance = await Attendance.findOne({ assignmentId: assignment._id });
    if (!attendance || !attendance.checkInAt) throw httpError(409, "Not checked in yet");
    if (attendance.checkOutAt) return res.json({ attendance: attendance.toObject() });

    const now = dayjs();
    const end = dayjs(assignment.shiftEnd);
    const latest = end.add(CHECKOUT_GRACE_MIN, "minute");
    if (now.isAfter(latest)) throw httpError(409, "Check-out window expired");

    attendance.checkOutAt = new Date();
    attendance.audit = (attendance.audit || []).concat([{ type: "CHECK_OUT", at: new Date(), meta: {} }]);

    // Calculate minutes within shift boundaries
    const shiftStart = dayjs(assignment.shiftStart);
    const shiftEnd = dayjs(assignment.shiftEnd);

    const ci = dayjs(attendance.checkInAt);
    const co = dayjs(attendance.checkOutAt);

    const effectiveStart = ci.isBefore(shiftStart) ? shiftStart : ci;
    const effectiveEnd = co.isAfter(shiftEnd) ? shiftEnd : co;

    const minutes = Math.max(0, Math.round(effectiveEnd.diff(effectiveStart, "minute", true)));

    const flags = new Set(attendance.flags || []);
    if (minutes < 15) flags.add("too_short");
    if (co.isBefore(shiftStart)) flags.add("invalid_checkout");
    if (ci.isAfter(shiftEnd)) flags.add("invalid_checkin");

    const hours = minutes / 60;

    attendance.minutes = minutes;
    attendance.hours = hours;

    // Auto-verify only when clean
    const verified = flags.size === 0 && minutes >= 15;
    attendance.verified = verified;
    attendance.flags = Array.from(flags);

    await attendance.save();

    // Upsert HoursLogged from attendance
    let hoursRecord = await HoursLogged.findOne({ assignmentId: assignment._id });
    if (!hoursRecord) {
      hoursRecord = await HoursLogged.create({
        volunteerId: volunteer._id,
        eventId: assignment.eventId,
        assignmentId: assignment._id,
        hours: Math.max(0, hours || 0),
        verified
      });
    } else {
      hoursRecord.hours = Math.max(0, hours || 0);
      hoursRecord.verified = verified;
      await hoursRecord.save();
    }

    await recomputeTotalHours(volunteer._id);

    res.json({ attendance: attendance.toObject(), hoursLogged: hoursRecord.toObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = { issueShiftToken, checkIn, checkOut };
