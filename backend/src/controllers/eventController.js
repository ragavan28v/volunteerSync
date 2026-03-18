const dayjs = require("dayjs");
const Event = require("../models/Event");
const Assignment = require("../models/Assignment");
const Volunteer = require("../models/Volunteer");
const User = require("../models/User");
const { httpError } = require("../utils/httpError");
const { suggestVolunteers } = require("../services/assignmentEngine");
const { createNotification } = require("../services/notificationService");

function normalizeSkills(skills) {
  return Array.from(
    new Set(
      (skills || [])
        .map((s) => String(s || "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 50);
}

function normalizeRestrictions(r) {
  const gender = String(r?.gender || "any").toLowerCase();
  const minAge = r && r.minAge !== null && r.minAge !== undefined ? Number(r.minAge) : null;
  const maxAge = r && r.maxAge !== null && r.maxAge !== undefined ? Number(r.maxAge) : null;
  return {
    gender: ["any", "male", "female", "other", "prefer_not_say"].includes(gender) ? gender : "any",
    minAge: Number.isFinite(minAge) ? minAge : null,
    maxAge: Number.isFinite(maxAge) ? maxAge : null
  };
}

function volunteerMatchesRestrictions(volunteer, restrictions) {
  const r = normalizeRestrictions(restrictions);

  if (r.gender && r.gender !== "any") {
    const vg = String(volunteer.gender || "prefer_not_say").toLowerCase();
    if (vg !== r.gender) return false;
  }

  const age = Number(volunteer.age);
  const hasAge = Number.isFinite(age) && age > 0;

  if (r.minAge !== null) {
    if (!hasAge) return false;
    if (age < r.minAge) return false;
  }
  if (r.maxAge !== null) {
    if (!hasAge) return false;
    if (age > r.maxAge) return false;
  }

  return true;
}

function restrictionsToVolunteerQuery(restrictions) {
  const r = normalizeRestrictions(restrictions);
  const q = {};
  if (r.gender && r.gender !== "any") q.gender = r.gender;
  if (r.minAge !== null || r.maxAge !== null) {
    q.age = {};
    if (r.minAge !== null) q.age.$gte = r.minAge;
    if (r.maxAge !== null) q.age.$lte = r.maxAge;
  }
  return q;
}

function normalizeEventPayload(payload) {
  const next = { ...payload };
  if (typeof next.contact === "string") next.contact = next.contact.trim();
  if (next.restrictions) next.restrictions = normalizeRestrictions(next.restrictions);
  if (Array.isArray(next.requiredSkills)) next.requiredSkills = normalizeSkills(next.requiredSkills);
  if (Array.isArray(next.shifts)) {
    next.shifts = next.shifts.map((sh) => ({
      ...sh,
      requiredSkills: normalizeSkills(sh.requiredSkills)
    }));
  }
  return next;
}

async function notifyMatches(event) {
  const requiredSkills = normalizeSkills(event.requiredSkills || []);
  const restrictions = event.restrictions || { gender: "any", minAge: null, maxAge: null };
  const shiftStart = event.startDate;
  const shiftEnd = event.endDate;

  const volunteerFilter = requiredSkills.length ? { skills: { $in: requiredSkills } } : {};
  const restrictionQuery = restrictionsToVolunteerQuery(restrictions);
  const volunteers = await Volunteer.find({ ...volunteerFilter, ...restrictionQuery }).limit(1200).lean();

  if (!volunteers.length) return;

  const suggestions = suggestVolunteers({
    volunteers,
    requiredSkills,
    shiftStart,
    shiftEnd,
    limit: 60
  });

  const title = event.title;
  const when = dayjs(event.startDate).format("D MMM");

  const threshold = 0.55;

  for (const s of suggestions) {
    const skillOk = requiredSkills.length ? s.components.skillMatch > 0 : true;
    const availOk = s.components.availability >= 1;
    if (!skillOk || !availOk || s.score < threshold) continue;

    await createNotification({
      userId: s.volunteer.userId,
      message: `You are a great match for “${title}” (${when}).`,
      meta: { type: "event_match", eventId: String(event._id), score: s.score }
    });
  }
}

async function createEvent(req, res, next) {
  try {
    const payload = normalizeEventPayload(req.body);

    // ensureDefaultShift: if UI didn't send shifts, create one covering the event window
    if (!Array.isArray(payload.shifts) || payload.shifts.length === 0) {
      payload.shifts = [
        {
          start: payload.startDate,
          end: payload.endDate,
          requiredVolunteers: payload.requiredVolunteers || 1,
          requiredSkills: payload.requiredSkills || []
        }
      ];
    }

    const event = await Event.create({ ...payload, createdBy: req.user._id });

    // fire-and-forget match notifications
    notifyMatches(event).catch(() => {});

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
    const doc = await Event.findById(req.params.id);
    if (!doc) throw httpError(404, "Event not found");

    // backfill shifts for older events (ensures shift _id exists for code generation)
    if (!doc.shifts || doc.shifts.length === 0) {
      doc.shifts = [
        {
          start: doc.startDate,
          end: doc.endDate,
          requiredVolunteers: doc.requiredVolunteers || 1,
          requiredSkills: doc.requiredSkills || []
        }
      ];
      await doc.save();
    }

    res.json({ event: doc.toObject() });
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

async function recommendEvents(req, res, next) {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id }).lean();
    if (!volunteer) throw httpError(404, "Volunteer profile not found");

    const now = new Date();
    const upcoming = await Event.find({ endDate: { $gte: now } }).sort({ startDate: 1 }).limit(60).lean();

    const scored = upcoming
      .map((event) => {
        if (!volunteerMatchesRestrictions(volunteer, event.restrictions)) {
          return { event, score: 0, components: { skillMatch: 0, availability: 0 }, blockedByRestrictions: true };
        }
        const requiredSkills = normalizeSkills(event.requiredSkills || []);
  const restrictions = event.restrictions || { gender: "any", minAge: null, maxAge: null };
        const suggestions = suggestVolunteers({
          volunteers: [volunteer],
          requiredSkills,
          shiftStart: event.startDate,
          shiftEnd: event.endDate,
          limit: 1
        });

        const s = suggestions[0];
        const score = s ? s.score : 0;
        const skill = s ? s.components.skillMatch : 0;
        const avail = s ? s.components.availability : 0;

        return { event, score, components: { skillMatch: skill, availability: avail }, blockedByRestrictions: false };
      })
      .sort((a, b) => b.score - a.score);

    const recommended = scored.filter((x) => x.score >= 0.5).slice(0, 10);

    res.json({
      recommended: recommended.map((r) => ({
        event: r.event,
        score: r.score,
        components: r.components
      })),
      items: upcoming
    });
  } catch (err) {
    next(err);
  }
}

async function expressInterest(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) throw httpError(404, "Event not found");

    await createNotification({
      userId: event.createdBy,
      message: `${req.user.name} is interested in “${event.title}”.`,
      meta: { type: "interest", eventId: String(event._id), volunteerUserId: String(req.user._id) }
    });

    res.json({ ok: true });
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
  const restrictions = event.restrictions || { gender: "any", minAge: null, maxAge: null };

    const volunteerFilter = requiredSkills.length ? { skills: { $in: requiredSkills } } : {};
  const restrictionQuery = restrictionsToVolunteerQuery(restrictions);
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



async function autoFill(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) throw httpError(404, "Event not found");
    if (String(event.createdBy) !== String(req.user._id)) throw httpError(403, "Forbidden");

    const dryRun = Boolean(req.body.dryRun);
    const maxCandidatesPerShift = Number(req.body.maxCandidatesPerShift || 60);

    const shifts = (event.shifts && event.shifts.length)
      ? event.shifts
      : [{ _id: null, start: event.startDate, end: event.endDate, requiredVolunteers: event.requiredVolunteers || 1, requiredSkills: event.requiredSkills || [] }];

    let created = 0;
    let skippedOverlap = 0;
    let skippedFull = 0;

    for (const sh of shifts) {
      const shiftStart = new Date(sh.start);
      const shiftEnd = new Date(sh.end);
      const needed = Number(sh.requiredVolunteers || 1);
      const requiredSkills = normalizeSkills(sh.requiredSkills && sh.requiredSkills.length ? sh.requiredSkills : event.requiredSkills || []);

      const existingCount = await Assignment.countDocuments({
        eventId: event._id,
        status: { $ne: "cancelled" },
        shiftStart,
        shiftEnd
      });

      let remaining = Math.max(0, needed - existingCount);
      if (!remaining) continue;

      const volunteerFilter = requiredSkills.length ? { skills: { $in: requiredSkills } } : {};
      const restrictions = normalizeRestrictions(event.restrictions);
      const restrictionQuery = restrictionsToVolunteerQuery(restrictions);
      const volunteers = await Volunteer.find({ ...volunteerFilter, ...restrictionQuery }).limit(2000).lean();
      if (!volunteers.length) continue;

      const suggestions = suggestVolunteers({
        volunteers,
        requiredSkills,
        shiftStart,
        shiftEnd,
        limit: Math.max(remaining * 6, Math.min(300, maxCandidatesPerShift))
      });

      for (const sug of suggestions) {
        if (remaining <= 0) break;

        const overlap = await Assignment.findOne({
          volunteerId: sug.volunteer._id,
          status: { $ne: "cancelled" },
          shiftStart: { $lt: shiftEnd },
          shiftEnd: { $gt: shiftStart }
        }).lean();

        if (overlap) {
          skippedOverlap += 1;
          continue;
        }

        const currentCount = await Assignment.countDocuments({
          eventId: event._id,
          status: { $ne: "cancelled" },
          shiftStart,
          shiftEnd
        });
        if (currentCount >= needed) {
          skippedFull += 1;
          break;
        }

        if (dryRun) {
          remaining -= 1;
          created += 1;
          continue;
        }

        await Assignment.create({
          volunteerId: sug.volunteer._id,
          eventId: event._id,
          shiftId: sh._id || undefined,
          shiftStart,
          shiftEnd,
          role: "",
          status: "assigned",
          createdBy: req.user._id
        });

        await createNotification({
          userId: sug.volunteer.userId,
          message: `You were assigned to "${event.title}". Shift: ${dayjs(shiftStart).format("D MMM, h:mm A")} - ${dayjs(shiftEnd).format("h:mm A")}.`,
          meta: { type: "assignment", eventId: String(event._id), shiftStart: shiftStart.toISOString(), shiftEnd: shiftEnd.toISOString() }
        });

        remaining -= 1;
        created += 1;
      }
    }

    res.json({ created, skippedOverlap, skippedFull, dryRun });
  } catch (err) {
    next(err);
  }
}

async function raiseQuery(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) throw httpError(404, "Event not found");

    const message = String(req.body.message || "").trim();
    if (!message) throw httpError(400, "Message is required");

    const from = req.user?.name ? `${req.user.name} (${req.user.email})` : req.user?.email || "Volunteer";

    await createNotification({
      userId: event.createdBy,
      message: `Query for "${event.title}": ${message} - from ${from}`,
      meta: { type: "event_query", eventId: String(event._id), fromUserId: String(req.user._id) }
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  listEvents,
  suggestForEvent,
  recommendEvents,
  expressInterest,
  autoFill,
  raiseQuery
};