const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and attaches user to request
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.error(res, 'AUTH_REQUIRED', 'Authentication token is required', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret);

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return ApiResponse.error(res, 'TOKEN_EXPIRED', 'Authentication token has expired', 401);
        }
        if (error.name === 'JsonWebTokenError') {
            return ApiResponse.error(res, 'INVALID_TOKEN', 'Invalid authentication token', 401);
        }
        logger.error('Authentication error', { error: error.message });
        return ApiResponse.error(res, 'AUTH_ERROR', 'Authentication failed', 401);
    }
};

module.exports = authenticate;
