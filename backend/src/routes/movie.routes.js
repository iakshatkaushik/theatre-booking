const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/movie.controller');

// Public routes
router.get('/', MovieController.getMovies);
router.get('/:id', MovieController.getMovieById);

module.exports = router;
