const ShowService = require('../services/show.service');
const ApiResponse = require('../utils/apiResponse');

class ShowController {
    static async getShows(req, res, next) {
        try {
            const { date, movie_id, page = 1, limit = 10 } = req.query;
            const result = await ShowService.getShows({
                date,
                movie_id,
                page: parseInt(page),
                limit: parseInt(limit),
            });
            return ApiResponse.paginated(res, result.shows, {
                page: result.page,
                limit: result.limit,
                total: result.total,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getShowSeats(req, res, next) {
        try {
            const data = await ShowService.getShowSeats(parseInt(req.params.id));
            return ApiResponse.success(res, data);
        } catch (error) {
            next(error);
        }
    }

    static async createShow(req, res, next) {
        try {
            const show = await ShowService.createShow(req.body, req.user.id, req.ip);
            return ApiResponse.success(res, show, 'Show created successfully', 201);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ShowController;
