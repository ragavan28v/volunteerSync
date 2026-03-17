const Joi = require("joi");

const availabilitySlot = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
});

const updateVolunteerMeSchema = Joi.object({
  skills: Joi.array().items(Joi.string().trim().max(60)).max(50),
  availability: Joi.array().items(availabilitySlot).max(100),
  phone: Joi.string().trim().max(30).allow("")
});

module.exports = { updateVolunteerMeSchema };
