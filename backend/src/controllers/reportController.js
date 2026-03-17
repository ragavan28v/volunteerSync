const { Parser } = require("json2csv");
const dayjs = require("dayjs");
const Volunteer = require("../models/Volunteer");
const User = require("../models/User");
const HoursLogged = require("../models/HoursLogged");

async function volunteersCsv(req, res, next) {
  try {
    const from = req.query.from ? dayjs(String(req.query.from)).toDate() : null;
    const to = req.query.to ? dayjs(String(req.query.to)).toDate() : null;

    const filter = { verified: true };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    const volunteers = await Volunteer.find({}).lean();
    const users = await User.find({ _id: { $in: volunteers.map((v) => v.userId) } })
      .select({ name: 1, email: 1, phone: 1 })
      .lean();

    const hoursAgg = await HoursLogged.aggregate([
      { $match: filter },
      { $group: { _id: "$volunteerId", verifiedHours: { $sum: "$hours" } } }
    ]);

    const hoursByVolunteer = new Map(hoursAgg.map((h) => [String(h._id), h.verifiedHours]));
    const userById = new Map(users.map((u) => [String(u._id), u]));

    const rows = volunteers.map((v) => {
      const u = userById.get(String(v.userId));
      return {
        volunteerId: String(v._id),
        name: u ? u.name : "",
        email: u ? u.email : "",
        phone: u ? u.phone || "" : "",
        skills: (v.skills || []).join(";"),
        totalHours: v.totalHours,
        verifiedHoursInRange: Number(hoursByVolunteer.get(String(v._id)) || 0)
      };
    });

    const parser = new Parser({ fields: Object.keys(rows[0] || { volunteerId: "" }) });
    const csv = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=volunteers.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = { volunteersCsv };
