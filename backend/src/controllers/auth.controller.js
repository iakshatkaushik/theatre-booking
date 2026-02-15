const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
    static async register(req, res, next) {
        try {
            const result = await AuthService.register(req.body, req.ip);
            return ApiResponse.success(res, result, 'Registration successful', 201);
        } catch (error) {
            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            const result = await AuthService.login(req.body, req.ip);
            return ApiResponse.success(res, result, 'Login successful');
        } catch (error) {
            next(error);
        }
    }

    static async me(req, res, next) {
        try {
            const prisma = require('../config/database');
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
            });
            return ApiResponse.success(res, user);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
