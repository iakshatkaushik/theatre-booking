const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Audit Log Service
 * Logs all important actions to the audit_logs table
 */
class AuditService {
    /**
     * Log an action
     * @param {Object} params
     * @param {number|null} params.userId
     * @param {string} params.action - e.g. 'LOGIN', 'BOOKING_CREATED', 'MOVIE_DELETED'
     * @param {string} params.entityType - e.g. 'User', 'Booking', 'Movie'
     * @param {string|null} params.entityId
     * @param {string|null} params.ipAddress
     * @param {Object|null} params.metadata - Additional data
     */
    static async log({ userId = null, action, entityType, entityId = null, ipAddress = null, metadata = null }) {
        try {
            await prisma.auditLog.create({
                data: {
                    user_id: userId,
                    action,
                    entity_type: entityType,
                    entity_id: entityId ? String(entityId) : null,
                    ip_address: ipAddress,
                    metadata,
                },
            });
            logger.info('Audit log created', { action, entityType, entityId });
        } catch (error) {
            // Audit logging should never crash the app
            logger.error('Failed to create audit log', { error: error.message, action, entityType });
        }
    }
}

module.exports = AuditService;
