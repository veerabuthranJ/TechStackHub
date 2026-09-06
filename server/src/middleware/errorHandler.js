const multer = require('multer');
const { sendError } = require('../utils/response');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'The uploaded file exceeds the allowed size limit.'
      : 'The uploaded file is invalid.';
  }

  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong.';
  }

  return sendError(res, message, statusCode);
}

module.exports = errorHandler;
