const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const config = require('../config');
const logger = require('../utils/logger');
const { ConflictError, UnauthorizedError } = require('../utils/errors');
const AuditService = require('./audit.service');

class AuthService {
    /**
     * Register a new user
     */
    static async register({ name, email, phone, password }, ipAddress) {
        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new ConflictError('Email already registered');
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: { name, email, phone, password_hash },
            select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
        });

        // Generate token
        const token = AuthService._generateToken(user);

        // Audit
        await AuditService.log({
            userId: user.id,
            action: 'USER_REGISTERED',
            entityType: 'User',
            entityId: user.id,
            ipAddress,
        });

        logger.info('User registered', { userId: user.id, email });

        return { user, token };
    }

    /**
     * Login user
     */
    static async login({ email, password }, ipAddress) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            logger.warn('Login attempt with non-existent email', { email, ipAddress });
            await AuditService.log({
                action: 'LOGIN_FAILED',
                entityType: 'User',
                ipAddress,
                metadata: { email, reason: 'User not found' },
            });
            throw new UnauthorizedError('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            logger.warn('Failed login attempt', { userId: user.id, email, ipAddress });
            await AuditService.log({
                userId: user.id,
                action: 'LOGIN_FAILED',
                entityType: 'User',
                entityId: user.id,
                ipAddress,
                metadata: { reason: 'Invalid password' },
            });
            throw new UnauthorizedError('Invalid email or password');
        }

        const token = AuthService._generateToken(user);

        await AuditService.log({
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            entityType: 'User',
            entityId: user.id,
            ipAddress,
        });

        logger.info('User logged in', { userId: user.id, email });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
            token,
        };
    }

    static _generateToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiry }
        );
    }
}

module.exports = AuthService;
