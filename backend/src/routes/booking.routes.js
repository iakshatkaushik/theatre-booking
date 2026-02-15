const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/booking.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createBookingSchema } = require('../validations/booking.validation');

// All booking routes require authentication
router.use(authenticate);

router.post('/', validate(createBookingSchema), BookingController.createBooking);
router.get('/my-bookings', BookingController.getMyBookings);

module.exports = router;
