const Event = require("../models/Event");
const Volunteer = require("../models/Volunteer");
const HoursLogged = require("../models/HoursLogged");
const User = require("../models/User");

async function overview(req, res, next) {
  try {
    const now = new Date();
    const [volunteerCount, activeEvents, verifiedHoursAgg] = await Promise.all([
      Volunteer.countDocuments({}),
      Event.countDocuments({ endDate: { $gte: now } }),
      HoursLogged.aggregate([
        { $match: { verified: true } },
        { $group: { _id: null, totalHours: { $sum: "$hours" } } }
      ])
    ]);

    const totalHours = verifiedHoursAgg[0] ? verifiedHoursAgg[0].totalHours : 0;

    const top = await Volunteer.find({})
      .sort({ totalHours: -1 })
      .limit(5)
      .lean();

    const users = await User.find({ _id: { $in: top.map((v) => v.userId) } })
      .select({ name: 1, email: 1 })
      .lean();

    const userById = new Map(users.map((u) => [String(u._id), u]));

    res.json({
      totals: {
        volunteers: volunteerCount,
        activeEvents,
        totalHours
      },
      topContributors: top.map((v) => ({
        volunteerId: String(v._id),
        totalHours: v.totalHours,
        user: userById.get(String(v.userId)) || null
      }))
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { overview };
