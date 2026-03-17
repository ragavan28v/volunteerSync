function httpError(statusCode, message, extra) {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (extra) Object.assign(err, extra);
  return err;
}

module.exports = { httpError };
