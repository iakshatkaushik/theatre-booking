const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/movie.controller');
const ShowController = require('../controllers/show.controller');
const BookingController = require('../controllers/booking.controller');
const authenticate = require('../middleware/auth.middleware');
const adminGuard = require('../middleware/admin.middleware');
const validate = require('../middleware/validate.middleware');
const { createMovieSchema, updateMovieSchema } = require('../validations/movie.validation');
const { createShowSchema } = require('../validations/show.validation');

// All admin routes require authentication + admin role
router.use(authenticate, adminGuard);

// Movie management
router.post('/movies', validate(createMovieSchema), MovieController.createMovie);
router.put('/movies/:id', validate(updateMovieSchema), MovieController.updateMovie);
router.delete('/movies/:id', MovieController.deleteMovie);

// Show management
router.post('/shows', validate(createShowSchema), ShowController.createShow);

// Booking management
router.get('/bookings', BookingController.getAllBookings);
router.patch('/bookings/:id/cancel', BookingController.cancelBooking);

// Revenue
router.get('/revenue', BookingController.getRevenue);

module.exports = router;
