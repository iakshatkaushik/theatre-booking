const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

/**
 * Global error handler middleware
 * Catches all unhandled errors and returns consistent JSON response
 */
const errorHandler = (err, req, res, _next) => {
    // Log the error
    logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    // Operational / known errors
    if (err.isOperational) {
        return ApiResponse.error(res, err.code, err.message, err.statusCode);
    }

    // Prisma known errors
    if (err.code === 'P2002') {
        const field = err.meta?.target?.join(', ') || 'field';
        return ApiResponse.error(res, 'DUPLICATE_ENTRY', `Duplicate value for: ${field}`, 409);
    }

    if (err.code === 'P2025') {
        return ApiResponse.error(res, 'NOT_FOUND', 'Record not found', 404);
    }

    // Unknown errors
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message;

    return ApiResponse.error(res, 'INTERNAL_ERROR', message, statusCode);
};

module.exports = errorHandler;
