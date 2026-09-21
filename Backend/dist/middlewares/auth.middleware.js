"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const store_1 = require("../models/store");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        // Si no hay encabezado pero se envía x-user-email (para pruebas rápidas de frontend), lo resolvemos
        const testEmail = req.headers['x-user-email'];
        if (testEmail) {
            const user = store_1.MemoryStore.users.find((u) => u.email.toLowerCase() === testEmail.toLowerCase());
            if (user) {
                req.user = user;
                return next();
            }
        }
        // Usuario anónimo permitido si la ruta no exige rol estricto
        return next();
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        const user = store_1.MemoryStore.users.find((u) => u.id === decoded.id || u.email === decoded.email);
        if (user) {
            req.user = user;
        }
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Token de autenticación inválido o expirado' });
    }
}
