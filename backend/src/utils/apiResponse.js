const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    error,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  success: (res, message, data = null, statusCode = 200) => sendResponse(res, statusCode, true, message, data, null),
  error: (res, message, error = null, statusCode = 400) => sendResponse(res, statusCode, false, message, null, error)
};
