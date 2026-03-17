const Joi = require("joi");

const signupSchema = Joi.object({
  name: Joi.string().trim().max(120).required(),
  email: Joi.string().email().trim().lowercase().required(),
  phone: Joi.string().trim().max(30).allow(""),
  password: Joi.string().min(8).max(72).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).max(72).required()
});

module.exports = { signupSchema, loginSchema };
