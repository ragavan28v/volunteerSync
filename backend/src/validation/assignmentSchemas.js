const Joi = require("joi");

const createAssignmentSchema = Joi.object({
  volunteerId: Joi.string().required(),
  eventId: Joi.string().required(),
  shiftId: Joi.string().optional(),
  shiftStart: Joi.date().iso().required(),
  shiftEnd: Joi.date().iso().required(),
  role: Joi.string().trim().max(120).allow(""),
  status: Joi.string().valid("assigned", "accepted", "completed", "cancelled").default("assigned")
}).custom((a, helpers) => {
  const s = new Date(a.shiftStart);
  const e = new Date(a.shiftEnd);
  if (!(s < e)) return helpers.error("any.invalid");
  return a;
}, "assignment window");

const updateAssignmentStatusSchema = Joi.object({
  status: Joi.string().valid("accepted", "cancelled").required()
});

module.exports = { createAssignmentSchema, updateAssignmentStatusSchema };
