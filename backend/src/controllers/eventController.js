const dayjs = require("dayjs");
const Event = require("../models/Event");
const Assignment = require("../models/Assignment");
const Volunteer = require("../models/Volunteer");
const User = require("../models/User");
const { httpError } = require("../utils/httpError");
const { suggestVolunteers } = require("../services/assignmentEngine");

function normalizeSkills(skills) {
  return Array.from(
    new Set(
      (skills || [])
        .map((s) => String(s || "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 50);
}

function normalizeEventPayload(payload) {
  const next = { ...payload };
  if (Array.isArray(next.requiredSkills)) next.requiredSkills = normalizeSkills(next.requiredSkills);
  if (Array.isArray(next.shifts)) {
    next.shifts = next.shifts.map((sh) => ({
      ...sh,
      requiredSkills: normalizeSkills(sh.requiredSkills)
    }));
  }
  return next;
}

async function createEvent(req, res, next) {
  try {
    const event = await Event.create({ ...normalizeEventPayload(req.body), createdBy: req.user._id });
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, normalizeEventPayload(req.body), { new: true });
    if (!event) throw httpError(404, "Event not found");
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) throw httpError(404, "Event not found");
    await Assignment.deleteMany({ eventId: event._id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) throw httpError(404, "Event not found");
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

async function listEvents(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const q = String(req.query.q || "").trim();

    const from = req.query.from ? dayjs(String(req.query.from)).toDate() : null;
    const to = req.query.to ? dayjs(String(req.query.to)).toDate() : null;

    const filter = {};
    if (q) filter.title = { $regex: q, $options: "i" };
    if (from || to) {
      filter.startDate = {};
      if (from) filter.startDate.$gte = from;
      if (to) filter.startDate.$lte = to;
    }

    const [items, total] = await Promise.all([
      Event.find(filter)
        .sort({ startDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter)
    ]);

    res.json({ page, limit, total, items });
  } catch (err) {
    next(err);
  }
}

async function suggestForEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) throw httpError(404, "Event not found");

    const shiftStart = req.body.shiftStart ? new Date(req.body.shiftStart) : event.startDate;
    const shiftEnd = req.body.shiftEnd ? new Date(req.body.shiftEnd) : event.endDate;

    const requiredSkills = normalizeSkills(event.requiredSkills || []);

    const volunteerFilter = requiredSkills.length ? { skills: { $in: requiredSkills } } : {};
    const volunteers = await Volunteer.find(volunteerFilter).limit(500).lean();

    const suggestions = suggestVolunteers({
      volunteers,
      requiredSkills,
      shiftStart,
      shiftEnd,
      limit: req.body.limit
    });

    const suggestedVolunteerIds = suggestions.map((s) => s.volunteer.userId);
    const users = await User.find({ _id: { $in: suggestedVolunteerIds } })
      .select({ name: 1, email: 1, phone: 1 })
      .lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));

    res.json({
      eventId: String(event._id),
      shiftStart,
      shiftEnd,
      requiredSkills,
      suggestions: suggestions.map((s) => ({
        volunteer: {
          id: String(s.volunteer._id),
          user: userById.get(String(s.volunteer.userId)) || null,
          skills: s.volunteer.skills || [],
          totalHours: s.volunteer.totalHours || 0
        },
        score: s.score,
        components: s.components
      }))
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createEvent, updateEvent, deleteEvent, getEvent, listEvents, suggestForEvent };
