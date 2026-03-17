const Joi = require("joi");

const createAssignmentSchema = Joi.object({
  volunteerId: Joi.string().required(),
  eventId: Joi.string().required(),
  shiftStart: Joi.date().iso().required(),
  shiftEnd: Joi.date().iso().required(),
  role: Joi.string().trim().max(120).allow(""),
  status: Joi.string().valid("assigned", "accepted", "completed", "cancelled").default("assigned")
});

const updateAssignmentStatusSchema = Joi.object({
  status: Joi.string().valid("accepted", "cancelled").required()
});

module.exports = { createAssignmentSchema, updateAssignmentStatusSchema };
