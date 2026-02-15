require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/error.middleware');
const { generalLimiter } = require('./src/middleware/rateLimiter.middleware');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const movieRoutes = require('./src/routes/movie.routes');
const showRoutes = require('./src/routes/show.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();

// ─── Security Middleware ───────────────────────────
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(generalLimiter);

// ─── Body Parsing ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ───────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        });
    });
    next();
});

// ─── Serve Frontend Static Files ───────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API Routes ────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health Check ──────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});

// ─── API 404 Handler ───────────────────────────
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API endpoint not found' },
    });
});

// ─── Catch-all: Serve Frontend ─────────────────
app.use((req, res, next) => {
    // Only serve frontend for non-API GET requests
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
    next();
});

// ─── Error Handler ─────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────
const PORT = config.port;
app.listen(PORT, () => {
    logger.info(`🎭 Theatre Management System running on port ${PORT}`);
    logger.info(`📁 Environment: ${config.nodeEnv}`);
    logger.info(`🌐 Frontend: http://localhost:${PORT}`);
    logger.info(`📡 API: http://localhost:${PORT}/api`);
});

module.exports = app;
