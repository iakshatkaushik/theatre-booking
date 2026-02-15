const prisma = require('../config/database');
const { NotFoundError, AppError } = require('../utils/errors');
const AuditService = require('./audit.service');
const logger = require('../utils/logger');

class ShowService {
    /**
     * Get shows with filters
     */
    static async getShows({ date, movie_id, page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        const where = { is_active: true };

        if (movie_id) {
            where.movie_id = parseInt(movie_id);
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.show_datetime = { gte: startOfDay, lte: endOfDay };
        } else {
            // Only show future shows by default
            where.show_datetime = { gte: new Date() };
        }

        const [shows, total] = await Promise.all([
            prisma.show.findMany({
                where,
                skip,
                take: limit,
                include: {
                    movie: { select: { id: true, title: true, duration_minutes: true, language: true, genre: true, poster_url: true } },
                    hall: { select: { id: true, name: true, total_seats: true } },
                    seat_pricings: true,
                },
                orderBy: { show_datetime: 'asc' },
            }),
            prisma.show.count({ where }),
        ]);

        return { shows, total, page, limit };
    }

    /**
     * Get seats for a specific show with booking status
     */
    static async getShowSeats(showId) {
        const show = await prisma.show.findUnique({
            where: { id: showId },
            include: {
                hall: true,
                movie: { select: { title: true, duration_minutes: true } },
                seat_pricings: true,
            },
        });

        if (!show) throw new NotFoundError('Show');

        // Get all seats for this hall
        const seats = await prisma.seat.findMany({
            where: { hall_id: show.hall_id, is_active: true },
            orderBy: [{ row_number: 'asc' }, { seat_number: 'asc' }],
        });

        // Get booked seat IDs for this show
        const bookedSeats = await prisma.bookingSeat.findMany({
            where: {
                show_id: showId,
                booking: { status: 'CONFIRMED' },
            },
            select: { seat_id: true },
        });

        const bookedSeatIds = new Set(bookedSeats.map((bs) => bs.seat_id));

        // Build pricing map
        const pricingMap = {};
        show.seat_pricings.forEach((sp) => {
            pricingMap[sp.seat_category] = parseFloat(sp.price);
        });

        // Mark each seat with availability and price
        const seatData = seats.map((seat) => ({
            id: seat.id,
            row_number: seat.row_number,
            seat_number: seat.seat_number,
            seat_category: seat.seat_category,
            is_booked: bookedSeatIds.has(seat.id),
            price: pricingMap[seat.seat_category] || 0,
        }));

        return {
            show: {
                id: show.id,
                show_datetime: show.show_datetime,
                movie: show.movie,
                hall: show.hall,
            },
            seats: seatData,
            pricing: pricingMap,
        };
    }

    /**
     * Create a show (admin)
     */
    static async createShow(data, userId, ipAddress) {
        const { movie_id, hall_id, show_datetime, pricing } = data;

        // Verify movie exists
        const movie = await prisma.movie.findUnique({ where: { id: movie_id } });
        if (!movie) throw new NotFoundError('Movie');

        // Verify hall exists
        const hall = await prisma.hall.findUnique({ where: { id: hall_id } });
        if (!hall) throw new NotFoundError('Hall');

        // Check for conflicting shows (same hall, overlapping time)
        const showDate = new Date(show_datetime);
        const bufferMinutes = movie.duration_minutes + 30; // 30 min cleaning buffer
        const showEnd = new Date(showDate.getTime() + bufferMinutes * 60000);
        const showStart = new Date(showDate.getTime() - bufferMinutes * 60000);

        const conflicting = await prisma.show.findFirst({
            where: {
                hall_id,
                is_active: true,
                show_datetime: { gte: showStart, lte: showEnd },
            },
        });

        if (conflicting) {
            throw new AppError('Time slot conflicts with an existing show in this hall', 409, 'SCHEDULE_CONFLICT');
        }

        // Create show with pricing in a transaction
        const show = await prisma.$transaction(async (tx) => {
            const newShow = await tx.show.create({
                data: {
                    movie_id,
                    hall_id,
                    show_datetime: showDate,
                },
            });

            // Create seat pricings
            if (pricing && pricing.length > 0) {
                await tx.seatPricing.createMany({
                    data: pricing.map((p) => ({
                        show_id: newShow.id,
                        seat_category: p.seat_category,
                        price: p.price,
                    })),
                });
            }

            return tx.show.findUnique({
                where: { id: newShow.id },
                include: { movie: true, hall: true, seat_pricings: true },
            });
        });

        await AuditService.log({
            userId,
            action: 'SHOW_CREATED',
            entityType: 'Show',
            entityId: show.id,
            ipAddress,
            metadata: { movie_id, hall_id, show_datetime },
        });

        logger.info('Show created', { showId: show.id });
        return show;
    }
}

module.exports = ShowService;
