const Joi = require("joi");

const logHoursSchema = Joi.object({
  eventId: Joi.string().required(),
  assignmentId: Joi.string().allow(""),
  hours: Joi.number().min(0.25).max(24).required()
});

const verifyHoursSchema = Joi.object({
  verified: Joi.boolean().required()
});

module.exports = { logHoursSchema, verifyHoursSchema };
