const dotenv = require('dotenv');
dotenv.config();

const config = {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
        expiry: process.env.JWT_EXPIRY || '24h',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 1000,
    },
    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@theatre.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
    },
    database: {
        url: process.env.DATABASE_URL,
    },
};

module.exports = config;
