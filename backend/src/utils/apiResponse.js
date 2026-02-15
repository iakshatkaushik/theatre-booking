/**
 * Standardized API response helpers
 * All APIs follow consistent JSON format
 */

class ApiResponse {
    /**
     * Success response
     */
    static success(res, data = null, message = null, statusCode = 200) {
        const response = { success: true };
        if (data !== null) response.data = data;
        if (message) response.message = message;
        return res.status(statusCode).json(response);
    }

    /**
     * Success response with pagination
     */
    static paginated(res, data, pagination, message = null) {
        const response = {
            success: true,
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total_pages: Math.ceil(pagination.total / pagination.limit),
                total_records: pagination.total,
            },
        };
        if (message) response.message = message;
        return res.status(200).json(response);
    }

    /**
     * Error response
     */
    static error(res, code, message, statusCode = 400) {
        return res.status(statusCode).json({
            success: false,
            error: {
                code,
                message,
            },
        });
    }
}

module.exports = ApiResponse;
