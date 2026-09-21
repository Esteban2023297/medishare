"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://medishare_admin:medishare_pass@localhost:5432/medishare_db',
    JWT_SECRET: process.env.JWT_SECRET || 'medishare_jwt_secret_production_2026_super_secure',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200',
};
