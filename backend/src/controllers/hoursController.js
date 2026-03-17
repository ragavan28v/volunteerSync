const HoursLogged = require("../models/HoursLogged");
const Volunteer = require("../models/Volunteer");
const Assignment = require("../models/Assignment");
const { httpError } = require("../utils/httpError");

async function recomputeTotalHours(volunteerId) {
  const agg = await HoursLogged.aggregate([
    { $match: { volunteerId, verified: true } },
    { $group: { _id: "$volunteerId", total: { $sum: "$hours" } } }
  ]);

  const total = agg[0] ? agg[0].total : 0;
  await Volunteer.findByIdAndUpdate(volunteerId, { totalHours: total });
}

async function logHours(req, res, next) {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id }).lean();
    if (!volunteer) throw httpError(404, "Volunteer profile not found");

    const { eventId, assignmentId, hours } = req.body;

    if (assignmentId) {
      const assignment = await Assignment.findById(assignmentId).lean();
      if (!assignment) throw httpError(404, "Assignment not found");
      if (String(assignment.volunteerId) !== String(volunteer._id)) throw httpError(403, "Forbidden");
      if (String(assignment.eventId) !== String(eventId)) throw httpError(400, "Event mismatch");
    }

    const record = await HoursLogged.create({
      volunteerId: volunteer._id,
      eventId,
      assignmentId: assignmentId || undefined,
      hours,
      verified: false
    });

    res.status(201).json({ hoursLogged: record });
  } catch (err) {
    next(err);
  }
}

async function myHours(req, res, next) {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id }).lean();
    if (!volunteer) throw httpError(404, "Volunteer profile not found");

    const items = await HoursLogged.find({ volunteerId: volunteer._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

async function listHours(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

    const filter = {};
    if (req.query.eventId) filter.eventId = req.query.eventId;
    if (req.query.volunteerId) filter.volunteerId = req.query.volunteerId;
    if (req.query.verified === "true") filter.verified = true;
    if (req.query.verified === "false") filter.verified = false;

    const [items, total] = await Promise.all([
      HoursLogged.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      HoursLogged.countDocuments(filter)
    ]);

    res.json({ page, limit, total, items });
  } catch (err) {
    next(err);
  }
}

async function verifyHours(req, res, next) {
  try {
    const record = await HoursLogged.findById(req.params.id);
    if (!record) throw httpError(404, "Hours record not found");

    record.verified = req.body.verified;
    await record.save();

    await recomputeTotalHours(record.volunteerId);

    res.json({ hoursLogged: record.toObject() });
  } catch (err) {
    next(err);
  }
}

module.exports = { logHours, myHours, listHours, verifyHours };
