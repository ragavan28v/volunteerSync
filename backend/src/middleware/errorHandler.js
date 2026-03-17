function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message =
    status >= 500 ? "Internal server error" : err.message || "Request failed";

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({
    error: {
      message,
      code: err.code,
      details: err.details,
    },
  });
}

module.exports = { errorHandler };

