const User = require("../models/User");
const Volunteer = require("../models/Volunteer");
const { httpError } = require("../utils/httpError");

function normalizeSkills(skills) {
  return Array.from(
    new Set(
      (skills || [])
        .map((s) => String(s || "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 50);
}

async function getMe(req, res, next) {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id }).lean();
    if (!volunteer) throw httpError(404, "Volunteer profile not found");

    res.json({ volunteer });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { skills, availability, phone } = req.body;

    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) throw httpError(404, "Volunteer profile not found");

    if (Array.isArray(skills)) volunteer.skills = normalizeSkills(skills);
    if (Array.isArray(availability)) volunteer.availability = availability;
    await volunteer.save();

    if (typeof phone === "string") {
      await User.findByIdAndUpdate(req.user._id, { phone });
    }

    res.json({ volunteer: volunteer.toObject() });
  } catch (err) {
    next(err);
  }
}

async function listVolunteers(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const q = String(req.query.q || "").trim().toLowerCase();
    const skill = String(req.query.skill || "").trim().toLowerCase();

    const matchUser = {};
    if (q) {
      matchUser.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } }
      ];
    }

    const userIds = q
      ? (await User.find(matchUser).select({ _id: 1 }).lean()).map((u) => u._id)
      : null;

    const matchVolunteer = {};
    if (userIds) matchVolunteer.userId = { $in: userIds };
    if (skill) matchVolunteer.skills = { $in: [skill] };

    const [items, total] = await Promise.all([
      Volunteer.find(matchVolunteer)
        .sort({ totalHours: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Volunteer.countDocuments(matchVolunteer)
    ]);

    const users = await User.find({ _id: { $in: items.map((v) => v.userId) } })
      .select({ name: 1, email: 1, phone: 1 })
      .lean();

    const userById = new Map(users.map((u) => [String(u._id), u]));

    res.json({
      page,
      limit,
      total,
      items: items.map((v) => ({
        ...v,
        user: userById.get(String(v.userId)) || null
      }))
    });
  } catch (err) {
    next(err);
  }
}

async function getVolunteerById(req, res, next) {
  try {
    const v = await Volunteer.findById(req.params.id).lean();
    if (!v) throw httpError(404, "Volunteer not found");
    const user = await User.findById(v.userId).select({ name: 1, email: 1, phone: 1 }).lean();

    res.json({ volunteer: { ...v, user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, listVolunteers, getVolunteerById };
