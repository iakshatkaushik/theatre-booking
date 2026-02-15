const prisma = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const AuditService = require('./audit.service');
const logger = require('../utils/logger');

class MovieService {
    /**
     * Get all movies with search and pagination
     */
    static async getMovies({ search, page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        const where = { is_active: true };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { language: { contains: search, mode: 'insensitive' } },
                { genre: { hasSome: [search] } },
            ];
        }

        const [movies, total] = await Promise.all([
            prisma.movie.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
            prisma.movie.count({ where }),
        ]);

        return { movies, total, page, limit };
    }

    /**
     * Get single movie by ID
     */
    static async getMovieById(id) {
        const movie = await prisma.movie.findUnique({
            where: { id },
            include: {
                shows: {
                    where: { is_active: true, show_datetime: { gte: new Date() } },
                    include: { hall: true, seat_pricings: true },
                    orderBy: { show_datetime: 'asc' },
                },
            },
        });

        if (!movie) throw new NotFoundError('Movie');
        return movie;
    }

    /**
     * Create a movie (admin)
     */
    static async createMovie(data, userId, ipAddress) {
        const movie = await prisma.movie.create({ data });

        await AuditService.log({
            userId,
            action: 'MOVIE_CREATED',
            entityType: 'Movie',
            entityId: movie.id,
            ipAddress,
            metadata: { title: movie.title },
        });

        logger.info('Movie created', { movieId: movie.id, title: movie.title });
        return movie;
    }

    /**
     * Update a movie (admin)
     */
    static async updateMovie(id, data, userId, ipAddress) {
        const existing = await prisma.movie.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Movie');

        const movie = await prisma.movie.update({ where: { id }, data });

        await AuditService.log({
            userId,
            action: 'MOVIE_UPDATED',
            entityType: 'Movie',
            entityId: movie.id,
            ipAddress,
            metadata: { changes: data },
        });

        return movie;
    }

    /**
     * Delete (soft-deactivate) a movie (admin)
     */
    static async deleteMovie(id, userId, ipAddress) {
        const existing = await prisma.movie.findUnique({ where: { id } });
        if (!existing) throw new NotFoundError('Movie');

        await prisma.movie.update({
            where: { id },
            data: { is_active: false },
        });

        await AuditService.log({
            userId,
            action: 'MOVIE_DELETED',
            entityType: 'Movie',
            entityId: id,
            ipAddress,
        });

        logger.info('Movie deactivated', { movieId: id });
    }
}

module.exports = MovieService;
