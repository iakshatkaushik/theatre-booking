const express = require('express');
const router = express.Router();
const ShowController = require('../controllers/show.controller');

// Public routes
router.get('/', ShowController.getShows);
router.get('/:id/seats', ShowController.getShowSeats);

module.exports = router;
