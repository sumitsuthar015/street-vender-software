const apiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error(`[Express Error Handler]: ${err.stack || err.message}`);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return apiResponse.error(res, 'Validation Error', messages, 400);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return apiResponse.error(res, `${field.toUpperCase()} already exists.`, null, 400);
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    return apiResponse.error(res, 'Invalid Auth Token', null, 401);
  }

  return apiResponse.error(
    res,
    err.message || 'Internal Server Error',
    process.env.NODE_ENV === 'development' ? err.stack : null,
    err.statusCode || 500
  );
};

module.exports = errorHandler;
