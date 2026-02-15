const prisma = require('../config/database');
const { NotFoundError, AppError, ConflictError } = require('../utils/errors');
const AuditService = require('./audit.service');
const logger = require('../utils/logger');

class BookingService {
    /**
     * Create a booking with concurrency-safe seat locking
     * Uses raw SQL with SELECT ... FOR UPDATE to prevent double booking
     */
    static async createBooking({ show_id, seat_ids }, userId, ipAddress) {
        logger.info('Booking attempt', { userId, show_id, seat_ids });

        await AuditService.log({
            userId,
            action: 'BOOKING_ATTEMPTED',
            entityType: 'Booking',
            ipAddress,
            metadata: { show_id, seat_ids },
        });

        // Verify show exists and is active
        const show = await prisma.show.findUnique({
            where: { id: show_id },
            include: { seat_pricings: true },
        });

        if (!show || !show.is_active) {
            throw new NotFoundError('Show');
        }

        // Check show hasn't already happened
        if (new Date(show.show_datetime) < new Date()) {
            throw new AppError('Cannot book tickets for a past show', 400, 'SHOW_EXPIRED');
        }

        // Build pricing map
        const pricingMap = {};
        show.seat_pricings.forEach((sp) => {
            pricingMap[sp.seat_category] = parseFloat(sp.price);
        });

        // Execute booking in a SERIALIZABLE transaction using raw SQL for row locking
        const booking = await prisma.$transaction(async (tx) => {
            // 1. Verify all requested seats exist and belong to the show's hall
            const seats = await tx.seat.findMany({
                where: {
                    id: { in: seat_ids },
                    hall_id: show.hall_id,
                    is_active: true,
                },
            });

            if (seats.length !== seat_ids.length) {
                throw new AppError('One or more selected seats are invalid', 400, 'INVALID_SEATS');
            }

            // 2. Use raw SQL with FOR UPDATE to lock and check for existing bookings
            // This prevents double booking via row-level locking
            const existingBookings = await tx.$queryRaw`
        SELECT bs.seat_id 
        FROM booking_seats bs
        JOIN bookings b ON bs.booking_id = b.id
        WHERE bs.show_id = ${show_id} 
          AND bs.seat_id = ANY(${seat_ids}::int[])
          AND b.status = 'CONFIRMED'
        FOR UPDATE
      `;

            if (existingBookings.length > 0) {
                const conflictIds = existingBookings.map((b) => b.seat_id);
                throw new ConflictError(`Seats already booked: ${conflictIds.join(', ')}`);
            }

            // 3. Calculate total amount
            let totalAmount = 0;
            seats.forEach((seat) => {
                const price = pricingMap[seat.seat_category];
                if (!price) {
                    throw new AppError(`No pricing found for category: ${seat.seat_category}`, 400, 'NO_PRICING');
                }
                totalAmount += price;
            });

            // 4. Create booking
            const newBooking = await tx.booking.create({
                data: {
                    user_id: userId,
                    show_id,
                    total_amount: totalAmount,
                    status: 'CONFIRMED',
                },
            });

            // 5. Create booking_seats entries
            await tx.bookingSeat.createMany({
                data: seat_ids.map((seatId) => ({
                    booking_id: newBooking.id,
                    seat_id: seatId,
                    show_id,
                })),
            });

            // Return full booking with details
            return tx.booking.findUnique({
                where: { id: newBooking.id },
                include: {
                    booking_seats: {
                        include: {
                            seat: { select: { id: true, row_number: true, seat_number: true, seat_category: true } },
                        },
                    },
                    show: {
                        include: {
                            movie: { select: { title: true } },
                            hall: { select: { name: true } },
                        },
                    },
                },
            });
        }, {
            isolationLevel: 'Serializable',
            timeout: 10000,
        });

        await AuditService.log({
            userId,
            action: 'BOOKING_CREATED',
            entityType: 'Booking',
            entityId: booking.id,
            ipAddress,
            metadata: { show_id, seat_ids, total_amount: booking.total_amount },
        });

        logger.info('Booking created successfully', { bookingId: booking.id, userId });
        return booking;
    }

    /**
     * Get user's bookings with pagination
     */
    static async getUserBookings(userId, { page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where: { user_id: userId },
                skip,
                take: limit,
                include: {
                    booking_seats: {
                        include: {
                            seat: { select: { row_number: true, seat_number: true, seat_category: true } },
                        },
                    },
                    show: {
                        include: {
                            movie: { select: { title: true, poster_url: true, duration_minutes: true } },
                            hall: { select: { name: true } },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            prisma.booking.count({ where: { user_id: userId } }),
        ]);

        return { bookings, total, page, limit };
    }

    /**
     * Cancel a booking (admin)
     */
    static async cancelBooking(bookingId, userId, ipAddress) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) throw new NotFoundError('Booking');

        if (booking.status === 'CANCELLED') {
            throw new AppError('Booking is already cancelled', 400, 'ALREADY_CANCELLED');
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' },
            include: {
                booking_seats: {
                    include: { seat: true },
                },
                show: { include: { movie: true } },
                user: { select: { name: true, email: true } },
            },
        });

        await AuditService.log({
            userId,
            action: 'BOOKING_CANCELLED',
            entityType: 'Booking',
            entityId: bookingId,
            ipAddress,
            metadata: { original_status: booking.status },
        });

        logger.info('Booking cancelled', { bookingId, cancelledBy: userId });
        return updated;
    }

    /**
     * Get all bookings (admin) with pagination
     */
    static async getAllBookings({ page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                skip,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    booking_seats: {
                        include: {
                            seat: { select: { row_number: true, seat_number: true, seat_category: true } },
                        },
                    },
                    show: {
                        include: {
                            movie: { select: { title: true } },
                            hall: { select: { name: true } },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            prisma.booking.count(),
        ]);

        return { bookings, total, page, limit };
    }

    /**
     * Revenue report (admin)
     */
    static async getRevenue({ from, to }) {
        const where = { status: 'CONFIRMED' };

        if (from || to) {
            where.created_at = {};
            if (from) where.created_at.gte = new Date(from);
            if (to) where.created_at.lte = new Date(to);
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                show: {
                    include: {
                        movie: { select: { title: true } },
                    },
                },
            },
        });

        // Aggregate revenue
        let totalRevenue = 0;
        const revenueByMovie = {};
        const revenueByDate = {};

        bookings.forEach((booking) => {
            const amount = parseFloat(booking.total_amount);
            totalRevenue += amount;

            // By movie
            const movieTitle = booking.show?.movie?.title || 'Unknown';
            if (!revenueByMovie[movieTitle]) revenueByMovie[movieTitle] = 0;
            revenueByMovie[movieTitle] += amount;

            // By date
            const date = booking.created_at.toISOString().split('T')[0];
            if (!revenueByDate[date]) revenueByDate[date] = 0;
            revenueByDate[date] += amount;
        });

        return {
            total_revenue: totalRevenue,
            total_bookings: bookings.length,
            revenue_by_movie: Object.entries(revenueByMovie).map(([movie, revenue]) => ({ movie, revenue })),
            revenue_by_date: Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue })),
        };
    }
}

module.exports = BookingService;
