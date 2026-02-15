const MovieService = require('../services/movie.service');
const ApiResponse = require('../utils/apiResponse');

class MovieController {
    static async getMovies(req, res, next) {
        try {
            const { search, page = 1, limit = 10 } = req.query;
            const result = await MovieService.getMovies({
                search,
                page: parseInt(page),
                limit: parseInt(limit),
            });
            return ApiResponse.paginated(res, result.movies, {
                page: result.page,
                limit: result.limit,
                total: result.total,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getMovieById(req, res, next) {
        try {
            const movie = await MovieService.getMovieById(parseInt(req.params.id));
            return ApiResponse.success(res, movie);
        } catch (error) {
            next(error);
        }
    }

    static async createMovie(req, res, next) {
        try {
            const movie = await MovieService.createMovie(req.body, req.user.id, req.ip);
            return ApiResponse.success(res, movie, 'Movie created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    static async updateMovie(req, res, next) {
        try {
            const movie = await MovieService.updateMovie(
                parseInt(req.params.id),
                req.body,
                req.user.id,
                req.ip
            );
            return ApiResponse.success(res, movie, 'Movie updated successfully');
        } catch (error) {
            next(error);
        }
    }

    static async deleteMovie(req, res, next) {
        try {
            await MovieService.deleteMovie(parseInt(req.params.id), req.user.id, req.ip);
            return ApiResponse.success(res, null, 'Movie deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = MovieController;
