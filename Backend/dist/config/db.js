"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.checkDatabaseConnection = checkDatabaseConnection;
exports.isDbConnected = isDbConnected;
const pg_1 = require("pg");
const env_1 = require("./env");
exports.pool = new pg_1.Pool({
    connectionString: env_1.ENV.DATABASE_URL,
    ssl: env_1.ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
let isPostgresConnected = false;
async function checkDatabaseConnection() {
    const start = Date.now();
    try {
        const client = await exports.pool.connect();
        const res = await client.query('SELECT NOW() as current_time');
        client.release();
        const latency = Date.now() - start;
        isPostgresConnected = true;
        return { connected: true, latencyMs: latency };
    }
    catch (err) {
        isPostgresConnected = false;
        return {
            connected: false,
            latencyMs: Date.now() - start,
            error: 'Servidor PostgreSQL no conectado localmente. Modo de contingencia en memoria activo.',
        };
    }
}
function isDbConnected() {
    return isPostgresConnected;
}
