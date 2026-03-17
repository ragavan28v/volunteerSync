const { httpError } = require("../utils/httpError");

function validateBody(schema) {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return next(
        httpError(400, "Validation error", {
          details: error.details.map((d) => ({ message: d.message, path: d.path }))
        })
      );
    }

    req.body = value;
    next();
  };
}

module.exports = { validateBody };
