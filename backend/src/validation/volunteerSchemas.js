const Joi = require("joi");

function timeToMinutes(hhmm) {
  const [hh, mm] = String(hhmm).split(":").map((v) => Number(v));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

const availabilitySlot = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
}).custom((slot, helpers) => {
  const s = timeToMinutes(slot.startTime);
  const e = timeToMinutes(slot.endTime);
  if (s === null || e === null) return slot;
  if (e <= s) return helpers.error("any.invalid");
  return slot;
}, "availability time window");

const updateVolunteerMeSchema = Joi.object({
  skills: Joi.array().items(Joi.string().trim().max(60)).max(50),
  availability: Joi.array().items(availabilitySlot).max(100),
  phone: Joi.string().trim().max(30).allow("")
});

module.exports = { updateVolunteerMeSchema };
