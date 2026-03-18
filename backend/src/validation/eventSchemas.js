const Joi = require("joi");

const shiftSchema = Joi.object({
  start: Joi.date().iso().required(),
  end: Joi.date().iso().required(),
  requiredVolunteers: Joi.number().integer().min(1).default(1),
  requiredSkills: Joi.array().items(Joi.string().trim().max(60)).default([])
}).custom((shift, helpers) => {
  const s = new Date(shift.start);
  const e = new Date(shift.end);
  if (!(s < e)) return helpers.error("any.invalid");
  return shift;
}, "shift window");

const createEventSchema = Joi.object({
  title: Joi.string().trim().max(160).required(),
  description: Joi.string().trim().max(5000).allow(""),
  location: Joi.string().trim().max(240).allow(""),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  requiredVolunteers: Joi.number().integer().min(1).default(1),
  requiredSkills: Joi.array().items(Joi.string().trim().max(60)).default([]),
  contact: Joi.string().trim().max(160).allow(""),
  restrictions: Joi.object({
    gender: Joi.string().valid("any", "male", "female", "other", "prefer_not_say").default("any"),
    minAge: Joi.number().integer().min(0).max(130).allow(null),
    maxAge: Joi.number().integer().min(0).max(130).allow(null)
  }).default({ gender: "any", minAge: null, maxAge: null }),
  shifts: Joi.array().items(shiftSchema).default([])
}).custom((event, helpers) => {
  if (event.restrictions) {
    const minA = event.restrictions.minAge;
    const maxA = event.restrictions.maxAge;
    if (minA !== null && maxA !== null && Number(minA) > Number(maxA)) return helpers.error("any.invalid");
  }
  const s = new Date(event.startDate);
  const e = new Date(event.endDate);
  if (!(s < e)) return helpers.error("any.invalid");

  if (event.shifts && event.shifts.length) {
    for (const sh of event.shifts) {
      const ss = new Date(sh.start);
      const ee = new Date(sh.end);
      if (ss < s || ee > e) return helpers.error("any.invalid");
    }
  }

  return event;
}, "event window");

const updateEventSchema = createEventSchema.fork(["title", "startDate", "endDate"], (s) => s.optional());

const suggestSchema = Joi.object({
  shiftStart: Joi.date().iso().optional(),
  shiftEnd: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(50).default(10)
}).custom((v, helpers) => {
  if (v.shiftStart && v.shiftEnd) {
    const s = new Date(v.shiftStart);
    const e = new Date(v.shiftEnd);
    if (!(s < e)) return helpers.error("any.invalid");
  }
  return v;
}, "suggest window");


const querySchema = Joi.object({
  message: Joi.string().trim().max(240).required()
});


const autoFillSchema = Joi.object({
  dryRun: Joi.boolean().default(false),
  maxCandidatesPerShift: Joi.number().integer().min(5).max(300).default(60)
}).unknown(false);

module.exports = { createEventSchema, updateEventSchema, suggestSchema, querySchema, autoFillSchema };
