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
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'IN5BM',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'medishare_db',
    DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
    JWT_SECRET: process.env.JWT_SECRET || 'medishare_jwt_secret_production_2026_super_secure',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200',
};
