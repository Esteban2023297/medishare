"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = getHealthStatus;
const db_1 = require("../config/db");
async function getHealthStatus(req, res) {
    const dbStatus = await (0, db_1.checkDatabaseConnection)();
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'MediShare Backend API',
        version: '1.0.0',
        database: {
            engine: 'PostgreSQL',
            connected: dbStatus.connected,
            latencyMs: dbStatus.latencyMs,
            error: dbStatus.error,
        },
    });
}
