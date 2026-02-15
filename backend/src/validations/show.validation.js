const { z } = require('zod');

const createShowSchema = z.object({
    movie_id: z.number().int().positive('Movie ID is required'),
    hall_id: z.number().int().positive('Hall ID is required'),
    show_datetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid datetime format',
    }),
    pricing: z.array(
        z.object({
            seat_category: z.enum(['STANDARD', 'PREMIUM', 'VIP', 'BALCONY', 'BOX']),
            price: z.number().positive('Price must be positive'),
        })
    ).min(1, 'At least one pricing tier is required'),
});

module.exports = { createShowSchema };
