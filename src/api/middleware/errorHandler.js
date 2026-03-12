const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  logger.error({
    message: err.message,
    code: err.code,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  res.status(statusCode).json({
    error: {
      message: isProduction && statusCode === 500 ? 'Internal server error' : err.message,
      code: err.code || 'INTERNAL_ERROR',
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}

module.exports = { AppError, errorHandler };
