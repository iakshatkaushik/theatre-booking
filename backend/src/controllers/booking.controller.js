const BookingService = require('../services/booking.service');
const ApiResponse = require('../utils/apiResponse');

class BookingController {
    static async createBooking(req, res, next) {
        try {
            const booking = await BookingService.createBooking(req.body, req.user.id, req.ip);
            return ApiResponse.success(res, booking, 'Booking confirmed successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    static async getMyBookings(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await BookingService.getUserBookings(req.user.id, {
                page: parseInt(page),
                limit: parseInt(limit),
            });
            return ApiResponse.paginated(res, result.bookings, {
                page: result.page,
                limit: result.limit,
                total: result.total,
            });
        } catch (error) {
            next(error);
        }
    }

    static async cancelBooking(req, res, next) {
        try {
            const booking = await BookingService.cancelBooking(
                parseInt(req.params.id),
                req.user.id,
                req.ip
            );
            return ApiResponse.success(res, booking, 'Booking cancelled successfully');
        } catch (error) {
            next(error);
        }
    }

    static async getAllBookings(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await BookingService.getAllBookings({
                page: parseInt(page),
                limit: parseInt(limit),
            });
            return ApiResponse.paginated(res, result.bookings, {
                page: result.page,
                limit: result.limit,
                total: result.total,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getRevenue(req, res, next) {
        try {
            const { from, to } = req.query;
            const revenue = await BookingService.getRevenue({ from, to });
            return ApiResponse.success(res, revenue);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BookingController;
