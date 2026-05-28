class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function errorHandler(logger) {
  return (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    logger.error(`${req.method} ${req.originalUrl} - ${message}`, { stack: err.stack });

    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  };
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function paginate(page = 1, limit = 10) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}

function paginatedResponse(data, total, page, limit) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = { AppError, errorHandler, asyncHandler, paginate, paginatedResponse };
