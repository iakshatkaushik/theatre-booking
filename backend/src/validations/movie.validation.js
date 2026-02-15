const { z } = require('zod');

const createMovieSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    duration_minutes: z.number().int().positive('Duration must be positive'),
    language: z.string().min(1, 'Language is required').max(50),
    genre: z.array(z.string()).min(1, 'At least one genre is required'),
    poster_url: z.string().url().optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
});

const updateMovieSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    duration_minutes: z.number().int().positive().optional(),
    language: z.string().min(1).max(50).optional(),
    genre: z.array(z.string()).min(1).optional(),
    poster_url: z.string().url().optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    is_active: z.boolean().optional(),
});

module.exports = { createMovieSchema, updateMovieSchema };
