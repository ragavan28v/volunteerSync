const Joi = require("joi");

const shiftSchema = Joi.object({
  start: Joi.date().iso().required(),
  end: Joi.date().iso().required(),
  requiredVolunteers: Joi.number().integer().min(1).default(1),
  requiredSkills: Joi.array().items(Joi.string().trim().max(60)).default([])
});

const createEventSchema = Joi.object({
  title: Joi.string().trim().max(160).required(),
  description: Joi.string().trim().max(5000).allow(""),
  location: Joi.string().trim().max(240).allow(""),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  requiredVolunteers: Joi.number().integer().min(1).default(1),
  requiredSkills: Joi.array().items(Joi.string().trim().max(60)).default([]),
  shifts: Joi.array().items(shiftSchema).default([])
});

const updateEventSchema = createEventSchema.fork(["title", "startDate", "endDate"], (s) => s.optional());

const suggestSchema = Joi.object({
  shiftStart: Joi.date().iso().optional(),
  shiftEnd: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

module.exports = { createEventSchema, updateEventSchema, suggestSchema };
