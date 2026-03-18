const Joi = require("joi");

function timeToMinutes(hhmm) {
  const parts = String(hhmm).split(":");
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
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

const signupVolunteerSchema = Joi.object({
  role: Joi.string().valid("volunteer").required(),
  name: Joi.string().trim().max(120).required(),
  email: Joi.string().email().trim().lowercase().required(),
  phone: Joi.string().trim().max(30).allow(""),
  password: Joi.string().min(8).max(72).required(),
  gender: Joi.string().valid("male", "female", "other", "prefer_not_say").default("prefer_not_say"),
  age: Joi.number().integer().min(10).max(120).optional(),
  skills: Joi.array().items(Joi.string().trim().max(60)).max(50).default([]),
  availability: Joi.array().items(availabilitySlot).max(100).default([])
});

const signupNgoSchema = Joi.object({
  role: Joi.string().valid("ngo").required(),
  organizationName: Joi.string().trim().max(160).required(),
  email: Joi.string().email().trim().lowercase().required(),
  phone: Joi.string().trim().max(30).allow(""),
  password: Joi.string().min(8).max(72).required(),
  gender: Joi.string().valid("male", "female", "other", "prefer_not_say").default("prefer_not_say"),
  age: Joi.number().integer().min(10).max(120).optional(),
  location: Joi.string().trim().max(240).allow(""),
  description: Joi.string().trim().max(5000).allow(""),
  type: Joi.string()
    .valid(
      "Education",
      "Health",
      "Environment",
      "Disaster Relief",
      "Animal Welfare",
      "Community",
      "Other"
    )
    .default("Other")
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).max(72).required()
});

module.exports = { signupVolunteerSchema, signupNgoSchema, loginSchema };