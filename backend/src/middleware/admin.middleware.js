const ApiResponse = require('../utils/apiResponse');

/**
 * Admin authorization middleware
 * Must be used AFTER authenticate middleware
 */
const adminGuard = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return ApiResponse.error(res, 'FORBIDDEN', 'Admin access required', 403);
    }
    next();
};

module.exports = adminGuard;
