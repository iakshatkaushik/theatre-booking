const { z } = require('zod');

const createBookingSchema = z.object({
    show_id: z.number().int().positive('Show ID is required'),
    seat_ids: z.array(z.number().int().positive()).min(1, 'At least one seat must be selected'),
});

module.exports = { createBookingSchema };
