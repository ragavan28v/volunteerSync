const Assignment = require("../models/Assignment");
const Event = require("../models/Event");
const Volunteer = require("../models/Volunteer");
const { httpError } = require("../utils/httpError");

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

async function createAssignment(req, res, next) {
  try {
    const { volunteerId, eventId, shiftStart, shiftEnd, role, status } = req.body;

    const [volunteer, event] = await Promise.all([
      Volunteer.findById(volunteerId).lean(),
      Event.findById(eventId).lean()
    ]);
    if (!volunteer) throw httpError(404, "Volunteer not found");
    if (!event) throw httpError(404, "Event not found");

    const sStart = new Date(shiftStart);
    const sEnd = new Date(shiftEnd);
    if (!(sStart < sEnd)) throw httpError(400, "Invalid shift window");

    // overlap prevention
    const existing = await Assignment.find({
      volunteerId: volunteer._id,
      status: { $ne: "cancelled" },
      shiftStart: { $lt: sEnd },
      shiftEnd: { $gt: sStart }
    }).lean();

    if (existing.length) throw httpError(409, "Volunteer has an overlapping assignment");

    // capacity check: if event has an exact matching shift, enforce requiredVolunteers
    const matchingShift = (event.shifts || []).find(
      (sh) => new Date(sh.start).getTime() === sStart.getTime() && new Date(sh.end).getTime() === sEnd.getTime()
    );
    if (matchingShift) {
      const assignedCount = await Assignment.countDocuments({
        eventId: event._id,
        status: { $ne: "cancelled" },
        shiftStart: sStart,
        shiftEnd: sEnd
      });
      if (assignedCount >= (matchingShift.requiredVolunteers || 1)) {
        throw httpError(409, "Shift is already fully assigned");
      }
    }

    const assignment = await Assignment.create({
      volunteerId: volunteer._id,
      eventId: event._id,
      shiftStart: sStart,
      shiftEnd: sEnd,
      role: role || "",
      status,
      createdBy: req.user._id
    });

    res.status(201).json({ assignment });
  } catch (err) {
    next(err);
  }
}

async function listAssignments(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

    const filter = {};
    if (req.query.eventId) filter.eventId = req.query.eventId;
    if (req.query.volunteerId) filter.volunteerId = req.query.volunteerId;
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Assignment.find(filter)
        .sort({ shiftStart: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Assignment.countDocuments(filter)
    ]);

    res.json({ page, limit, total, items });
  } catch (err) {
    next(err);
  }
}

async function myAssignments(req, res, next) {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id }).lean();
    if (!volunteer) throw httpError(404, "Volunteer profile not found");

    const items = await Assignment.find({ volunteerId: volunteer._id })
      .sort({ shiftStart: -1 })
      .limit(200)
      .lean();

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function updateMyAssignmentStatus(req, res, next) {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id }).lean();
    if (!volunteer) throw httpError(404, "Volunteer profile not found");

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw httpError(404, "Assignment not found");
    if (String(assignment.volunteerId) !== String(volunteer._id)) throw httpError(403, "Forbidden");

    assignment.status = req.body.status;
    await assignment.save();

    res.json({ assignment: assignment.toObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = { createAssignment, listAssignments, myAssignments, updateMyAssignmentStatus };
