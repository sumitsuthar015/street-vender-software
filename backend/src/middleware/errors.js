const { HttpError } = require('../utils');

function notFound(req, res) {
  res.status(404).json({ message: 'Not found' });
}

// Express 5 forwards errors from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Not found' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'This already exists. Please try again.' });
  }
  if (err.name === 'VersionError') {
    return res.status(409).json({ message: 'This order was just updated by someone else. Please refresh and try again.' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors)[0]?.message || 'Invalid data' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Upload is too large. Please use a smaller photo.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid request body' });
  }
  console.error('[error]', req.method, req.originalUrl, err);
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
}

module.exports = { notFound, errorHandler };
