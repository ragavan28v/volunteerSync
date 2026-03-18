const Joi = require("joi");

const issueTokenSchema = Joi.object({}).unknown(false);

const checkInSchema = Joi.object({
  assignmentId: Joi.string().required(),
  token: Joi.string().trim().min(4).max(32).required(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional()
}).unknown(false);

const checkOutSchema = Joi.object({
  assignmentId: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional()
}).unknown(false);

module.exports = { issueTokenSchema, checkInSchema, checkOutSchema };
